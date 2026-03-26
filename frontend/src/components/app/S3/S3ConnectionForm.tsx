import { useState } from 'react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { testS3Connection } from '../../../lib/s3Api'
import { toast } from 'sonner'
import type { ConnectionFormProps } from '../../../lib/connectionRegistry'
import type { S3Config } from '../../../lib/connectionTypes'
import { isS3Config } from '../../../lib/connectionTypes'

export default function S3ConnectionForm({ onConnect, initial, isEdit }: ConnectionFormProps) {
  const initialConfig: S3Config = initial && isS3Config(initial.config)
    ? initial.config
    : { endpoint: '', accessKey: '', secretKey: '', bucket: '', region: '' }

  const [endpoint, setEndpoint] = useState(initialConfig.endpoint)
  const [accessKey, setAccessKey] = useState(initialConfig.accessKey)
  const [secretKey, setSecretKey] = useState(initialConfig.secretKey)
  const [bucket, setBucket] = useState(initialConfig.bucket)
  const [region, setRegion] = useState(initialConfig.region)
  const [name, setName] = useState(initial?.name ?? '')
  const [testing, setTesting] = useState(false)

  const config: S3Config = { endpoint, accessKey, secretKey, bucket, region }
  const isValid = endpoint && accessKey && secretKey && bucket

  const handleTest = async () => {
    if (!isValid) return
    setTesting(true)
    const result = await testS3Connection(config)
    setTesting(false)
    if (result.ok) {
      toast.success(`Connected to bucket "${bucket}"`)
    } else {
      toast.error(result.error ?? 'Connection failed')
    }
  }

  const handleConnect = () => {
    onConnect(config, name || bucket || 'S3 Connection')
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Endpoint URL"
        placeholder="https://s3.amazonaws.com"
        value={endpoint}
        onChange={(e) => setEndpoint(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Access Key"
          value={accessKey}
          onChange={(e) => setAccessKey(e.target.value)}
        />
        <Input
          label="Secret Key"
          type="password"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Bucket"
          placeholder="my-bucket"
          value={bucket}
          onChange={(e) => setBucket(e.target.value)}
        />
        <Input
          label="Region"
          placeholder="us-east-1"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
      </div>

      <Input
        label="Connection name (optional)"
        placeholder="My S3 storage"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleTest} disabled={!isValid || testing}>
          {testing ? 'Testing…' : 'Test connection'}
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={handleConnect}
          disabled={!isValid}
        >
          {isEdit ? 'Update' : 'Connect'}
        </Button>
      </div>
    </div>
  )
}
