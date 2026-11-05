package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sort"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"
)

// fakeS3 is a small in-memory S3 server for the handler tests: path-style
// addressing, bucket create / head, ListObjectsV2 with prefixes, delimiters
// and paging, ranged GET, PUT, DeleteObjects and S3-style XML errors. It does
// not check signatures. The bucket "denied" answers every call with
// AccessDenied.
type fakeS3 struct {
	srv      *httptest.Server
	mu       sync.Mutex
	buckets  map[string]map[string]fakeObject
	pageSize int // keys per ListObjectsV2 page
}

type fakeObject struct {
	body  []byte
	ctype string
	mod   time.Time
}

func newFakeS3(t *testing.T) *fakeS3 {
	t.Helper()
	f := &fakeS3{buckets: map[string]map[string]fakeObject{}, pageSize: 1000}
	f.srv = httptest.NewServer(http.HandlerFunc(f.serve))
	t.Cleanup(f.srv.Close)
	return f
}

func (f *fakeS3) put(bucket, key, ctype string, body []byte) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.buckets[bucket] == nil {
		f.buckets[bucket] = map[string]fakeObject{}
	}
	f.buckets[bucket][key] = fakeObject{body: body, ctype: ctype, mod: time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)}
}

func (f *fakeS3) keys(bucket string) []string {
	f.mu.Lock()
	defer f.mu.Unlock()
	var out []string
	for k := range f.buckets[bucket] {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

func (f *fakeS3) get(bucket, key string) (fakeObject, bool) {
	f.mu.Lock()
	defer f.mu.Unlock()
	o, ok := f.buckets[bucket][key]
	return o, ok
}

func s3XMLError(w http.ResponseWriter, status int, code, msg string) {
	w.Header().Set("Content-Type", "application/xml")
	w.WriteHeader(status)
	fmt.Fprintf(w, `<?xml version="1.0" encoding="UTF-8"?><Error><Code>%s</Code><Message>%s</Message></Error>`, code, msg)
}

func (f *fakeS3) serve(w http.ResponseWriter, r *http.Request) {
	f.mu.Lock()
	defer f.mu.Unlock()

	bucket, key, _ := strings.Cut(strings.TrimPrefix(r.URL.Path, "/"), "/")
	if bucket == "denied" {
		if r.Method == http.MethodHead {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		s3XMLError(w, http.StatusForbidden, "AccessDenied", "Access Denied")
		return
	}
	objs, bucketExists := f.buckets[bucket]

	switch {
	case key == "" && r.Method == http.MethodPut: // CreateBucket
		if !bucketExists {
			f.buckets[bucket] = map[string]fakeObject{}
		}
		w.WriteHeader(http.StatusOK)
	case key == "" && r.Method == http.MethodHead:
		if !bucketExists {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusOK)
	case !bucketExists:
		if r.Method == http.MethodHead {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		s3XMLError(w, http.StatusNotFound, "NoSuchBucket", "The specified bucket does not exist")
	case key == "" && r.Method == http.MethodGet:
		f.list(w, r, bucket, objs)
	case key == "" && r.Method == http.MethodPost && r.URL.Query().Has("delete"):
		var del struct {
			Objects []struct{ Key string } `xml:"Object"`
		}
		body, _ := io.ReadAll(r.Body)
		if err := xml.Unmarshal(body, &del); err != nil {
			s3XMLError(w, http.StatusBadRequest, "MalformedXML", err.Error())
			return
		}
		for _, o := range del.Objects {
			delete(objs, o.Key)
		}
		w.Header().Set("Content-Type", "application/xml")
		fmt.Fprint(w, `<?xml version="1.0" encoding="UTF-8"?><DeleteResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></DeleteResult>`)
	case r.Method == http.MethodPut:
		body, _ := io.ReadAll(r.Body)
		objs[key] = fakeObject{body: body, ctype: r.Header.Get("Content-Type"), mod: time.Now()}
		sum := md5.Sum(body)
		w.Header().Set("ETag", `"`+hex.EncodeToString(sum[:])+`"`)
		w.WriteHeader(http.StatusOK)
	case r.Method == http.MethodGet || r.Method == http.MethodHead:
		o, ok := objs[key]
		if !ok {
			if r.Method == http.MethodHead {
				w.WriteHeader(http.StatusNotFound)
				return
			}
			s3XMLError(w, http.StatusNotFound, "NoSuchKey", "The specified key does not exist.")
			return
		}
		h := w.Header()
		h.Set("Content-Type", o.ctype)
		h.Set("Last-Modified", o.mod.Format(http.TimeFormat))
		h.Set("ETag", `"fake"`)
		body, status := o.body, http.StatusOK
		if rng := r.Header.Get("Range"); rng != "" {
			var from, to int
			if _, err := fmt.Sscanf(rng, "bytes=%d-%d", &from, &to); err != nil || from >= len(body) {
				s3XMLError(w, http.StatusRequestedRangeNotSatisfiable, "InvalidRange", "The requested range is not satisfiable")
				return
			}
			to = min(to, len(body)-1)
			h.Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", from, to, len(body)))
			body, status = body[from:to+1], http.StatusPartialContent
		}
		h.Set("Content-Length", strconv.Itoa(len(body)))
		w.WriteHeader(status)
		if r.Method == http.MethodGet {
			w.Write(body)
		}
	default:
		s3XMLError(w, http.StatusNotImplemented, "NotImplemented", "not in the fake")
	}
}

func (f *fakeS3) list(w http.ResponseWriter, r *http.Request, bucket string, objs map[string]fakeObject) {
	q := r.URL.Query()
	prefix, delim, after := q.Get("prefix"), q.Get("delimiter"), q.Get("continuation-token")

	type entry struct {
		name   string
		prefix bool
	}
	var entries []entry
	seen := map[string]bool{}
	for key := range objs {
		if !strings.HasPrefix(key, prefix) {
			continue
		}
		if delim != "" {
			if i := strings.Index(key[len(prefix):], delim); i >= 0 {
				p := key[:len(prefix)+i+len(delim)]
				if !seen[p] {
					seen[p] = true
					entries = append(entries, entry{p, true})
				}
				continue
			}
		}
		entries = append(entries, entry{key, false})
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].name < entries[j].name })
	if after != "" {
		i := sort.Search(len(entries), func(i int) bool { return entries[i].name > after })
		entries = entries[i:]
	}
	truncated := len(entries) > f.pageSize
	if truncated {
		entries = entries[:f.pageSize]
	}

	var b strings.Builder
	fmt.Fprintf(&b, `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>%s</Name><Prefix>%s</Prefix><KeyCount>%d</KeyCount><MaxKeys>%d</MaxKeys><IsTruncated>%t</IsTruncated>`,
		bucket, prefix, len(entries), f.pageSize, truncated)
	if truncated {
		fmt.Fprintf(&b, `<NextContinuationToken>%s</NextContinuationToken>`, entries[len(entries)-1].name)
	}
	for _, e := range entries {
		if e.prefix {
			fmt.Fprintf(&b, `<CommonPrefixes><Prefix>%s</Prefix></CommonPrefixes>`, e.name)
			continue
		}
		o := objs[e.name]
		fmt.Fprintf(&b, `<Contents><Key>%s</Key><LastModified>%s</LastModified><ETag>"x"</ETag><Size>%d</Size><StorageClass>STANDARD</StorageClass></Contents>`,
			e.name, o.mod.Format("2006-01-02T15:04:05.000Z"), len(o.body))
	}
	b.WriteString(`</ListBucketResult>`)
	w.Header().Set("Content-Type", "application/xml")
	io.WriteString(w, b.String())
}
