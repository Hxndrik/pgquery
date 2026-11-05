package main

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"mime"
	"path"
	"sync"
	"time"

	"bytes"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/smithy-go"
)

// demoBucketFiles is the sample content of the hosted demo bucket: brand
// artwork, screenshots, a short video and two small data files. The files
// under demo/bucket are copies of the ones in docs/assets, so the binary
// carries everything it seeds.
//
//go:embed all:demo/bucket
var demoBucketFiles embed.FS

const demoBucketRoot = "demo/bucket"

// demoS3 keeps the hosted demo bucket seeded, the same way demoDB does for
// Postgres. The real endpoint, bucket and keys stay on the server: clients
// send demoS3Endpoint and the proxy swaps them in, read-only (see s3Open).
type demoS3 struct {
	req      s3Request
	interval time.Duration // 0: seed once at startup, never reset

	mu    sync.RWMutex
	ready bool // true after the first successful seed
}

func newDemoS3(req s3Request, interval time.Duration) *demoS3 {
	return &demoS3{req: req, interval: interval}
}

// Ready reports whether the bucket has been seeded at least once.
func (d *demoS3) Ready() bool {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.ready
}

func (d *demoS3) run(ctx context.Context) {
	runSeeder(ctx, "demo bucket", d.interval, d.seed)
}

// seed makes the bucket hold exactly the embedded files: it creates the bucket
// if needed, uploads every file and removes anything else.
func (d *demoS3) seed(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()

	// The operator's own endpoint, which may well be on a private network.
	client := newS3Client(d.req, openTransport)
	bucket := aws.String(d.req.Bucket)

	if _, err := client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: bucket}); err != nil {
		var api smithy.APIError
		if !errors.As(err, &api) || (api.ErrorCode() != "NotFound" && api.ErrorCode() != "NoSuchBucket") {
			return fmt.Errorf("check bucket: %w", err)
		}
		if _, err := client.CreateBucket(ctx, &s3.CreateBucketInput{Bucket: bucket}); err != nil {
			return fmt.Errorf("create bucket: %w", err)
		}
	}

	want := map[string]bool{}
	err := fs.WalkDir(demoBucketFiles, demoBucketRoot, func(name string, entry fs.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return err
		}
		body, err := demoBucketFiles.ReadFile(name)
		if err != nil {
			return err
		}
		key := name[len(demoBucketRoot)+1:]
		want[key] = true
		_, err = client.PutObject(ctx, &s3.PutObjectInput{
			Bucket:        bucket,
			Key:           aws.String(key),
			Body:          bytes.NewReader(body),
			ContentLength: aws.Int64(int64(len(body))),
			ContentType:   aws.String(demoContentType(key)),
		})
		if err != nil {
			return fmt.Errorf("upload %s: %w", key, err)
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Remove what is not part of the sample (an upload through the console, say).
	var extra []types.ObjectIdentifier
	input := &s3.ListObjectsV2Input{Bucket: bucket}
	for {
		page, err := client.ListObjectsV2(ctx, input)
		if err != nil {
			return fmt.Errorf("list bucket: %w", err)
		}
		for _, obj := range page.Contents {
			if key := aws.ToString(obj.Key); !want[key] {
				extra = append(extra, types.ObjectIdentifier{Key: aws.String(key)})
			}
		}
		if !aws.ToBool(page.IsTruncated) || page.NextContinuationToken == nil {
			break
		}
		input.ContinuationToken = page.NextContinuationToken
	}
	for start := 0; start < len(extra); start += 1000 {
		batch := extra[start:min(start+1000, len(extra))]
		if _, err := client.DeleteObjects(ctx, &s3.DeleteObjectsInput{Bucket: bucket, Delete: &types.Delete{Objects: batch, Quiet: aws.Bool(true)}}); err != nil {
			return fmt.Errorf("remove stale objects: %w", err)
		}
	}

	d.mu.Lock()
	d.ready = true
	d.mu.Unlock()
	return nil
}

// demoContentType names the types the sample uses explicitly, so the result
// doesn't depend on the system's MIME database.
func demoContentType(key string) string {
	switch path.Ext(key) {
	case ".md":
		return "text/markdown; charset=utf-8"
	case ".csv":
		return "text/csv; charset=utf-8"
	case ".json":
		return "application/json"
	case ".svg":
		return "image/svg+xml"
	case ".png":
		return "image/png"
	case ".mp4":
		return "video/mp4"
	}
	if t := mime.TypeByExtension(path.Ext(key)); t != "" {
		return t
	}
	return "application/octet-stream"
}
