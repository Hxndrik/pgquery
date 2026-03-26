import type { S3Config } from './connectionTypes'

export interface S3TestResponse {
  ok: boolean
  error?: string
}

export interface S3Object {
  key: string
  size: number
  lastModified: string
  isFolder: boolean
}

export interface S3ListResult {
  objects: S3Object[]
  prefixes: string[]
  nextToken?: string
}

export interface S3ObjectMeta {
  key: string
  size: number
  lastModified: string
  contentType: string
  metadata: Record<string, string>
}

function s3Body(config: S3Config, extra?: Record<string, unknown>) {
  return JSON.stringify({
    endpoint: config.endpoint,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    bucket: config.bucket,
    region: config.region,
    ...extra,
  })
}

const headers = { 'Content-Type': 'application/json' }

export async function testS3Connection(config: S3Config): Promise<S3TestResponse> {
  try {
    const res = await fetch('/api/s3/test', {
      method: 'POST',
      headers,
      body: s3Body(config),
    })
    return (await res.json()) as S3TestResponse
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' }
  }
}

export async function listS3Objects(
  config: S3Config,
  prefix?: string,
  delimiter?: string,
  continuationToken?: string,
): Promise<S3ListResult> {
  const res = await fetch('/api/s3/objects', {
    method: 'POST',
    headers,
    body: s3Body(config, { prefix, delimiter, continuationToken }),
  })
  if (!res.ok) throw new Error('Failed to list objects')
  return (await res.json()) as S3ListResult
}

export async function getS3ObjectMeta(
  config: S3Config,
  key: string,
): Promise<S3ObjectMeta> {
  const res = await fetch('/api/s3/object/meta', {
    method: 'POST',
    headers,
    body: s3Body(config, { key }),
  })
  if (!res.ok) throw new Error('Failed to get object metadata')
  return (await res.json()) as S3ObjectMeta
}

export async function deleteS3Objects(
  config: S3Config,
  keys: string[],
): Promise<{ deleted: number }> {
  const res = await fetch('/api/s3/object/delete', {
    method: 'POST',
    headers,
    body: s3Body(config, { keys }),
  })
  if (!res.ok) throw new Error('Failed to delete objects')
  return (await res.json()) as { deleted: number }
}

export async function uploadS3Object(
  config: S3Config,
  file: File,
  key: string,
): Promise<{ key: string; size: number }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('key', key)
  formData.append('endpoint', config.endpoint)
  formData.append('accessKey', config.accessKey)
  formData.append('secretKey', config.secretKey)
  formData.append('bucket', config.bucket)
  formData.append('region', config.region)

  const res = await fetch('/api/s3/object/upload', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Failed to upload object')
  return (await res.json()) as { key: string; size: number }
}

export function downloadS3ObjectUrl(config: S3Config, key: string): string {
  const params = new URLSearchParams({
    endpoint: config.endpoint,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    bucket: config.bucket,
    region: config.region,
    key,
  })
  return `/api/s3/object/download?${params}`
}
