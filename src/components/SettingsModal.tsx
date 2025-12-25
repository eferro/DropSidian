import { useState, useEffect } from 'react'
import styles from './SettingsModal.module.css'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  vaultPath?: string | null
  onChangeVault?: () => void
  inboxPath?: string
  onInboxPathChange?: (path: string) => void
}

function SettingsModal({
  isOpen,
  onClose,
  vaultPath,
  onChangeVault,
  inboxPath,
  onInboxPathChange,
}: SettingsModalProps) {
  const [localInboxPath, setLocalInboxPath] = useState(inboxPath || '')

  useEffect(() => {
    if (isOpen) {
      setLocalInboxPath(inboxPath || '')
    }
  }, [isOpen, inboxPath])

  function handleSave(): void {
    if (localInboxPath.trim()) {
      onInboxPathChange?.(localInboxPath.trim())
    }
    onClose()
  }

  function handleCancel(): void {
    setLocalInboxPath(inboxPath || '')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleCancel}
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
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Inbox</h3>
            <label className={styles.inputLabel}>
              Inbox folder
              <input
                type="text"
                className={styles.input}
                value={localInboxPath}
                onChange={(e) => setLocalInboxPath(e.target.value)}
                placeholder="e.g., Inbox or GTD/Inbox"
              />
            </label>
          </div>
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal

