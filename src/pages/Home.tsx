import { useState, useCallback, useEffect } from 'react'
import ConnectDropboxButton from '../components/ConnectDropboxButton'
import Header from '../components/Header'
import VaultSelector from '../components/VaultSelector'
import SettingsModal from '../components/SettingsModal'
import InboxNotesList from '../components/InboxNotesList'
import NoteComposer from '../components/NoteComposer'
import NotePreview from '../components/NotePreview'
import { useAuth } from '../context/AuthContext'
import { uploadFile, getCurrentAccount, DropboxAccount } from '../lib/dropbox-client'
import { getInboxPath, storeInboxPath } from '../lib/inbox-storage'
import { generateFilename } from '../lib/filename-utils'

function Home() {
  const { isAuthenticated, isLoading, logout, accessToken } = useAuth()
  const [vaultPath, setVaultPath] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isNewNote, setIsNewNote] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showVaultSelector, setShowVaultSelector] = useState(false)
  const [account, setAccount] = useState<DropboxAccount | null>(null)
  const [inboxPath, setInboxPath] = useState<string>(() => getInboxPath() || 'Inbox')
  const [refreshKey, setRefreshKey] = useState(0)

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

  const handleCreateNote = useCallback(async (title: string, body: string) => {
    if (!accessToken || !vaultPath) return

    const noteName = generateFilename(title, body)
    const noteFullPath = `${vaultPath}/${inboxPath}/${noteName}.md`
    const content = title.trim() ? `# ${title}\n\n${body}` : body

    await uploadFile(accessToken, noteFullPath, content)
    setRefreshKey((k) => k + 1)
    setIsNewNote(true)
    setSelectedFile(noteFullPath)
  }, [accessToken, vaultPath, inboxPath])

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
              <NoteComposer onCreateNote={handleCreateNote} />
              <InboxNotesList vaultPath={vaultPath} inboxPath={inboxPath} refreshKey={refreshKey} />
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
