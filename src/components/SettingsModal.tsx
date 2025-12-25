import { useState, useEffect } from 'react'
import styles from './SettingsModal.module.css'
import { listFolder } from '../lib/dropbox-client'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  vaultPath?: string | null
  onChangeVault?: () => void
  inboxPath?: string
  onInboxPathChange?: (path: string) => void
  accessToken?: string | null
}

function SettingsModal({
  isOpen,
  onClose,
  vaultPath,
  onChangeVault,
  inboxPath,
  onInboxPathChange,
  accessToken,
}: SettingsModalProps) {
  const [localInboxPath, setLocalInboxPath] = useState(inboxPath || '')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLocalInboxPath(inboxPath || '')
      setValidationError(null)
    }
  }, [isOpen, inboxPath])

  async function handleSave(): Promise<void> {
    const trimmedPath = localInboxPath.trim()
    if (!trimmedPath) {
      setValidationError('Inbox folder cannot be empty')
      return
    }

    if (accessToken && vaultPath) {
      setIsValidating(true)
      setValidationError(null)

      try {
        const fullPath = `${vaultPath}/${trimmedPath}`
        await listFolder(accessToken, fullPath)
        onInboxPathChange?.(trimmedPath)
        onClose()
      } catch {
        setValidationError(
          `Folder "${trimmedPath}" does not exist in your vault. Please create it in Obsidian first.`
        )
      } finally {
        setIsValidating(false)
      }
    } else {
      onInboxPathChange?.(trimmedPath)
      onClose()
    }
  }

  function handleCancel(): void {
    setLocalInboxPath(inboxPath || '')
    onClose()
  }

  if (!isOpen) return null

  const fullInboxPath = vaultPath && localInboxPath
    ? `${vaultPath}/${localInboxPath.trim()}`
    : null

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
            <h3 className={styles.sectionTitle}>Vault Path</h3>
            {vaultPath ? (
              <div className={styles.fieldContainer}>
                <div className={styles.pathDisplay}>{vaultPath}</div>
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
            <h3 className={styles.sectionTitle}>Inbox Folder</h3>
            <div className={styles.fieldContainer}>
              <input
                type="text"
                className={styles.input}
                value={localInboxPath}
                onChange={(e) => {
                  setLocalInboxPath(e.target.value)
                  setValidationError(null)
                }}
                placeholder="e.g., Inbox or GTD/Inbox"
                disabled={isValidating}
                aria-label="Inbox folder path"
              />
            </div>
            {fullInboxPath && (
              <div className={styles.pathPreview}>
                Full path: <span className={styles.pathPreviewValue}>{fullInboxPath}</span>
              </div>
            )}
            {validationError && (
              <p className={styles.errorMessage}>{validationError}</p>
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={isValidating}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isValidating}
          >
            {isValidating ? 'Validating...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal

