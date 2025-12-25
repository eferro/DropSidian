import { useState } from 'react'

interface User {
  displayName: string
  email: string
}

interface HeaderProps {
  user?: User
  onLogout?: () => void
  onSettings?: () => void
}

function Header({ user, onLogout, onSettings }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header>
      <span>DropSidian</span>
      {user && (
        <div>
          <button
            type="button"
            aria-label="User menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {user.displayName.charAt(0)}
          </button>
          {isMenuOpen && (
            <div>
              <p>{user.displayName}</p>
              <p>{user.email}</p>
              <button type="button" onClick={onSettings}>
                Settings
              </button>
              <button type="button" onClick={onLogout}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export default Header

