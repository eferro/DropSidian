import styles from './SettingsModal.module.css'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  vaultPath?: string | null
  onChangeVault?: () => void
}

function SettingsModal({
  isOpen,
  onClose,
  vaultPath,
  onChangeVault,
}: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Vault</h3>
            {vaultPath ? (
              <div className={styles.vaultInfo}>
                <span className={styles.vaultPath}>{vaultPath}</span>
                <button
                  type="button"
                  className={styles.changeButton}
                  onClick={onChangeVault}
                >
                  Change
                </button>
              </div>
            ) : (
              <p className={styles.noVault}>No vault selected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal

