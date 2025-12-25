import { useState } from 'react'
import styles from './Header.module.css'

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
    <header className={styles.header}>
      <span className={styles.logo}>DropSidian</span>
      {user && (
        <div className={styles.userMenuContainer}>
          <button
            type="button"
            aria-label="User menu"
            className={styles.avatarButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {user.displayName.charAt(0).toUpperCase()}
          </button>
          {isMenuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{user.displayName}</p>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
              <div className={styles.menuActions}>
                <button
                  type="button"
                  className={`${styles.menuButton} ${styles.settingsButton}`}
                  onClick={onSettings}
                >
                  Settings
                </button>
                <button
                  type="button"
                  className={`${styles.menuButton} ${styles.disconnectButton}`}
                  onClick={onLogout}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export default Header

