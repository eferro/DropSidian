import ConnectDropboxButton from '../components/ConnectDropboxButton'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { isAuthenticated, logout } = useAuth()

  if (isAuthenticated) {
    return (
      <main>
        <h1>DropSidian</h1>
        <p>Connected to Dropbox ✓</p>
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
