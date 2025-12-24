import { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { downloadFileWithMetadata, updateFile } from '../lib/dropbox-client'
import { useAuth } from '../context/AuthContext'

interface NotePreviewProps {
  filePath: string
  onClose: () => void
}

function removeExtension(filename: string): string {
  return filename.replace(/\.md$/, '')
}

function NotePreview({ filePath, onClose }: NotePreviewProps) {
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
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [accessToken, filePath])

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

  if (loading) {
    return <p>Loading note...</p>
  }

  if (error && !isEditing) {
    return (
      <div>
        <p>Error: {error}</p>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    )
  }

  const fileName = filePath.split('/').pop() ?? filePath

  return (
    <div>
      <h2>{removeExtension(fileName)}</h2>
      <div>
        <button type="button" onClick={onClose}>
          Close
        </button>
        {!isEditing ? (
          <button type="button" onClick={handleEdit}>
            Edit
          </button>
        ) : (
          <>
            <button type="button" onClick={handleCancelEdit} disabled={saving}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={20}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />
      ) : (
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content ?? ''}
          </ReactMarkdown>
        </article>
      )}
    </div>
  )
}

export default NotePreview

