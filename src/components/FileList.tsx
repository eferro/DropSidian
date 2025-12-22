import { useEffect, useState } from 'react'
import { listFolder, DropboxEntry } from '../lib/dropbox-client'
import { useAuth } from '../context/AuthContext'

interface FileListProps {
  vaultPath: string
  onFileSelect: (path: string) => void
}

function FileList({ vaultPath, onFileSelect }: FileListProps) {
  const { accessToken } = useAuth()
  const [entries, setEntries] = useState<DropboxEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken || !vaultPath) {
      setLoading(false)
      return
    }

    setLoading(true)
    listFolder(accessToken, vaultPath)
      .then((response) => {
        setEntries(response.entries)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [accessToken, vaultPath])

  if (loading) {
    return <p>Loading files...</p>
  }

  if (error) {
    return <p>Error: {error}</p>
  }

  if (entries.length === 0) {
    return <p>No files found in vault.</p>
  }

  return (
    <div>
      <p>{entries.length} items</p>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            {entry['.tag'] === 'folder' ? '📁' : '📄'}{' '}
            {entry['.tag'] === 'file' && entry.name.endsWith('.md') ? (
              <button
                type="button"
                onClick={() => onFileSelect(entry.path_display)}
              >
                {entry.name}
              </button>
            ) : (
              entry.name
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FileList

