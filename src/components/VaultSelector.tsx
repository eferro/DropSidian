import { useState, useEffect } from 'react'
import { storeVaultPath, getVaultPath } from '../lib/vault-storage'

interface VaultSelectorProps {
  onVaultSelected: (path: string) => void
}

function VaultSelector({ onVaultSelected }: VaultSelectorProps) {
  const [path, setPath] = useState('')
  const [savedPath, setSavedPath] = useState<string | null>(null)

  useEffect(() => {
    const stored = getVaultPath()
    if (stored) {
      setSavedPath(stored)
      onVaultSelected(stored)
    }
  }, [onVaultSelected])

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    if (!path.trim()) return

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    storeVaultPath(normalizedPath)
    setSavedPath(normalizedPath)
    onVaultSelected(normalizedPath)
  }

  function handleChange(): void {
    setSavedPath(null)
  }

  if (savedPath) {
    return (
      <div>
        <p>
          Vault: <strong>{savedPath}</strong>
        </p>
        <button type="button" onClick={handleChange}>
          Change vault
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Vault path in Dropbox:
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/Obsidian/MyVault"
        />
      </label>
      <button type="submit">Set vault</button>
    </form>
  )
}

export default VaultSelector

