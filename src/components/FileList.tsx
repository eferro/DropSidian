import { useEffect, useState } from 'react'
import { listFolder, DropboxEntry } from '../lib/dropbox-client'
import { useAuth } from '../context/AuthContext'

interface FileListProps {
  vaultPath: string
  onFileSelect: (path: string) => void
}

function isMarkdownFile(entry: DropboxEntry): boolean {
  return entry['.tag'] === 'file' && entry.name.endsWith('.md')
}

function isFolder(entry: DropboxEntry): boolean {
  return entry['.tag'] === 'folder'
}

function removeExtension(filename: string): string {
  return filename.replace(/\.md$/, '')
}

function getParentPath(path: string): string {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

function FileList({ vaultPath, onFileSelect }: FileListProps) {
  const { accessToken } = useAuth()
  const [entries, setEntries] = useState<DropboxEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState(vaultPath)

  useEffect(() => {
    setCurrentPath(vaultPath)
  }, [vaultPath])

  useEffect(() => {
    if (!accessToken || !currentPath) {
      setLoading(false)
      return
    }

    setLoading(true)
    listFolder(accessToken, currentPath)
      .then((response) => {
        const visibleEntries = response.entries.filter(
          (entry) => isFolder(entry) || isMarkdownFile(entry)
        )
        setEntries(visibleEntries)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [accessToken, currentPath])

  if (loading) {
    return <p>Loading files...</p>
  }

  if (error) {
    return <p>Error: {error}</p>
  }

  if (entries.length === 0) {
    return <p>No markdown files found in vault.</p>
  }

  const folders = entries.filter(isFolder)
  const files = entries.filter(isMarkdownFile)
  const isInSubdirectory = currentPath !== vaultPath

  function handleFolderDoubleClick(folderPath: string) {
    setCurrentPath(folderPath)
  }

  function handleBackClick() {
    setCurrentPath(getParentPath(currentPath))
  }

  return (
    <div>
      {isInSubdirectory && (
        <button type="button" onClick={handleBackClick}>
          ⬅ Back
        </button>
      )}
      <p>{files.length} notes</p>
      <ul>
        {folders.map((entry) => (
          <li key={entry.id}>
            <span onDoubleClick={() => handleFolderDoubleClick(entry.path_display)}>
              📁 {entry.name}
            </span>
          </li>
        ))}
        {files.map((entry) => (
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

