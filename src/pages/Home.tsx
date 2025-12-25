import { useState, useCallback, useMemo, useEffect } from 'react'
import ConnectDropboxButton from '../components/ConnectDropboxButton'
import Header from '../components/Header'
import VaultSelector from '../components/VaultSelector'
import SettingsModal from '../components/SettingsModal'
import FileList from '../components/FileList'
import NotePreview from '../components/NotePreview'
import NewNoteModal from '../components/NewNoteModal'
import { useAuth } from '../context/AuthContext'
import { uploadFile, getCurrentAccount, DropboxAccount } from '../lib/dropbox-client'
import { buildNoteIndex } from '../lib/note-index'
import { sanitizeFilename } from '../lib/path-utils'
import { ContentIndex } from '../lib/search'

function Home() {
  const { isAuthenticated, isLoading, logout, accessToken } = useAuth()
  const [vaultPath, setVaultPath] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showVaultSelector, setShowVaultSelector] = useState(false)
  const [fileListKey, setFileListKey] = useState(0)
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [contentIndex, setContentIndex] = useState<ContentIndex>(new Map())
  const [account, setAccount] = useState<DropboxAccount | null>(null)

  useEffect(() => {
    if (!accessToken) return

    getCurrentAccount(accessToken)
      .then(setAccount)
      .catch(() => {})
  }, [accessToken])

  const noteIndex = useMemo(() => buildNoteIndex(filePaths), [filePaths])

  const handleVaultSelected = useCallback((path: string) => {
    setVaultPath(path)
    setSelectedFile(null)
    setFilePaths([])
    setShowVaultSelector(false)
    setIsSettingsOpen(false)
  }, [])

  const handleNavigateNote = useCallback((path: string) => {
    setSelectedFile(path)
  }, [])

  const handleNoteContentLoaded = useCallback((path: string, content: string) => {
    setContentIndex((prev) => {
      const next = new Map(prev)
      next.set(path, content)
      return next
    })
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

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const handleChangeVault = useCallback(() => {
    setShowVaultSelector(true)
  }, [])

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

  const user = account
    ? { displayName: account.name.display_name, email: account.email }
    : undefined

  const needsVaultSelection = !vaultPath || showVaultSelector

  return (
    <main>
      <Header
        user={user}
        onLogout={logout}
        onSettings={handleOpenSettings}
      />
      {needsVaultSelection ? (
        <VaultSelector onVaultSelected={handleVaultSelected} />
      ) : (
        <>
          {!selectedFile && (
            <>
              <FileList
                key={fileListKey}
                vaultPath={vaultPath}
                onFileSelect={setSelectedFile}
                onFilesLoaded={setFilePaths}
                contentIndex={contentIndex}
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
              vaultPath={vaultPath}
              onContentLoaded={handleNoteContentLoaded}
            />
          )}
        </>
      )}
      <NewNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateNote}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        vaultPath={vaultPath}
        onChangeVault={handleChangeVault}
      />
    </main>
  )
}

export default Home
