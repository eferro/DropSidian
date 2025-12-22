import { useState, useCallback } from 'react'
import ConnectDropboxButton from '../components/ConnectDropboxButton'
import AccountInfo from '../components/AccountInfo'
import VaultSelector from '../components/VaultSelector'
import FileList from '../components/FileList'
import NotePreview from '../components/NotePreview'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const [vaultPath, setVaultPath] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const handleVaultSelected = useCallback((path: string) => {
    setVaultPath(path)
    setSelectedFile(null)
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
        <FileList vaultPath={vaultPath} onFileSelect={setSelectedFile} />
      )}
      {selectedFile && (
        <NotePreview
          filePath={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </main>
  )
}

export default Home
