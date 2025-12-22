import ConnectDropboxButton from '../components/ConnectDropboxButton'
import AccountInfo from '../components/AccountInfo'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { isAuthenticated, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <main>
        <h1>DropSidian</h1>
        <p>Loading...</p>
      </main>
    )
  }

  if (isAuthenticated) {
    return (
      <main>
        <h1>DropSidian</h1>
        <p>Connected to Dropbox ✓</p>
        <AccountInfo />
        <button type="button" onClick={logout}>
          Disconnect
        </button>
      </main>
    )
  }

  return (
    <main>
      <h1>Hello DropSidian</h1>
      <p>Your Obsidian vault, accessible anywhere.</p>
      <ConnectDropboxButton />
    </main>
  )
}

export default Home
