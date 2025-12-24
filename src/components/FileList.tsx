import { useEffect, useState } from 'react'
import { listFolder, DropboxEntry } from '../lib/dropbox-client'
import { useAuth } from '../context/AuthContext'
import styles from './FileList.module.css'

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

function getCurrentFolderName(path: string, vaultPath: string): string {
  if (path === vaultPath) {
    return path.split('/').pop() ?? 'Vault'
  }
  return path.split('/').pop() ?? ''
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
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        Loading files...
      </div>
    )
  }

  if (error) {
    return <div className={styles.errorContainer}>Error: {error}</div>
  }

  if (entries.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>📭</div>
        <p className={styles.emptyText}>No markdown files found in vault.</p>
      </div>
    )
  }

  const folders = entries.filter(isFolder)
  const files = entries.filter(isMarkdownFile)
  const isInSubdirectory = currentPath !== vaultPath
  const currentFolderName = getCurrentFolderName(currentPath, vaultPath)

  function handleFolderClick(folderPath: string) {
    setCurrentPath(folderPath)
  }

  function handleBackClick() {
    setCurrentPath(getParentPath(currentPath))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {isInSubdirectory && (
          <button type="button" className={styles.backButton} onClick={handleBackClick}>
            ← Back
          </button>
        )}
        <span className={styles.breadcrumb}>📂 {currentFolderName}</span>
        <span className={styles.stats}>
          {folders.length > 0 && `${folders.length} 📁`}
          {folders.length > 0 && files.length > 0 && ' · '}
          {files.length} notes
        </span>
      </div>
      <ul className={styles.list}>
        {folders.map((entry) => (
          <li key={entry.id} className={styles.listItem}>
            <button
              type="button"
              className={styles.folderButton}
              onClick={() => handleFolderClick(entry.path_display)}
            >
              <span className={styles.folderIcon}>📁</span>
              <span className={styles.itemName}>{entry.name}</span>
              <span className={styles.chevron}>›</span>
            </button>
          </li>
        ))}
        {files.map((entry) => (
          <li key={entry.id} className={styles.listItem}>
            <button
              type="button"
              className={styles.fileButton}
              onClick={() => onFileSelect(entry.path_display)}
            >
              <span className={styles.fileIcon}>📝</span>
              <span className={styles.itemName}>{removeExtension(entry.name)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FileList

