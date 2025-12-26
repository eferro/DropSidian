import { useState } from "react";
import styles from "./Header.module.css";
import { ViewMode } from "./ViewModeTabs";

interface User {
  displayName: string;
  email: string;
}

interface HeaderProps {
  user?: User;
  onLogout?: () => void;
  onReconfigure?: () => void;
  currentViewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

function Header({
  user,
  onLogout,
  onReconfigure,
  currentViewMode,
  onViewModeChange,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        {currentViewMode !== undefined && onViewModeChange && (
          <div className={styles.navTabs}>
            <button
              type="button"
              className={`${styles.navTab} ${
                currentViewMode === "inbox" ? styles.active : ""
              }`}
              onClick={() => onViewModeChange("inbox")}
              aria-pressed={currentViewMode === "inbox"}
            >
              Inbox
            </button>
            <button
              type="button"
              className={`${styles.navTab} ${
                currentViewMode === "vault" ? styles.active : ""
              }`}
              onClick={() => onViewModeChange("vault")}
              aria-pressed={currentViewMode === "vault"}
            >
              Vault
            </button>
          </div>
        )}
      </div>
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
                {onReconfigure && (
                  <button
                    type="button"
                    className={styles.menuButton}
                    onClick={onReconfigure}
                  >
                    Reconfigure
                  </button>
                )}
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
  );
}

export default Header;
