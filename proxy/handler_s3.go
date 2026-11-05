package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"path"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// The S3 API mirrors the Postgres one: every call carries the connection
// (endpoint, keys, bucket, region) because the proxy keeps no state. Failures
// answer with a real HTTP status and {"error": "..."}; the exception is
// /api/s3/test, which answers 200 with {"ok": false, "error": "..."} like
// /api/test does.

const (
	s3MaxDeleteKeys   = 10000            // objects removed by one delete call, folders included
	s3StatsMaxObjects = 100000           // bucket stats stop counting here and say so
	s3StatsBudget     = 20 * time.Second // ...or after this long
	s3MaxKeyBytes     = 1024             // S3's own limit

	defaultMaxUploadMB = 100
	uploadPath         = "/api/s3/object/upload"
)

// maxUploadBytes is the largest file the upload endpoint accepts.
func (cfg *config) maxUploadBytes() int64 {
	if cfg.MaxUploadMB > 0 {
		return cfg.MaxUploadMB << 20
	}
	return defaultMaxUploadMB << 20
}

func (cfg *config) links() *linkSealer {
	cfg.linksOnce.Do(func() { cfg.linkSeal, cfg.linkErr = newLinkSealer() })
	return cfg.linkSeal
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeS3Error(w http.ResponseWriter, err error, notFound string) {
	msg, status := s3Error(err, notFound)
	writeJSON(w, status, map[string]any{"error": msg})
}

// readS3Request checks the method and decodes the JSON body into dst.
func readS3Request(w http.ResponseWriter, r *http.Request, dst any) bool {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return false
	}
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		return false
	}
	return true
}

// validObjectKey rejects empty keys, keys over S3's limit and control characters.
func validObjectKey(key string) error {
	switch {
	case key == "":
		return s3Failure{"key is required", http.StatusBadRequest}
	case len(key) > s3MaxKeyBytes || !utf8.ValidString(key):
		return s3Failure{"key is too long or not valid UTF-8", http.StatusBadRequest}
	}
	for _, c := range key {
		if c < 0x20 || c == 0x7f {
			return s3Failure{"key contains control characters", http.StatusBadRequest}
		}
	}
	return nil
}

// POST /api/s3/test
func (cfg *config) handleS3Test(w http.ResponseWriter, r *http.Request) {
	var req s3Request
	if !readS3Request(w, r, &req) {
		return
	}
	fail := func(err error) {
		msg, _ := s3Error(err, "bucket not found")
		writeJSON(w, http.StatusOK, map[string]any{"ok": false, "error": msg})
	}
	conn, err := cfg.s3Open(req)
	if err != nil {
		fail(err)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	if err := testS3Conn(ctx, conn); err != nil {
		fail(err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":             true,
		"readOnly":       conn.readOnly,
		"maxUploadBytes": cfg.maxUploadBytes(),
	})
}

// POST /api/s3/objects
type s3ListRequest struct {
	s3Request
	Prefix            string `json:"prefix"`
	Delimiter         string `json:"delimiter"`
	ContinuationToken string `json:"continuationToken"`
}

type s3ObjectInfo struct {
	Key          string `json:"key"`
	Size         int64  `json:"size"`
	LastModified string `json:"lastModified"`
	IsFolder     bool   `json:"isFolder"`
}

// isFolderMarker is the zero-byte "folder/" object some tools create.
func isFolderMarker(key string, size int64) bool {
	return strings.HasSuffix(key, "/") && size == 0
}

func (cfg *config) handleS3Objects(w http.ResponseWriter, r *http.Request) {
	var req s3ListRequest
	if !readS3Request(w, r, &req) {
		return
	}
	conn, err := cfg.s3Open(req.s3Request)
	if err != nil {
		writeS3Error(w, err, "bucket not found")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	input := &s3.ListObjectsV2Input{Bucket: aws.String(conn.bucket)}
	if req.Prefix != "" {
		input.Prefix = aws.String(req.Prefix)
	}
	if req.Delimiter != "" {
		input.Delimiter = aws.String(req.Delimiter)
	}
	if req.ContinuationToken != "" {
		input.ContinuationToken = aws.String(req.ContinuationToken)
	}
	result, err := conn.client.ListObjectsV2(ctx, input)
	if err != nil {
		writeS3Error(w, err, "bucket not found")
		return
	}

	objects := make([]s3ObjectInfo, 0, len(result.Contents))
	for _, obj := range result.Contents {
		key, size := aws.ToString(obj.Key), aws.ToInt64(obj.Size)
		modified := ""
		if obj.LastModified != nil {
			modified = obj.LastModified.Format(time.RFC3339)
		}
		objects = append(objects, s3ObjectInfo{Key: key, Size: size, LastModified: modified, IsFolder: isFolderMarker(key, size)})
	}
	prefixes := make([]string, 0, len(result.CommonPrefixes))
	for _, p := range result.CommonPrefixes {
		prefixes = append(prefixes, aws.ToString(p.Prefix))
	}
	resp := map[string]any{"objects": objects, "prefixes": prefixes}
	if aws.ToBool(result.IsTruncated) && result.NextContinuationToken != nil {
		resp["nextToken"] = aws.ToString(result.NextContinuationToken)
	}
	writeJSON(w, http.StatusOK, resp)
}

// POST /api/s3/bucket/stats: object count and total size under a prefix.
// Counting stops at s3StatsMaxObjects or s3StatsBudget and says so.
type s3StatsRequest struct {
	s3Request
	Prefix string `json:"prefix"`
}

func (cfg *config) handleS3Stats(w http.ResponseWriter, r *http.Request) {
	var req s3StatsRequest
	if !readS3Request(w, r, &req) {
		return
	}
	conn, err := cfg.s3Open(req.s3Request)
	if err != nil {
		writeS3Error(w, err, "bucket not found")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), s3StatsBudget)
	defer cancel()

	input := &s3.ListObjectsV2Input{Bucket: aws.String(conn.bucket)}
	if req.Prefix != "" {
		input.Prefix = aws.String(req.Prefix)
	}
	var count, bytes int64
	truncated := false
	for {
		page, err := conn.client.ListObjectsV2(ctx, input)
		if err != nil {
			if count > 0 && errors.Is(err, context.DeadlineExceeded) {
				truncated = true
				break
			}
			writeS3Error(w, err, "bucket not found")
			return
		}
		for _, obj := range page.Contents {
			if size := aws.ToInt64(obj.Size); !isFolderMarker(aws.ToString(obj.Key), size) {
				count++
				bytes += size
			}
		}
		if !aws.ToBool(page.IsTruncated) || page.NextContinuationToken == nil {
			break
		}
		if count >= s3StatsMaxObjects {
			truncated = true
			break
		}
		input.ContinuationToken = page.NextContinuationToken
	}
	writeJSON(w, http.StatusOK, map[string]any{"objects": count, "bytes": bytes, "truncated": truncated})
}

// POST /api/s3/object/meta
type s3MetaRequest struct {
	s3Request
	Key string `json:"key"`
}

func (cfg *config) handleS3ObjectMeta(w http.ResponseWriter, r *http.Request) {
	var req s3MetaRequest
	if !readS3Request(w, r, &req) {
		return
	}
	conn, err := cfg.s3Open(req.s3Request)
	if err == nil {
		err = validObjectKey(req.Key)
	}
	if err != nil {
		writeS3Error(w, err, "object not found")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	head, err := conn.client.HeadObject(ctx, &s3.HeadObjectInput{Bucket: aws.String(conn.bucket), Key: aws.String(req.Key)})
	if err != nil {
		writeS3Error(w, err, "object not found")
		return
	}
	modified := ""
	if head.LastModified != nil {
		modified = head.LastModified.Format(time.RFC3339)
	}
	metadata := make(map[string]string, len(head.Metadata))
	for k, v := range head.Metadata {
		metadata[k] = v
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"key":          req.Key,
		"size":         aws.ToInt64(head.ContentLength),
		"lastModified": modified,
		"contentType":  aws.ToString(head.ContentType),
		"metadata":     metadata,
	})
}

// POST /api/s3/object/delete removes objects and, recursively, folders.
type s3DeleteRequest struct {
	s3Request
	Keys     []string `json:"keys"`
	Prefixes []string `json:"prefixes"` // folders: every object under each prefix
}

type s3DeleteFailure struct {
	Key   string `json:"key"`
	Error string `json:"error"`
}

func (cfg *config) handleS3ObjectDelete(w http.ResponseWriter, r *http.Request) {
	var req s3DeleteRequest
	if !readS3Request(w, r, &req) {
		return
	}
	conn, err := cfg.s3Open(req.s3Request)
	if err == nil {
		err = conn.requireWritable()
	}
	if err == nil && len(req.Keys)+len(req.Prefixes) == 0 {
		err = s3Failure{"keys or prefixes are required", http.StatusBadRequest}
	}
	if err != nil {
		writeS3Error(w, err, "object not found")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()

	keys := append([]string(nil), req.Keys...)
	for _, prefix := range req.Prefixes {
		if prefix == "" || !strings.HasSuffix(prefix, "/") {
			writeS3Error(w, s3Failure{"a folder prefix must end with /", http.StatusBadRequest}, "")
			return
		}
		under, err := listKeys(ctx, conn, prefix, s3MaxDeleteKeys-len(keys))
		if err != nil {
			writeS3Error(w, err, "bucket not found")
			return
		}
		keys = append(keys, under...)
	}
	if len(keys) > s3MaxDeleteKeys {
		writeS3Error(w, tooManyObjects(), "")
		return
	}

	deleted, failed := 0, []s3DeleteFailure{}
	for start := 0; start < len(keys); start += 1000 {
		batch := keys[start:min(start+1000, len(keys))]
		ids := make([]types.ObjectIdentifier, len(batch))
		for i, key := range batch {
			ids[i] = types.ObjectIdentifier{Key: aws.String(key)}
		}
		out, err := conn.client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
			Bucket: aws.String(conn.bucket),
			Delete: &types.Delete{Objects: ids, Quiet: aws.Bool(true)},
		})
		if err != nil {
			if deleted == 0 && len(failed) == 0 {
				writeS3Error(w, err, "object not found")
				return
			}
			msg, _ := s3Error(err, "object not found")
			for _, key := range batch {
				failed = append(failed, s3DeleteFailure{Key: key, Error: msg})
			}
			continue
		}
		deleted += len(batch) - len(out.Errors)
		for _, e := range out.Errors {
			failed = append(failed, s3DeleteFailure{Key: aws.ToString(e.Key), Error: truncate(aws.ToString(e.Code)+": "+aws.ToString(e.Message), 200)})
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": deleted, "failed": failed})
}

func tooManyObjects() error {
	return s3Failure{fmt.Sprintf("that is more than %d objects: remove them with the AWS CLI or a lifecycle rule", s3MaxDeleteKeys), http.StatusBadRequest}
}

// listKeys lists every key under prefix, failing when there are more than limit.
func listKeys(ctx context.Context, conn *s3Conn, prefix string, limit int) ([]string, error) {
	input := &s3.ListObjectsV2Input{Bucket: aws.String(conn.bucket), Prefix: aws.String(prefix)}
	var keys []string
	for {
		page, err := conn.client.ListObjectsV2(ctx, input)
		if err != nil {
			return nil, err
		}
		for _, obj := range page.Contents {
			keys = append(keys, aws.ToString(obj.Key))
		}
		if len(keys) > limit {
			return nil, tooManyObjects()
		}
		if !aws.ToBool(page.IsTruncated) || page.NextContinuationToken == nil {
			return keys, nil
		}
		input.ContinuationToken = page.NextContinuationToken
	}
}

// POST /api/s3/folder/create makes an empty "folder/" object. S3 has no real
// folders; this is the same marker the AWS console creates.
type s3FolderRequest struct {
	s3Request
	Prefix string `json:"prefix"`
}

func (cfg *config) handleS3FolderCreate(w http.ResponseWriter, r *http.Request) {
	var req s3FolderRequest
	if !readS3Request(w, r, &req) {
		return
	}
	conn, err := cfg.s3Open(req.s3Request)
	if err == nil {
		err = conn.requireWritable()
	}
	if err == nil {
		err = validObjectKey(req.Prefix)
	}
	if err == nil && (!strings.HasSuffix(req.Prefix, "/") || strings.HasPrefix(req.Prefix, "/") || strings.Contains(req.Prefix, "//")) {
		err = s3Failure{"a folder name can't be empty or contain //", http.StatusBadRequest}
	}
	if err != nil {
		writeS3Error(w, err, "bucket not found")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	if _, err := conn.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(conn.bucket),
		Key:           aws.String(req.Prefix),
		Body:          strings.NewReader(""),
		ContentLength: aws.Int64(0),
	}); err != nil {
		writeS3Error(w, err, "bucket not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"prefix": req.Prefix})
}

// POST /api/s3/object/upload (multipart). The one API route with a larger
// body limit than the middleware's 1 MB (see withMiddleware).
func (cfg *config) handleS3ObjectUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	limit := cfg.maxUploadBytes()
	r.Body = http.MaxBytesReader(w, r.Body, limit+(1<<20)) // the file plus the form fields
	if err := r.ParseMultipartForm(8 << 20); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			writeS3Error(w, s3Failure{fmt.Sprintf("the file is larger than the %d MB upload limit", limit>>20), http.StatusRequestEntityTooLarge}, "")
		} else {
			writeS3Error(w, s3Failure{"could not read the upload", http.StatusBadRequest}, "")
		}
		return
	}
	defer r.MultipartForm.RemoveAll()

	conn, err := cfg.s3Open(s3Request{
		Endpoint:  r.FormValue("endpoint"),
		AccessKey: r.FormValue("accessKey"),
		SecretKey: r.FormValue("secretKey"),
		Bucket:    r.FormValue("bucket"),
		Region:    r.FormValue("region"),
	})
	if err == nil {
		err = conn.requireWritable()
	}
	key := r.FormValue("key")
	if err == nil {
		err = validObjectKey(key)
	}
	if err == nil && strings.HasSuffix(key, "/") {
		err = s3Failure{"a file name can't end with /", http.StatusBadRequest}
	}
	if err != nil {
		writeS3Error(w, err, "bucket not found")
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		writeS3Error(w, s3Failure{"file is required", http.StatusBadRequest}, "")
		return
	}
	defer file.Close()
	if header.Size > limit {
		writeS3Error(w, s3Failure{fmt.Sprintf("the file is larger than the %d MB upload limit", limit>>20), http.StatusRequestEntityTooLarge}, "")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Minute)
	defer cancel()
	if _, err := conn.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(conn.bucket),
		Key:           aws.String(key),
		Body:          file,
		ContentLength: aws.Int64(header.Size),
		ContentType:   aws.String(uploadContentType(header.Header.Get("Content-Type"), key)),
	}); err != nil {
		writeS3Error(w, err, "bucket not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"key": key, "size": header.Size})
}

func uploadContentType(sent, key string) string {
	if sent != "" && sent != "application/octet-stream" {
		return sent
	}
	if guessed := mime.TypeByExtension(path.Ext(key)); guessed != "" {
		return guessed
	}
	return "application/octet-stream"
}

// POST /api/s3/object/link returns a short-lived URL for previewing or
// downloading one object. See s3_link.go for why it is a sealed token.
type s3LinkRequest struct {
	s3Request
	Key    string `json:"key"`
	Inline bool   `json:"inline"`
}

func (cfg *config) handleS3ObjectLink(w http.ResponseWriter, r *http.Request) {
	var req s3LinkRequest
	if !readS3Request(w, r, &req) {
		return
	}
	_, err := cfg.s3Open(req.s3Request)
	if err == nil {
		err = validObjectKey(req.Key)
	}
	sealer := cfg.links()
	if err == nil && sealer == nil {
		err = s3Failure{"could not create a download link", http.StatusInternalServerError}
	}
	var token string
	if err == nil {
		token, err = sealer.seal(linkPayload{Req: req.s3Request, Key: req.Key, Inline: req.Inline, Exp: time.Now().Add(linkTTL).Unix()})
	}
	if err != nil {
		writeS3Error(w, err, "object not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"url": "/api/s3/object/download?t=" + token})
}

// GET /api/s3/object/download?t=<token from /link>. Supports Range requests,
// so video and audio can seek.
//
// The object's bytes are served from the app's own origin, so they must never
// run as a page: anything but a PDF is sent as an attachment under a sandbox
// CSP, whatever content type the bucket claims. Previews load them through
// <img>, <video>, <audio> and fetch(), none of which execute them.
func (cfg *config) handleS3ObjectDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	sealer := cfg.links()
	if sealer == nil {
		http.Error(w, "could not open the download link", http.StatusInternalServerError)
		return
	}
	link, err := sealer.open(r.URL.Query().Get("t"), time.Now())
	if err != nil {
		http.Error(w, err.Error(), http.StatusGone)
		return
	}
	conn, err := cfg.s3Open(link.Req)
	if err != nil {
		msg, status := s3Error(err, "object not found")
		http.Error(w, msg, status)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Minute)
	defer cancel()
	input := &s3.GetObjectInput{Bucket: aws.String(conn.bucket), Key: aws.String(link.Key)}
	if rng := r.Header.Get("Range"); rng != "" {
		input.Range = aws.String(rng)
	}
	result, err := conn.client.GetObject(ctx, input)
	if err != nil {
		msg, status := s3Error(err, "object not found")
		http.Error(w, msg, status)
		return
	}
	defer result.Body.Close()

	contentType := aws.ToString(result.ContentType)
	base, _, _ := mime.ParseMediaType(contentType)
	showInPage := link.Inline && (base == "application/pdf" || strings.HasSuffix(strings.ToLower(link.Key), ".pdf"))

	h := w.Header()
	if showInPage {
		h.Set("Content-Type", "application/pdf")
		h.Set("Content-Disposition", mime.FormatMediaType("inline", map[string]string{"filename": fileName(link.Key)}))
		h.Set("X-Frame-Options", "SAMEORIGIN") // the preview frames it
	} else {
		if contentType != "" {
			h.Set("Content-Type", contentType)
		}
		h.Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": fileName(link.Key)}))
		h.Set("Content-Security-Policy", "sandbox")
	}
	h.Set("Accept-Ranges", "bytes")
	h.Set("Cache-Control", "private, max-age=60")
	if result.ContentLength != nil {
		h.Set("Content-Length", fmt.Sprint(*result.ContentLength))
	}
	if result.LastModified != nil {
		h.Set("Last-Modified", result.LastModified.UTC().Format(http.TimeFormat))
	}
	if result.ETag != nil {
		h.Set("ETag", aws.ToString(result.ETag))
	}
	if result.ContentRange != nil {
		h.Set("Content-Range", aws.ToString(result.ContentRange))
		w.WriteHeader(http.StatusPartialContent)
	}
	io.Copy(w, result.Body)
}

// fileName is the last path segment of a key, without control characters.
func fileName(key string) string {
	name := key[strings.LastIndex(key, "/")+1:]
	return strings.Map(func(r rune) rune {
		if r < 0x20 || r == 0x7f {
			return -1
		}
		return r
	}, name)
}
