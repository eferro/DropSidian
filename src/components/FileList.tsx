import { useEffect, useState } from 'react'
import { listAllFiles, DropboxEntry } from '../lib/dropbox-client'
import { useAuth } from '../context/AuthContext'

interface FileListProps {
  vaultPath: string
  onFileSelect: (path: string) => void
}

function isMarkdownFile(entry: DropboxEntry): boolean {
  return entry['.tag'] === 'file' && entry.name.endsWith('.md')
}

function removeExtension(filename: string): string {
  return filename.replace(/\.md$/, '')
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
    listAllFiles(accessToken, vaultPath)
      .then((allEntries) => {
        const markdownFiles = allEntries.filter(isMarkdownFile)
        setEntries(markdownFiles)
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
    return <p>No markdown files found in vault.</p>
  }

  return (
    <div>
      <p>{entries.length} notes</p>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <button type="button" onClick={() => onFileSelect(entry.path_display)}>
              {removeExtension(entry.name)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FileList

