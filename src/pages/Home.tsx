import { useState, useCallback, useMemo } from 'react'
import ConnectDropboxButton from '../components/ConnectDropboxButton'
import AccountInfo from '../components/AccountInfo'
import VaultSelector from '../components/VaultSelector'
import FileList from '../components/FileList'
import NotePreview from '../components/NotePreview'
import NewNoteModal from '../components/NewNoteModal'
import { useAuth } from '../context/AuthContext'
import { uploadFile } from '../lib/dropbox-client'
import { buildNoteIndex } from '../lib/note-index'
import { sanitizeFilename } from '../lib/path-utils'

function Home() {
  const { isAuthenticated, isLoading, logout, accessToken } = useAuth()
  const [vaultPath, setVaultPath] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fileListKey, setFileListKey] = useState(0)
  const [filePaths, setFilePaths] = useState<string[]>([])

  const noteIndex = useMemo(() => buildNoteIndex(filePaths), [filePaths])

  const handleVaultSelected = useCallback((path: string) => {
    setVaultPath(path)
    setSelectedFile(null)
    setFilePaths([])
  }, [])

  const handleNavigateNote = useCallback((path: string) => {
    setSelectedFile(path)
  }, [])

  const handleCreateNote = useCallback(
    async (title: string, content: string) => {
      if (!accessToken || !vaultPath) return

      const safeTitle = sanitizeFilename(title) || 'Untitled'
      const filename = `${safeTitle}.md`
      const inboxPath = `${vaultPath}/Inbox/${filename}`

      await uploadFile(accessToken, inboxPath, content)
      setIsModalOpen(false)
      setFileListKey((k) => k + 1)
    },
    [accessToken, vaultPath]
  )

  if (isLoading) {
    return (
      <main>
        <h1>DropSidian</h1>
        <p>Loading...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main>
        <h1>Hello DropSidian</h1>
        <p>Your Obsidian vault, accessible anywhere.</p>
        <ConnectDropboxButton />
      </main>
    )
  }

  return (
    <main>
      <h1>DropSidian</h1>
      <AccountInfo />
      <button type="button" onClick={logout}>
        Disconnect
      </button>
      <hr />
      <VaultSelector onVaultSelected={handleVaultSelected} />
      {vaultPath && !selectedFile && (
        <>
          <FileList
            key={fileListKey}
            vaultPath={vaultPath}
            onFileSelect={setSelectedFile}
            onFilesLoaded={setFilePaths}
          />
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="New note"
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </>
      )}
      {selectedFile && (
        <NotePreview
          filePath={selectedFile}
          onClose={() => setSelectedFile(null)}
          noteIndex={noteIndex}
          onNavigateNote={handleNavigateNote}
          vaultPath={vaultPath ?? undefined}
        />
      )}
      <NewNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateNote}
      />
    </main>
  )
}

export default Home
