package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/retry"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
	smithyhttp "github.com/aws/smithy-go/transport/http"
)

// demoS3Endpoint is the endpoint the frontend sends for the hosted demo
// bucket. The proxy swaps it for the real endpoint, bucket and keys (see
// demo_s3.go), so no credentials reach the browser.
const demoS3Endpoint = "s3://demo.pgquery"

type s3Request struct {
	Endpoint  string `json:"endpoint"`
	AccessKey string `json:"accessKey"`
	SecretKey string `json:"secretKey"`
	Bucket    string `json:"bucket"`
	Region    string `json:"region"`
}

// s3Failure is an error with a message that is safe to show as-is and the
// HTTP status to answer with.
type s3Failure struct {
	msg    string
	status int
}

func (e s3Failure) Error() string { return e.msg }

var (
	errDemoS3Unavailable = s3Failure{"the demo bucket is not available on this server right now", http.StatusServiceUnavailable}
	errS3ReadOnly        = s3Failure{"the demo bucket is read-only", http.StatusForbidden}
)

func (r s3Request) validate() error {
	u, err := url.Parse(r.Endpoint)
	switch {
	case r.Endpoint == "":
		return errors.New("endpoint is required")
	case err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "":
		return errors.New("endpoint must be an http:// or https:// URL")
	case r.AccessKey == "":
		return errors.New("accessKey is required")
	case r.SecretKey == "":
		return errors.New("secretKey is required")
	case r.Bucket == "":
		return errors.New("bucket is required")
	}
	return nil
}

// s3Conn is an S3 client bound to one bucket.
type s3Conn struct {
	client   *s3.Client
	bucket   string
	readOnly bool // the hosted demo bucket: reads only
}

// s3Open validates a client-supplied request, resolves the demo sentinel and
// applies the private-host policy. It makes no network call.
func (cfg *config) s3Open(req s3Request) (*s3Conn, error) {
	trusted, readOnly := false, false
	if req.Endpoint == demoS3Endpoint {
		if cfg.DemoS3 == nil || !cfg.DemoS3.Ready() {
			return nil, errDemoS3Unavailable
		}
		req, trusted, readOnly = cfg.DemoS3.req, true, true
	} else if err := req.validate(); err != nil {
		return nil, s3Failure{err.Error(), http.StatusBadRequest}
	}

	transport := openTransport
	if cfg.BlockPrivateHosts && !trusted {
		transport = guardedTransport
	}
	return &s3Conn{client: newS3Client(req, transport), bucket: req.Bucket, readOnly: readOnly}, nil
}

// requireWritable is the read-only check for upload, delete and new folder.
func (c *s3Conn) requireWritable() error {
	if c.readOnly {
		return errS3ReadOnly
	}
	return nil
}

func newS3Client(req s3Request, transport http.RoundTripper) *s3.Client {
	region := req.Region
	if region == "" {
		region = "us-east-1"
	}
	return s3.New(s3.Options{
		Region:       region,
		BaseEndpoint: aws.String(strings.TrimRight(req.Endpoint, "/")),
		Credentials:  credentials.NewStaticCredentialsProvider(req.AccessKey, req.SecretKey, ""),
		UsePathStyle: true,
		HTTPClient:   &http.Client{Transport: transport},
		// Fail fast: the UI retries on demand. A blocked address never succeeds, so
		// it is not retried either.
		Retryer: retry.NewStandard(func(o *retry.StandardOptions) {
			o.MaxAttempts = 2
			o.Retryables = append([]retry.IsErrorRetryable{retry.IsErrorRetryableFunc(func(err error) aws.Ternary {
				var blocked clientError
				if errors.As(err, &blocked) {
					return aws.FalseTernary
				}
				return aws.UnknownTernary
			})}, o.Retryables...)
		}),
		// Only add checksums where S3 requires them. The SDK's newer default
		// adds a trailing checksum to every upload, which MinIO, R2 and other
		// S3-compatible stores don't all accept.
		RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired,
		ResponseChecksumValidation: aws.ResponseChecksumValidationWhenRequired,
	})
}

func testS3Conn(ctx context.Context, c *s3Conn) error {
	_, err := c.client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: aws.String(c.bucket)})
	return err
}

// s3Error turns a failed S3 call into a message safe to show and an HTTP
// status. notFound is what a bare "not found" means for the call: HEAD
// responses carry no error body, so the SDK can't say whether the bucket or
// the object is missing.
func s3Error(err error, notFound string) (string, int) {
	var f s3Failure
	if errors.As(err, &f) {
		return f.msg, f.status
	}
	var ce clientError // a blocked private address
	if errors.As(err, &ce) {
		return ce.msg, http.StatusForbidden
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return "the storage endpoint did not answer in time", http.StatusGatewayTimeout
	}

	var api smithy.APIError
	if errors.As(err, &api) {
		switch api.ErrorCode() {
		case "NoSuchBucket":
			return "bucket not found", http.StatusNotFound
		case "NoSuchKey", "NotFound":
			return notFound, http.StatusNotFound
		case "AccessDenied", "Forbidden":
			return "access denied: the key has no permission for this bucket or object", http.StatusForbidden
		case "InvalidAccessKeyId":
			return "the access key ID is not known to this endpoint", http.StatusForbidden
		case "SignatureDoesNotMatch":
			return "the secret key does not match the access key, or the region is wrong", http.StatusForbidden
		case "InvalidRange":
			return "requested range not satisfiable", http.StatusRequestedRangeNotSatisfiable
		case "PermanentRedirect", "AuthorizationHeaderMalformed", "IllegalLocationConstraintException":
			return "the bucket is in a different region: set the Region field", http.StatusBadRequest
		case "EntityTooLarge":
			return "the object is too large for this endpoint", http.StatusRequestEntityTooLarge
		case "SlowDown", "ServiceUnavailable", "RequestTimeout":
			return "the storage endpoint is busy: try again in a moment", http.StatusServiceUnavailable
		case "NotImplemented", "XNotImplemented":
			return "this endpoint does not support that operation", http.StatusNotImplemented
		}
		if msg := api.ErrorMessage(); msg != "" {
			return fmt.Sprintf("%s: %s", api.ErrorCode(), truncate(msg, 200)), http.StatusBadGateway
		}
		return api.ErrorCode(), http.StatusBadGateway
	}

	// A ResponseError with status 0 is a request that never got an answer.
	var re *smithyhttp.ResponseError
	if errors.As(err, &re) && re.HTTPStatusCode() != 0 {
		switch code := re.HTTPStatusCode(); {
		case code == http.StatusMovedPermanently:
			return "the bucket is in a different region: set the Region field", http.StatusBadRequest
		case code == http.StatusForbidden:
			return "access denied: the key has no permission for this bucket or object", http.StatusForbidden
		case code == http.StatusNotFound:
			return notFound, http.StatusNotFound
		case code == http.StatusBadRequest:
			return "the endpoint rejected the request: check the endpoint, region and keys", http.StatusBadGateway
		default:
			return fmt.Sprintf("the storage endpoint answered HTTP %d", code), http.StatusBadGateway
		}
	}
	return "could not reach the storage endpoint: " + truncate(rootMessage(err), 200), http.StatusBadGateway
}

// rootMessage is the innermost error text: for network failures that is
// "lookup host: no such host" rather than the SDK's operation-error wrapping.
func rootMessage(err error) string {
	for {
		next := errors.Unwrap(err)
		if next == nil {
			return err.Error()
		}
		err = next
	}
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}
