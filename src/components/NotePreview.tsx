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
    console.log('[DropSidian] Entering edit mode')
    setEditContent(content ?? '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    console.log('[DropSidian] Canceling edit mode')
    setEditContent(content ?? '')
    setIsEditing(false)
    setError(null)
  }

  const handleImagePasted = useCallback((filename: string) => {
    console.log('[DropSidian] Image pasted callback:', filename)
    setEditContent((prev) => `${prev}\n![[${filename}]]`)
  }, [])

  const { handlePaste: handlePasteImage, uploading: uploadingPastedImage } = usePasteImage({
    accessToken: accessToken ?? '',
    currentNotePath: filePath,
    onImagePasted: handleImagePasted,
  })

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      console.log('[DropSidian] NotePreview paste event received')
      console.log('[DropSidian] Event target:', event.target)
      console.log('[DropSidian] clipboardData:', event.clipboardData)
      console.log('[DropSidian] clipboardData.types:', event.clipboardData?.types)

      if (event.clipboardData?.types) {
        console.log('[DropSidian] Clipboard types array:', Array.from(event.clipboardData.types))
      }

      if (event.clipboardData?.items) {
        console.log('[DropSidian] Items count:', event.clipboardData.items.length)
        for (let i = 0; i < event.clipboardData.items.length; i++) {
          const item = event.clipboardData.items[i]
          console.log(`[DropSidian] Direct item ${i}:`, { kind: item.kind, type: item.type })
        }
      }

      if (event.clipboardData?.files) {
        console.log('[DropSidian] Files count:', event.clipboardData.files.length)
        for (let i = 0; i < event.clipboardData.files.length; i++) {
          const file = event.clipboardData.files[i]
          console.log(`[DropSidian] Direct file ${i}:`, { name: file.name, type: file.type, size: file.size })
        }
      }

      handlePasteImage(event)
    },
    [handlePasteImage]
  )

  // Log paste events at document level to see if they're captured elsewhere
  useEffect(() => {
    const handleDocumentPaste = (event: ClipboardEvent) => {
      console.log('[DropSidian] Document-level paste event')
      console.log('[DropSidian] Document paste target:', event.target)
      console.log('[DropSidian] Document paste types:', event.clipboardData?.types)
    }

    document.addEventListener('paste', handleDocumentPaste)
    console.log('[DropSidian] Document paste listener attached')

    return () => {
      document.removeEventListener('paste', handleDocumentPaste)
      console.log('[DropSidian] Document paste listener removed')
    }
  }, [])

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
              onChange={(e) => {
                console.log('[DropSidian] Textarea onChange')
                setEditContent(e.target.value)
              }}
              onPaste={handlePaste}
              onFocus={() => console.log('[DropSidian] Textarea focused')}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'v') {
                  console.log('[DropSidian] Ctrl+V keydown detected in textarea')
                }
              }}
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

