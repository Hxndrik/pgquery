package main

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type s3Request struct {
	Endpoint  string `json:"endpoint"`
	AccessKey string `json:"accessKey"`
	SecretKey string `json:"secretKey"`
	Bucket    string `json:"bucket"`
	Region    string `json:"region"`
}

func (r s3Request) validate() error {
	if r.Endpoint == "" {
		return fmt.Errorf("endpoint is required")
	}
	if r.AccessKey == "" {
		return fmt.Errorf("accessKey is required")
	}
	if r.SecretKey == "" {
		return fmt.Errorf("secretKey is required")
	}
	if r.Bucket == "" {
		return fmt.Errorf("bucket is required")
	}
	return nil
}

func newS3Client(req s3Request) *s3.Client {
	region := req.Region
	if region == "" {
		region = "us-east-1"
	}

	return s3.New(s3.Options{
		Region:       region,
		BaseEndpoint: aws.String(req.Endpoint),
		Credentials:  credentials.NewStaticCredentialsProvider(req.AccessKey, req.SecretKey, ""),
		UsePathStyle: true,
	})
}

func testS3Conn(ctx context.Context, req s3Request) error {
	client := newS3Client(req)
	_, err := client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(req.Bucket),
	})
	return err
}
