import { useEffect, useState } from 'react'
import { isDemoS3Config } from './connectionTypes'
import type { S3Config } from './connectionTypes'

export interface S3TestResponse {
  ok: boolean
  error?: string
  /** The hosted demo bucket: nothing can be changed. */
  readOnly?: boolean
  /** Largest file the server accepts for upload. */
  maxUploadBytes?: number
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
  /** Present when the folder has more objects than one page. */
  nextToken?: string
}

export interface S3ObjectMeta {
  key: string
  size: number
  lastModified: string
  contentType: string
  metadata: Record<string, string>
}

export interface S3Stats {
  objects: number
  bytes: number
  /** Counting stopped early: the real numbers are higher. */
  truncated: boolean
}

export interface S3DeleteResult {
  deleted: number
  failed: { key: string; error: string }[]
}

const headers = { 'Content-Type': 'application/json' }

function connection(config: S3Config) {
  return {
    endpoint: config.endpoint,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    bucket: config.bucket,
    region: config.region,
  }
}

/** The server's message for a failed call, which is safe to show as it is. */
async function failure(res: Response, fallback: string): Promise<Error> {
  try {
    const body = (await res.json()) as { error?: string }
    if (body.error) return new Error(body.error)
  } catch {
    // not JSON
  }
  return new Error(`${fallback} (HTTP ${res.status})`)
}

async function post<T>(path: string, config: S3Config, extra: Record<string, unknown>, fallback: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { method: 'POST', headers, body: JSON.stringify({ ...connection(config), ...extra }) })
  } catch {
    throw new Error('Could not reach the pgquery server')
  }
  if (!res.ok) throw await failure(res, fallback)
  return (await res.json()) as T
}

export async function testS3Connection(config: S3Config): Promise<S3TestResponse> {
  try {
    const res = await fetch('/api/s3/test', { method: 'POST', headers, body: JSON.stringify(connection(config)) })
    return (await res.json()) as S3TestResponse
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' }
  }
}

export function listS3Objects(
  config: S3Config,
  prefix?: string,
  delimiter?: string,
  continuationToken?: string,
): Promise<S3ListResult> {
  return post('/api/s3/objects', config, { prefix, delimiter, continuationToken }, 'Failed to list objects')
}

/** Object count and total size under a prefix (the whole bucket when empty). */
export function getS3Stats(config: S3Config, prefix?: string): Promise<S3Stats> {
  return post('/api/s3/bucket/stats', config, { prefix }, 'Failed to read the bucket size')
}

export function getS3ObjectMeta(config: S3Config, key: string): Promise<S3ObjectMeta> {
  return post('/api/s3/object/meta', config, { key }, 'Failed to read the object')
}

/** Deletes objects and, with prefixes ("folder/"), everything under them. */
export function deleteS3Objects(config: S3Config, target: { keys?: string[]; prefixes?: string[] }): Promise<S3DeleteResult> {
  return post('/api/s3/object/delete', config, target, 'Failed to delete')
}

/** Creates an empty "folder/" marker, the way the AWS console does. */
export function createS3Folder(config: S3Config, prefix: string): Promise<{ prefix: string }> {
  return post('/api/s3/folder/create', config, { prefix }, 'Failed to create the folder')
}

export async function uploadS3Object(config: S3Config, file: File, key: string): Promise<{ key: string; size: number }> {
  const form = new FormData()
  for (const [name, value] of Object.entries({ ...connection(config), key })) form.append(name, value)
  form.append('file', file)
  let res: Response
  try {
    res = await fetch('/api/s3/object/upload', { method: 'POST', body: form })
  } catch {
    throw new Error('Could not reach the pgquery server')
  }
  if (!res.ok) throw await failure(res, 'Failed to upload')
  return (await res.json()) as { key: string; size: number }
}

/**
 * A short-lived URL for previewing or downloading one object. It is a sealed
 * token, so the bucket's keys never appear in a URL. `inline` is for PDFs,
 * which the browser shows in place; everything else always downloads.
 */
export async function getS3Link(config: S3Config, key: string, inline = false): Promise<string> {
  const { url } = await post<{ url: string }>('/api/s3/object/link', config, { key, inline }, 'Failed to open the object')
  return url
}

/** What a connection allows, learned from one connection test per session. */
export interface S3Capabilities {
  readOnly: boolean
  maxUploadBytes?: number
}

const capabilityCache = new Map<string, Promise<S3TestResponse>>()

export function useS3Capabilities(config: S3Config): S3Capabilities {
  const [known, setKnown] = useState<S3TestResponse | null>(null)
  const id = `${config.endpoint}|${config.bucket}|${config.accessKey}`

  useEffect(() => {
    let cancelled = false
    let pending = capabilityCache.get(id)
    if (!pending) {
      pending = testS3Connection(config)
      capabilityCache.set(id, pending)
    }
    pending.then((result) => {
      if (!result.ok) capabilityCache.delete(id)
      else if (!cancelled) setKnown(result)
    })
    return () => {
      cancelled = true
    }
    // config is identified by id; the other fields only matter when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // The demo is read-only whether or not the test call has answered yet.
  return { readOnly: known?.readOnly ?? isDemoS3Config(config), maxUploadBytes: known?.maxUploadBytes }
}
