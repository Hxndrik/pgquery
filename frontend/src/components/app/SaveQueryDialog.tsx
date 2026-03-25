import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface SaveQueryDialogProps {
  open: boolean
  onClose: () => void
  onSave: (name: string) => void
  initialName?: string
}

export function SaveQueryDialog({ open, onClose, onSave, initialName = '' }: SaveQueryDialogProps) {
  const [name, setName] = useState(initialName)

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim())
      setName('')
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Save Query" width="max-w-md">
      <div className="flex flex-col gap-4">
        <Input
          label="Query name"
          placeholder="My awesome query"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
