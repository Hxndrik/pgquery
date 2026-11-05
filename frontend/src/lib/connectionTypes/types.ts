export type ConnectionType = 'postgres' | 's3'

export interface PostgresConfig {
  url: string
}

export interface S3Config {
  endpoint: string
  accessKey: string
  secretKey: string
  bucket: string
  region: string
}

export type ConnectionConfig = PostgresConfig | S3Config

export interface SavedConnection {
  id: string
  name: string
  type: ConnectionType
  config: ConnectionConfig
  createdAt: number
}

export function isPostgresConfig(config: ConnectionConfig): config is PostgresConfig {
  return 'url' in config
}

export function isS3Config(config: ConnectionConfig): config is S3Config {
  return 'endpoint' in config
}

/**
 * The endpoint the app sends for the hosted demo bucket. The proxy swaps it for
 * the real endpoint, bucket and keys and refuses every write (proxy/demo_s3.go).
 */
export const DEMO_S3_ENDPOINT = 's3://demo.pgquery'

export function isDemoS3Config(config: ConnectionConfig): config is S3Config {
  return isS3Config(config) && config.endpoint === DEMO_S3_ENDPOINT
}
