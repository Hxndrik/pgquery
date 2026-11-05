package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/fs"
	"mime/multipart"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"slices"
	"strings"
	"testing"
	"time"
)

// ── helpers ────────────────────────────────────────────────────────────────

func s3Conn4(f *fakeS3, bucket string) map[string]any {
	return map[string]any{"endpoint": f.srv.URL, "accessKey": "AK", "secretKey": "SK", "bucket": bucket, "region": "us-east-1"}
}

func with(m map[string]any, extra map[string]any) map[string]any {
	out := map[string]any{}
	for k, v := range m {
		out[k] = v
	}
	for k, v := range extra {
		out[k] = v
	}
	return out
}

// call POSTs body as JSON to h and decodes the JSON answer.
func call(t *testing.T, h http.HandlerFunc, body any) (*httptest.ResponseRecorder, map[string]any) {
	t.Helper()
	raw, _ := json.Marshal(body)
	rec := httptest.NewRecorder()
	h(rec, httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(raw)))
	var out map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	return rec, out
}

func errText(out map[string]any) string {
	s, _ := out["error"].(string)
	return s
}

func multipartUpload(t *testing.T, fields map[string]string, filename string, content []byte) (*bytes.Buffer, string) {
	t.Helper()
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	for k, v := range fields {
		mw.WriteField(k, v)
	}
	fw, err := mw.CreateFormFile("file", filename)
	if err != nil {
		t.Fatal(err)
	}
	fw.Write(content)
	mw.Close()
	return &buf, mw.FormDataContentType()
}

func uploadFields(f *fakeS3, bucket, key string) map[string]string {
	return map[string]string{"endpoint": f.srv.URL, "accessKey": "AK", "secretKey": "SK", "bucket": bucket, "region": "us-east-1", "key": key}
}

func upload(t *testing.T, h http.HandlerFunc, fields map[string]string, filename string, content []byte) (*httptest.ResponseRecorder, map[string]any) {
	t.Helper()
	body, ctype := multipartUpload(t, fields, filename, content)
	req := httptest.NewRequest(http.MethodPost, uploadPath, body)
	req.Header.Set("Content-Type", ctype)
	rec := httptest.NewRecorder()
	h(rec, req)
	var out map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	return rec, out
}

// downloadURL asks /link for a URL and returns it.
func downloadURL(t *testing.T, cfg *config, conn map[string]any, key string, inline bool) string {
	t.Helper()
	rec, out := call(t, cfg.handleS3ObjectLink, with(conn, map[string]any{"key": key, "inline": inline}))
	u, _ := out["url"].(string)
	if rec.Code != http.StatusOK || u == "" {
		t.Fatalf("link: %d %v", rec.Code, out)
	}
	return u
}

func get(cfg *config, target string, headers map[string]string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, target, nil)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	cfg.handleS3ObjectDownload(rec, req)
	return rec
}

// ── listing, paging, stats ─────────────────────────────────────────────────

func TestS3ListFoldersAndPaging(t *testing.T) {
	f := newFakeS3(t)
	f.pageSize = 2
	for _, k := range []string{"a.txt", "b.txt", "c.txt", "docs/one.md", "docs/two.md", "docs/sub/x.md", "empty/"} {
		f.put("b", k, "text/plain", []byte("hi"))
	}
	f.put("b", "empty/", "", nil) // a zero-byte folder marker
	cfg := &config{}

	// Root listing with a delimiter, followed page by page.
	var objects, prefixes []string
	token := ""
	for pages := 0; ; pages++ {
		if pages > 5 {
			t.Fatal("paging did not finish")
		}
		rec, out := call(t, cfg.handleS3Objects, with(s3Conn4(f, "b"), map[string]any{"delimiter": "/", "continuationToken": token}))
		if rec.Code != http.StatusOK {
			t.Fatalf("list: %d %v", rec.Code, out)
		}
		for _, o := range out["objects"].([]any) {
			objects = append(objects, o.(map[string]any)["key"].(string))
		}
		for _, p := range out["prefixes"].([]any) {
			prefixes = append(prefixes, p.(string))
		}
		next, _ := out["nextToken"].(string)
		if next == "" {
			break
		}
		token = next
	}
	if want := []string{"a.txt", "b.txt", "c.txt"}; !slices.Equal(objects, want) {
		t.Errorf("objects = %v, want %v", objects, want)
	}
	if want := []string{"docs/", "empty/"}; !slices.Equal(prefixes, want) {
		t.Errorf("prefixes = %v, want %v", prefixes, want)
	}

	// Inside a folder the zero-byte marker is flagged, so the UI can hide it.
	f.pageSize = 100
	_, out := call(t, cfg.handleS3Objects, with(s3Conn4(f, "b"), map[string]any{"prefix": "empty/", "delimiter": "/"}))
	items := out["objects"].([]any)
	if len(items) != 1 || items[0].(map[string]any)["isFolder"] != true {
		t.Errorf("folder marker not flagged: %v", items)
	}
}

func TestS3StatsPagesAndSkipsMarkers(t *testing.T) {
	f := newFakeS3(t)
	f.pageSize = 3
	for i := range 10 {
		f.put("b", "f/"+string(rune('a'+i)), "text/plain", []byte("12345"))
	}
	f.put("b", "f/", "", nil) // marker: not an object
	cfg := &config{}
	rec, out := call(t, cfg.handleS3Stats, s3Conn4(f, "b"))
	if rec.Code != http.StatusOK || out["objects"] != float64(10) || out["bytes"] != float64(50) || out["truncated"] != false {
		t.Errorf("stats = %d %v", rec.Code, out)
	}
	_, out = call(t, cfg.handleS3Stats, with(s3Conn4(f, "b"), map[string]any{"prefix": "f/a"}))
	if out["objects"] != float64(1) {
		t.Errorf("prefix stats = %v", out)
	}
}

// ── connection test and errors ─────────────────────────────────────────────

func TestS3TestReportsLimitsAndReadOnly(t *testing.T) {
	f := newFakeS3(t)
	f.put("b", "x", "text/plain", nil)
	cfg := &config{MaxUploadMB: 7}
	rec, out := call(t, cfg.handleS3Test, s3Conn4(f, "b"))
	if rec.Code != http.StatusOK || out["ok"] != true || out["readOnly"] != false || out["maxUploadBytes"] != float64(7<<20) {
		t.Errorf("test = %d %v", rec.Code, out)
	}
}

func TestS3ErrorsAreReadable(t *testing.T) {
	f := newFakeS3(t)
	f.put("b", "x", "text/plain", []byte("x"))
	cfg := &config{}

	closed, _ := net.Listen("tcp", "127.0.0.1:0")
	deadURL := "http://" + closed.Addr().String()
	closed.Close()

	cases := []struct {
		name    string
		h       http.HandlerFunc
		body    map[string]any
		status  int
		message string
	}{
		{"denied", cfg.handleS3Objects, s3Conn4(f, "denied"), 403, "access denied"},
		{"no such bucket", cfg.handleS3Objects, s3Conn4(f, "nope"), 404, "bucket not found"},
		{"no such object", cfg.handleS3ObjectMeta, with(s3Conn4(f, "b"), map[string]any{"key": "missing"}), 404, "object not found"},
		{"bad scheme", cfg.handleS3Objects, with(s3Conn4(f, "b"), map[string]any{"endpoint": "ftp://x"}), 400, "http:// or https://"},
		{"no endpoint", cfg.handleS3Objects, with(s3Conn4(f, "b"), map[string]any{"endpoint": ""}), 400, "endpoint is required"},
		{"no secret", cfg.handleS3Objects, with(s3Conn4(f, "b"), map[string]any{"secretKey": ""}), 400, "secretKey is required"},
		{"unreachable", cfg.handleS3Objects, with(s3Conn4(f, "b"), map[string]any{"endpoint": deadURL}), 502, "could not reach the storage endpoint"},
	}
	for _, c := range cases {
		rec, out := call(t, c.h, c.body)
		if rec.Code != c.status || !strings.Contains(errText(out), c.message) {
			t.Errorf("%s: got %d %q, want %d containing %q", c.name, rec.Code, errText(out), c.status, c.message)
		}
		if strings.Contains(rec.Body.String(), "SK") {
			t.Errorf("%s: the secret key leaked into the response", c.name)
		}
	}

	// The connection test keeps its 200 + {ok:false} contract.
	rec, out := call(t, cfg.handleS3Test, s3Conn4(f, "nope"))
	if rec.Code != http.StatusOK || out["ok"] != false || errText(out) != "bucket not found" {
		t.Errorf("test on a missing bucket = %d %v", rec.Code, out)
	}
}

func TestS3RefusesPrivateAddressesOnPublicInstances(t *testing.T) {
	f := newFakeS3(t) // listens on 127.0.0.1
	public := &config{BlockPrivateHosts: true}
	for _, endpoint := range []string{f.srv.URL, "http://localhost:9000", "http://169.254.169.254", "http://[::1]:9000", "http://10.0.0.5"} {
		rec, out := call(t, public.handleS3Objects, with(s3Conn4(f, "b"), map[string]any{"endpoint": endpoint}))
		if rec.Code != http.StatusForbidden || errText(out) != errBlockedHost.msg {
			t.Errorf("%s: got %d %q, want 403 %q", endpoint, rec.Code, errText(out), errBlockedHost.msg)
		}
	}
	// A self-hosted instance (no demo configured) can reach local storage.
	f.put("b", "x", "text/plain", []byte("x"))
	if rec, out := call(t, (&config{}).handleS3Objects, s3Conn4(f, "b")); rec.Code != http.StatusOK {
		t.Errorf("self-hosted list = %d %v", rec.Code, out)
	}
}

// ── links and downloads ────────────────────────────────────────────────────

func TestS3LinkTokens(t *testing.T) {
	s, err := newLinkSealer()
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	p := linkPayload{Req: s3Request{Endpoint: "https://s3.example.com", AccessKey: "AKIA", SecretKey: "topsecret", Bucket: "b"}, Key: "a/b.png", Exp: now.Add(time.Hour).Unix()}
	token, err := s.seal(p)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(token, "topsecret") || strings.Contains(token, "AKIA") {
		t.Fatal("the token shows the credentials")
	}
	got, err := s.open(token, now)
	if err != nil || got != p {
		t.Fatalf("round trip = %+v, %v", got, err)
	}
	if _, err := s.open(token, now.Add(2*time.Hour)); !errors.Is(err, errBadLink) {
		t.Errorf("expired token: %v", err)
	}
	tampered := token[:len(token)-2] + "AA"
	if _, err := s.open(tampered, now); !errors.Is(err, errBadLink) {
		t.Errorf("tampered token: %v", err)
	}
	other, _ := newLinkSealer()
	if _, err := other.open(token, now); !errors.Is(err, errBadLink) {
		t.Errorf("token from another process: %v", err)
	}
	for _, junk := range []string{"", "x", "!!!", strings.Repeat("A", 8)} {
		if _, err := s.open(junk, now); !errors.Is(err, errBadLink) {
			t.Errorf("open(%q): %v", junk, err)
		}
	}
}

func TestS3DownloadNeedsASealedLink(t *testing.T) {
	f := newFakeS3(t)
	f.put("b", "x.txt", "text/plain", []byte("x"))
	cfg := &config{}
	// The old form, credentials in the query string, no longer works.
	old := "/api/s3/object/download?endpoint=" + url.QueryEscape(f.srv.URL) + "&accessKey=AK&secretKey=SK&bucket=b&key=x.txt"
	if rec := get(cfg, old, nil); rec.Code != http.StatusGone {
		t.Errorf("credentials in the URL: %d, want 410", rec.Code)
	}
	if rec := get(cfg, "/api/s3/object/download?t=garbage", nil); rec.Code != http.StatusGone {
		t.Errorf("garbage token: %d, want 410", rec.Code)
	}
	u := downloadURL(t, cfg, s3Conn4(f, "b"), "x.txt", false)
	if strings.Contains(u, "SK") || strings.Contains(u, f.srv.URL) {
		t.Errorf("the link exposes the connection: %s", u)
	}
}

func TestS3DownloadRangeAndHeaders(t *testing.T) {
	f := newFakeS3(t)
	f.put("b", "clips/vid éo.mp4", "video/mp4", []byte("0123456789"))
	cfg := &config{}
	u := downloadURL(t, cfg, s3Conn4(f, "b"), "clips/vid éo.mp4", false)

	full := get(cfg, u, nil)
	if full.Code != 200 || full.Body.String() != "0123456789" || full.Header().Get("Accept-Ranges") != "bytes" {
		t.Errorf("full: %d %q %v", full.Code, full.Body.String(), full.Header())
	}
	cd := full.Header().Get("Content-Disposition")
	if !strings.HasPrefix(cd, "attachment;") || !strings.Contains(cd, "vid") {
		t.Errorf("Content-Disposition = %q", cd)
	}

	part := get(cfg, u, map[string]string{"Range": "bytes=2-5"})
	if part.Code != http.StatusPartialContent || part.Body.String() != "2345" || part.Header().Get("Content-Range") != "bytes 2-5/10" {
		t.Errorf("range: %d %q %q", part.Code, part.Body.String(), part.Header().Get("Content-Range"))
	}
	if bad := get(cfg, u, map[string]string{"Range": "bytes=50-60"}); bad.Code != http.StatusRequestedRangeNotSatisfiable {
		t.Errorf("unsatisfiable range: %d", bad.Code)
	}
	missing := downloadURL(t, cfg, s3Conn4(f, "b"), "nope.txt", false)
	if rec := get(cfg, missing, nil); rec.Code != http.StatusNotFound {
		t.Errorf("missing object: %d", rec.Code)
	}
}

// Objects are served from the app's own origin, so a hostile bucket must not
// be able to make one run as a page there.
func TestS3DownloadNeverRendersBucketContent(t *testing.T) {
	f := newFakeS3(t)
	f.put("b", "evil.html", "text/html", []byte("<script>alert(1)</script>"))
	f.put("b", "evil.svg", "image/svg+xml", []byte("<svg onload=alert(1)/>"))
	f.put("b", "report.pdf", "application/pdf", []byte("%PDF-1.4"))
	f.put("b", "scan.pdf", "binary/octet-stream", []byte("%PDF-1.4"))
	cfg := &config{}

	for _, key := range []string{"evil.html", "evil.svg"} {
		for _, inline := range []bool{false, true} { // inline is only honored for PDFs
			rec := get(cfg, downloadURL(t, cfg, s3Conn4(f, "b"), key, inline), nil)
			if cd := rec.Header().Get("Content-Disposition"); !strings.HasPrefix(cd, "attachment") {
				t.Errorf("%s inline=%v: Content-Disposition %q", key, inline, cd)
			}
			if csp := rec.Header().Get("Content-Security-Policy"); csp != "sandbox" {
				t.Errorf("%s inline=%v: CSP %q", key, inline, csp)
			}
		}
	}
	for _, key := range []string{"report.pdf", "scan.pdf"} {
		rec := get(cfg, downloadURL(t, cfg, s3Conn4(f, "b"), key, true), nil)
		if rec.Header().Get("Content-Type") != "application/pdf" || !strings.HasPrefix(rec.Header().Get("Content-Disposition"), "inline") {
			t.Errorf("%s: inline PDF headers = %v", key, rec.Header())
		}
		if rec.Header().Get("X-Frame-Options") != "SAMEORIGIN" {
			t.Errorf("%s: the PDF preview can't be framed", key)
		}
		// Without the inline flag a PDF is a download like any other file.
		rec = get(cfg, downloadURL(t, cfg, s3Conn4(f, "b"), key, false), nil)
		if !strings.HasPrefix(rec.Header().Get("Content-Disposition"), "attachment") {
			t.Errorf("%s: PDF without inline = %q", key, rec.Header().Get("Content-Disposition"))
		}
	}
}

// ── writes ─────────────────────────────────────────────────────────────────

func TestS3Upload(t *testing.T) {
	f := newFakeS3(t)
	f.put("b", "keep", "text/plain", nil)
	cfg := &config{MaxUploadMB: 1}

	rec, out := upload(t, cfg.handleS3ObjectUpload, uploadFields(f, "b", "notes/readme.md"), "readme.md", []byte("# hello"))
	if rec.Code != 200 || out["key"] != "notes/readme.md" || out["size"] != float64(7) {
		t.Fatalf("upload: %d %v", rec.Code, out)
	}
	if o, ok := f.get("b", "notes/readme.md"); !ok || string(o.body) != "# hello" || !strings.HasPrefix(o.ctype, "text/markdown") {
		t.Errorf("stored %+v %v", o, ok)
	}

	// Bigger than the limit: 413 with a message that names the limit, whether the
	// file overshoots a little or a lot.
	for _, size := range []int{(1 << 20) + 1000, 3 << 20} {
		rec, out = upload(t, cfg.handleS3ObjectUpload, uploadFields(f, "b", "big.bin"), "big.bin", bytes.Repeat([]byte{1}, size))
		if rec.Code != http.StatusRequestEntityTooLarge || !strings.Contains(errText(out), "1 MB upload limit") {
			t.Errorf("%d bytes: %d %v", size, rec.Code, out)
		}
	}
	if _, ok := f.get("b", "big.bin"); ok {
		t.Error("an oversized file was stored")
	}

	for key, want := range map[string]string{"": "key is required", "dir/": "can't end with /", "bad\x00key": "control characters"} {
		rec, out = upload(t, cfg.handleS3ObjectUpload, uploadFields(f, "b", key), "x", []byte("x"))
		if rec.Code != http.StatusBadRequest || !strings.Contains(errText(out), want) {
			t.Errorf("key %q: %d %v", key, rec.Code, out)
		}
	}
}

// Uploads may be larger than the 1 MB every other API call is held to.
func TestMiddlewareLimitsEverythingButUploads(t *testing.T) {
	f := newFakeS3(t)
	f.put("b", "x", "text/plain", nil)
	cfg := &config{MaxUploadMB: 5}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/s3/objects", cfg.handleS3Objects)
	mux.HandleFunc(uploadPath, cfg.handleS3ObjectUpload)
	h := withMiddleware(mux, newRateLimiter(1000))

	body, ctype := multipartUpload(t, uploadFields(f, "b", "two-mb.bin"), "two-mb.bin", bytes.Repeat([]byte{7}, 2<<20))
	req := httptest.NewRequest(http.MethodPost, uploadPath, body)
	req.Header.Set("Content-Type", ctype)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Fatalf("2 MB upload through the middleware: %d %s", rec.Code, rec.Body)
	}
	if o, _ := f.get("b", "two-mb.bin"); len(o.body) != 2<<20 {
		t.Errorf("stored %d bytes", len(o.body))
	}

	big, _ := json.Marshal(with(s3Conn4(f, "b"), map[string]any{"prefix": strings.Repeat("p", 2<<20)}))
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/s3/objects", bytes.NewReader(big)))
	if rec.Code != http.StatusBadRequest {
		t.Errorf("2 MB JSON body: %d, want 400", rec.Code)
	}
}

func TestS3DeleteKeysAndFolders(t *testing.T) {
	f := newFakeS3(t)
	for _, k := range []string{"keep.txt", "one.txt", "docs/a.md", "docs/sub/b.md", "docs/", "docs-other/c.md"} {
		f.put("b", k, "text/plain", []byte("x"))
	}
	cfg := &config{}
	rec, out := call(t, cfg.handleS3ObjectDelete, with(s3Conn4(f, "b"), map[string]any{"keys": []string{"one.txt"}, "prefixes": []string{"docs/"}}))
	if rec.Code != 200 || out["deleted"] != float64(4) || len(out["failed"].([]any)) != 0 {
		t.Fatalf("delete: %d %v", rec.Code, out)
	}
	if got, want := f.keys("b"), []string{"docs-other/c.md", "keep.txt"}; !slices.Equal(got, want) {
		t.Errorf("left %v, want %v", got, want) // "docs-other/" is not under "docs/"
	}
	for name, body := range map[string]map[string]any{
		"nothing":       {},
		"bare prefix":   {"prefixes": []string{"docs"}},
		"empty prefix":  {"prefixes": []string{""}},
		"missing creds": {"accessKey": "", "keys": []string{"x"}},
	} {
		if rec, _ := call(t, cfg.handleS3ObjectDelete, with(s3Conn4(f, "b"), body)); rec.Code != http.StatusBadRequest {
			t.Errorf("%s: %d, want 400", name, rec.Code)
		}
	}
}

func TestS3DeleteRefusesHugeFolders(t *testing.T) {
	f := newFakeS3(t)
	for i := range s3MaxDeleteKeys + 5 {
		f.buckets["b"] = ensure(f.buckets["b"])
		f.buckets["b"]["big/"+strings.Repeat("k", 3)+itoa(i)] = fakeObject{body: []byte("x")}
	}
	rec, out := call(t, (&config{}).handleS3ObjectDelete, with(s3Conn4(f, "b"), map[string]any{"prefixes": []string{"big/"}}))
	if rec.Code != http.StatusBadRequest || !strings.Contains(errText(out), "more than 10000 objects") {
		t.Errorf("huge folder: %d %v", rec.Code, out)
	}
	if len(f.keys("b")) != s3MaxDeleteKeys+5 {
		t.Error("objects were deleted despite the refusal")
	}
}

func ensure(m map[string]fakeObject) map[string]fakeObject {
	if m == nil {
		return map[string]fakeObject{}
	}
	return m
}

func itoa(i int) string {
	b, _ := json.Marshal(i)
	return string(b)
}

func TestS3FolderCreate(t *testing.T) {
	f := newFakeS3(t)
	f.put("b", "x", "text/plain", nil)
	cfg := &config{}
	rec, out := call(t, cfg.handleS3FolderCreate, with(s3Conn4(f, "b"), map[string]any{"prefix": "photos/2026/"}))
	if rec.Code != 200 || out["prefix"] != "photos/2026/" {
		t.Fatalf("create: %d %v", rec.Code, out)
	}
	if o, ok := f.get("b", "photos/2026/"); !ok || len(o.body) != 0 {
		t.Errorf("marker missing or not empty: %+v %v", o, ok)
	}
	for _, bad := range []string{"", "photos", "/photos/", "a//b/", "bad\nname/"} {
		if rec, _ := call(t, cfg.handleS3FolderCreate, with(s3Conn4(f, "b"), map[string]any{"prefix": bad})); rec.Code != http.StatusBadRequest {
			t.Errorf("prefix %q: %d, want 400", bad, rec.Code)
		}
	}
}

// ── demo bucket ────────────────────────────────────────────────────────────

func demoBucketKeys(t *testing.T) []string {
	t.Helper()
	var keys []string
	err := fs.WalkDir(demoBucketFiles, demoBucketRoot, func(name string, e fs.DirEntry, err error) error {
		if err == nil && !e.IsDir() {
			keys = append(keys, name[len(demoBucketRoot)+1:])
		}
		return err
	})
	if err != nil {
		t.Fatal(err)
	}
	slices.Sort(keys)
	return keys
}

func TestDemoBucket(t *testing.T) {
	f := newFakeS3(t)
	f.put("demo-b", "stale/old-upload.txt", "text/plain", []byte("left over"))
	d := newDemoS3(s3Request{Endpoint: f.srv.URL, AccessKey: "REAL-AK", SecretKey: "REAL-SK", Bucket: "demo-b", Region: "us-east-1"}, 0)
	// A public instance: private addresses are blocked, but the demo's own endpoint is trusted.
	cfg := &config{DemoS3: d, BlockPrivateHosts: true}
	sentinel := map[string]any{"endpoint": demoS3Endpoint, "accessKey": "demo", "secretKey": "demo", "bucket": "demo"}

	// Not seeded yet.
	rec, out := call(t, cfg.handleS3Test, sentinel)
	if out["ok"] != false || errText(out) != errDemoS3Unavailable.msg {
		t.Errorf("before seeding: %d %v", rec.Code, out)
	}
	if err := d.seed(t.Context()); err != nil {
		t.Fatalf("seed: %v", err)
	}
	if !d.Ready() {
		t.Fatal("not ready after seeding")
	}
	if got, want := f.keys("demo-b"), demoBucketKeys(t); !slices.Equal(got, want) {
		t.Errorf("bucket holds %v, want %v", got, want)
	}
	if o, _ := f.get("demo-b", "data/artists.csv"); !strings.HasPrefix(o.ctype, "text/csv") {
		t.Errorf("artists.csv content type %q", o.ctype)
	}
	if o, _ := f.get("demo-b", "video/hero.mp4"); o.ctype != "video/mp4" || len(o.body) < 1000 {
		t.Errorf("hero.mp4: %q, %d bytes", o.ctype, len(o.body))
	}
	if err := d.seed(t.Context()); err != nil { // a second run is a no-op
		t.Fatalf("re-seed: %v", err)
	}

	// Reads work with the sentinel, whatever credentials the client sends.
	rec, out = call(t, cfg.handleS3Test, sentinel)
	if out["ok"] != true || out["readOnly"] != true {
		t.Errorf("test: %d %v", rec.Code, out)
	}
	rec, out = call(t, cfg.handleS3Objects, with(sentinel, map[string]any{"delimiter": "/"}))
	if rec.Code != 200 || len(out["prefixes"].([]any)) != 4 || len(out["objects"].([]any)) != 1 { // README.md and four folders
		t.Errorf("list: %d %v", rec.Code, out)
	}
	u := downloadURL(t, cfg, sentinel, "README.md", false)
	if rec := get(cfg, u, nil); rec.Code != 200 || !strings.Contains(rec.Body.String(), "demo bucket") {
		t.Errorf("download: %d %q", rec.Code, rec.Body.String())
	}

	// Writes are refused, and nothing changes.
	before := f.keys("demo-b")
	for name, rec := range map[string]*httptest.ResponseRecorder{
		"delete key":    first(call(t, cfg.handleS3ObjectDelete, with(sentinel, map[string]any{"keys": []string{"README.md"}}))),
		"delete folder": first(call(t, cfg.handleS3ObjectDelete, with(sentinel, map[string]any{"prefixes": []string{"brand/"}}))),
		"new folder":    first(call(t, cfg.handleS3FolderCreate, with(sentinel, map[string]any{"prefix": "mine/"}))),
		"upload":        first(upload(t, cfg.handleS3ObjectUpload, map[string]string{"endpoint": demoS3Endpoint, "accessKey": "demo", "secretKey": "demo", "bucket": "demo", "key": "mine.txt"}, "mine.txt", []byte("x"))),
	} {
		if rec.Code != http.StatusForbidden || !strings.Contains(rec.Body.String(), "read-only") {
			t.Errorf("%s: %d %s", name, rec.Code, rec.Body)
		}
	}
	if after := f.keys("demo-b"); !slices.Equal(before, after) {
		t.Errorf("the demo bucket changed: %v -> %v", before, after)
	}

	// Without a demo configured, the sentinel is just an invalid endpoint.
	_, out = call(t, (&config{}).handleS3Objects, sentinel)
	if errText(out) != errDemoS3Unavailable.msg {
		t.Errorf("sentinel without a demo: %v", out)
	}
}

func first(rec *httptest.ResponseRecorder, _ map[string]any) *httptest.ResponseRecorder { return rec }

func TestDemoBucketCreatesMissingBucket(t *testing.T) {
	f := newFakeS3(t)
	d := newDemoS3(s3Request{Endpoint: f.srv.URL, AccessKey: "a", SecretKey: "s", Bucket: "fresh", Region: "us-east-1"}, 0)
	if err := d.seed(t.Context()); err != nil {
		t.Fatalf("seed: %v", err)
	}
	if got, want := f.keys("fresh"), demoBucketKeys(t); !slices.Equal(got, want) {
		t.Errorf("fresh bucket holds %d keys, want %d", len(got), len(want))
	}
	// Any other failure is reported rather than papered over.
	bad := newDemoS3(s3Request{Endpoint: f.srv.URL, AccessKey: "a", SecretKey: "s", Bucket: "denied", Region: "us-east-1"}, 0)
	if err := bad.seed(t.Context()); err == nil || bad.Ready() {
		t.Errorf("seeding a bucket without access: err=%v ready=%v", err, bad.Ready())
	}
}

func TestDemoBucketFilesAreComplete(t *testing.T) {
	keys := demoBucketKeys(t)
	for _, want := range []string{"README.md", "brand/tuple.svg", "screenshots/sql-editor.png", "video/hero.mp4", "data/artists.csv", "data/albums.json"} {
		if !slices.Contains(keys, want) {
			t.Errorf("the demo bucket is missing %s", want)
		}
	}
	for _, k := range keys {
		if strings.HasPrefix(k, ".") || strings.Contains(k, "/.") {
			t.Errorf("hidden file %s would be seeded", k)
		}
	}
}
