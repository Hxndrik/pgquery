package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// POST /api/s3/test
func handleS3Test(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req s3Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, map[string]any{"ok": false, "error": "invalid request"})
		return
	}
	if err := req.validate(); err != nil {
		writeJSON(w, map[string]any{"ok": false, "error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	if err := testS3Conn(ctx, req); err != nil {
		writeJSON(w, map[string]any{"ok": false, "error": err.Error()})
		return
	}
	writeJSON(w, map[string]any{"ok": true})
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

func handleS3Objects(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req s3ListRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, map[string]any{"error": "invalid request"})
		return
	}
	if err := req.validate(); err != nil {
		writeJSON(w, map[string]any{"error": err.Error()})
		return
	}

	client := newS3Client(req.s3Request)
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(req.Bucket),
	}
	if req.Prefix != "" {
		input.Prefix = aws.String(req.Prefix)
	}
	if req.Delimiter != "" {
		input.Delimiter = aws.String(req.Delimiter)
	}
	if req.ContinuationToken != "" {
		input.ContinuationToken = aws.String(req.ContinuationToken)
	}

	result, err := client.ListObjectsV2(ctx, input)
	if err != nil {
		writeJSON(w, map[string]any{"error": err.Error()})
		return
	}

	objects := make([]s3ObjectInfo, 0, len(result.Contents))
	for _, obj := range result.Contents {
		key := aws.ToString(obj.Key)
		size := aws.ToInt64(obj.Size)
		isFolder := strings.HasSuffix(key, "/") && size == 0
		modified := ""
		if obj.LastModified != nil {
			modified = obj.LastModified.Format(time.RFC3339)
		}
		objects = append(objects, s3ObjectInfo{
			Key:          key,
			Size:         size,
			LastModified: modified,
			IsFolder:     isFolder,
		})
	}

	prefixes := make([]string, 0, len(result.CommonPrefixes))
	for _, p := range result.CommonPrefixes {
		prefixes = append(prefixes, aws.ToString(p.Prefix))
	}

	resp := map[string]any{
		"objects":  objects,
		"prefixes": prefixes,
	}
	if result.NextContinuationToken != nil {
		resp["nextToken"] = aws.ToString(result.NextContinuationToken)
	}
	writeJSON(w, resp)
}

// POST /api/s3/object/meta
type s3MetaRequest struct {
	s3Request
	Key string `json:"key"`
}

func handleS3ObjectMeta(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req s3MetaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, map[string]any{"error": "invalid request"})
		return
	}
	if err := req.validate(); err != nil {
		writeJSON(w, map[string]any{"error": err.Error()})
		return
	}
	if req.Key == "" {
		writeJSON(w, map[string]any{"error": "key is required"})
		return
	}

	client := newS3Client(req.s3Request)
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	head, err := client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(req.Bucket),
		Key:    aws.String(req.Key),
	})
	if err != nil {
		writeJSON(w, map[string]any{"error": err.Error()})
		return
	}

	modified := ""
	if head.LastModified != nil {
		modified = head.LastModified.Format(time.RFC3339)
	}

	metadata := make(map[string]string)
	for k, v := range head.Metadata {
		metadata[k] = v
	}

	writeJSON(w, map[string]any{
		"key":          req.Key,
		"size":         head.ContentLength,
		"lastModified": modified,
		"contentType":  aws.ToString(head.ContentType),
		"metadata":     metadata,
	})
}

// POST /api/s3/object/delete
type s3DeleteRequest struct {
	s3Request
	Keys []string `json:"keys"`
}

func handleS3ObjectDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req s3DeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, map[string]any{"error": "invalid request"})
		return
	}
	if err := req.validate(); err != nil {
		writeJSON(w, map[string]any{"error": err.Error()})
		return
	}
	if len(req.Keys) == 0 {
		writeJSON(w, map[string]any{"error": "keys is required"})
		return
	}

	client := newS3Client(req.s3Request)
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	objects := make([]types.ObjectIdentifier, len(req.Keys))
	for i, key := range req.Keys {
		objects[i] = types.ObjectIdentifier{Key: aws.String(key)}
	}

	result, err := client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
		Bucket: aws.String(req.Bucket),
		Delete: &types.Delete{
			Objects: objects,
			Quiet:   aws.Bool(true),
		},
	})
	if err != nil {
		writeJSON(w, map[string]any{"error": err.Error()})
		return
	}

	deleted := len(req.Keys)
	if result != nil && result.Errors != nil {
		deleted -= len(result.Errors)
	}
	writeJSON(w, map[string]any{"deleted": deleted})
}

// POST /api/s3/object/upload (multipart)
func handleS3ObjectUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(32 << 20); err != nil { // 32MB
		writeJSON(w, map[string]any{"error": "failed to parse multipart form"})
		return
	}

	req := s3Request{
		Endpoint:  r.FormValue("endpoint"),
		AccessKey: r.FormValue("accessKey"),
		SecretKey: r.FormValue("secretKey"),
		Bucket:    r.FormValue("bucket"),
		Region:    r.FormValue("region"),
	}
	if err := req.validate(); err != nil {
		writeJSON(w, map[string]any{"error": err.Error()})
		return
	}

	key := r.FormValue("key")
	if key == "" {
		writeJSON(w, map[string]any{"error": "key is required"})
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, map[string]any{"error": "file is required"})
		return
	}
	defer file.Close()

	client := newS3Client(req)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	_, err = client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(req.Bucket),
		Key:         aws.String(key),
		Body:        file,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		writeJSON(w, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, map[string]any{
		"key":  key,
		"size": header.Size,
	})
}

// GET /api/s3/object/download
func handleS3ObjectDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	q := r.URL.Query()
	req := s3Request{
		Endpoint:  q.Get("endpoint"),
		AccessKey: q.Get("accessKey"),
		SecretKey: q.Get("secretKey"),
		Bucket:    q.Get("bucket"),
		Region:    q.Get("region"),
	}
	if err := req.validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	key := q.Get("key")
	if key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}

	client := newS3Client(req)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	result, err := client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(req.Bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer result.Body.Close()

	// Extract filename from key
	parts := strings.Split(key, "/")
	filename := parts[len(parts)-1]

	if result.ContentType != nil {
		w.Header().Set("Content-Type", aws.ToString(result.ContentType))
	}
	if q.Get("inline") == "1" {
		w.Header().Set("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, filename))
	} else {
		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	}
	if result.ContentLength != nil {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", *result.ContentLength))
	}

	io.Copy(w, result.Body)
}

func writeJSON(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
