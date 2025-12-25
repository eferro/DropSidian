import { useState, useCallback, useEffect } from 'react'
import ConnectDropboxButton from '../components/ConnectDropboxButton'
import Header from '../components/Header'
import VaultSelector from '../components/VaultSelector'
import SettingsModal from '../components/SettingsModal'
import InboxNotesList from '../components/InboxNotesList'
import NotePreview from '../components/NotePreview'
import { useAuth } from '../context/AuthContext'
import { uploadFile, getCurrentAccount, DropboxAccount } from '../lib/dropbox-client'
import { getInboxPath, storeInboxPath } from '../lib/inbox-storage'

function Home() {
  const { isAuthenticated, isLoading, logout, accessToken } = useAuth()
  const [vaultPath, setVaultPath] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isNewNote, setIsNewNote] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showVaultSelector, setShowVaultSelector] = useState(false)
  const [account, setAccount] = useState<DropboxAccount | null>(null)
  const [inboxPath, setInboxPath] = useState<string>(() => getInboxPath() || 'Inbox')

  useEffect(() => {
    if (!accessToken) return

    getCurrentAccount(accessToken)
      .then(setAccount)
      .catch(() => {})
  }, [accessToken])

  useEffect(() => {
    const handleInboxFileSelect = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      setSelectedFile(customEvent.detail)
    }

    window.addEventListener('inboxFileSelect', handleInboxFileSelect)
    return () => {
      window.removeEventListener('inboxFileSelect', handleInboxFileSelect)
    }
  }, [])

  const handleVaultSelected = useCallback((path: string) => {
    setVaultPath(path)
    setSelectedFile(null)
    setShowVaultSelector(false)
    setIsSettingsOpen(false)
  }, [])

  const handleNavigateNote = useCallback((path: string) => {
    setSelectedFile(path)
  }, [])

  const generateNoteName = useCallback(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `Note ${year}${month}${day}${hours}${minutes}${seconds}`
  }, [])

  const handleCreateNote = useCallback(async () => {
    if (!accessToken || !vaultPath) return

    const noteName = generateNoteName()
    const noteFullPath = `${vaultPath}/${inboxPath}/${noteName}.md`

    await uploadFile(accessToken, noteFullPath, '')
    setIsNewNote(true)
    setSelectedFile(noteFullPath)
  }, [accessToken, vaultPath, inboxPath, generateNoteName])

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const handleChangeVault = useCallback(() => {
    setShowVaultSelector(true)
  }, [])

  const handleInboxPathChange = useCallback((path: string) => {
    setInboxPath(path)
    storeInboxPath(path)
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
              <InboxNotesList vaultPath={vaultPath} inboxPath={inboxPath} />
              <button
                type="button"
                onClick={handleCreateNote}
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
              onClose={() => {
                setSelectedFile(null)
                setIsNewNote(false)
              }}
              noteIndex={new Map()}
              onNavigateNote={handleNavigateNote}
              vaultPath={vaultPath}
              onContentLoaded={() => {}}
              startInEditMode={isNewNote}
            />
          )}
        </>
      )}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        vaultPath={vaultPath}
        onChangeVault={handleChangeVault}
        inboxPath={inboxPath}
        onInboxPathChange={handleInboxPathChange}
        accessToken={accessToken}
      />
    </main>
  )
}

export default Home
