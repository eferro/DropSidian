import { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { downloadFileWithMetadata, updateFile } from '../lib/dropbox-client'
import { useAuth } from '../context/AuthContext'
import { NoteIndex } from '../lib/note-index'
import MarkdownWithWikilinks from './MarkdownWithWikilinks'
import AttachmentUploader from './AttachmentUploader'
import { usePasteImage } from '../hooks/usePasteImage'
import styles from './NotePreview.module.css'

interface NotePreviewProps {
  filePath: string
  onClose: () => void
  noteIndex?: NoteIndex
  onNavigateNote?: (path: string) => void
  vaultPath?: string
  onContentLoaded?: (path: string, content: string) => void
}

function removeExtension(filename: string): string {
  return filename.replace(/\.md$/, '')
}

function NotePreview({
  filePath,
  onClose,
  noteIndex,
  onNavigateNote,
  vaultPath,
  onContentLoaded,
}: NotePreviewProps) {
  const { accessToken } = useAuth()
  const [content, setContent] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<string>('')
  const [rev, setRev] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!accessToken || !filePath) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    downloadFileWithMetadata(accessToken, filePath)
      .then((result) => {
        setContent(result.content)
        setEditContent(result.content)
        setRev(result.rev)
        setLoading(false)
        if (onContentLoaded) {
          onContentLoaded(filePath, result.content)
        }
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [accessToken, filePath, onContentLoaded])

  const handleSave = useCallback(async () => {
    if (!accessToken || !rev) return

    setSaving(true)
    setError(null)

    try {
      const result = await updateFile(accessToken, filePath, editContent, rev)
      setContent(editContent)
      setRev(result.rev)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof Error && err.message.includes('Conflict')) {
        setError('Conflict: The file was modified elsewhere. Please reload.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save')
      }
    } finally {
      setSaving(false)
    }
  }, [accessToken, filePath, editContent, rev])

  const handleEdit = () => {
    setEditContent(content ?? '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditContent(content ?? '')
    setIsEditing(false)
    setError(null)
  }

  const handleImagePasted = useCallback((filename: string) => {
    setEditContent((prev) => `${prev}\n![[${filename}]]`)
  }, [])

  const { handlePaste, uploading: uploadingPastedImage } = usePasteImage({
    accessToken: accessToken ?? '',
    currentNotePath: filePath,
    onImagePasted: handleImagePasted,
  })

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        Loading note...
      </div>
    )
  }

  if (error && !isEditing) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error: {error}</p>
        <button type="button" className={styles.errorCloseButton} onClick={onClose}>
          Close
        </button>
      </div>
    )
  }

  const fileName = filePath.split('/').pop() ?? filePath

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{removeExtension(fileName)}</h2>
        <div className={styles.actions}>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ✕ Close
          </button>
          {!isEditing ? (
            <button type="button" className={styles.editButton} onClick={handleEdit}>
              ✎ Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.saveButton}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : '✓ Save'}
              </button>
            </>
          )}
        </div>
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
      {isEditing ? (
        <>
          {accessToken && (
            <AttachmentUploader
              currentNotePath={filePath}
              accessToken={accessToken}
              onUploadComplete={(filename) => {
                setEditContent((prev) => `${prev}\n![[${filename}]]`)
              }}
            />
          )}
          <div className={styles.editorContainer}>
            <textarea
              className={styles.editor}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onPaste={handlePaste}
            />
            {uploadingPastedImage && (
              <div className={styles.uploadingOverlay}>
                Uploading image...
              </div>
            )}
          </div>
        </>
      ) : (
        <article className={styles.article}>
          {noteIndex && onNavigateNote ? (
            <MarkdownWithWikilinks
              content={content ?? ''}
              noteIndex={noteIndex}
              onNavigate={onNavigateNote}
              accessToken={accessToken ?? undefined}
              currentPath={filePath}
              vaultPath={vaultPath}
            />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content ?? ''}
            </ReactMarkdown>
          )}
        </article>
      )}
    </div>
  )
}

export default NotePreview

