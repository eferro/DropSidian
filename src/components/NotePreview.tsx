import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { downloadFile } from '../lib/dropbox-client'
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken || !filePath) {
      setLoading(false)
      return
    }

    setLoading(true)
    downloadFile(accessToken, filePath)
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [accessToken, filePath])

  if (loading) {
    return <p>Loading note...</p>
  }

  if (error) {
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
      <button type="button" onClick={onClose}>
        Close
      </button>
      <article>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content ?? ''}
        </ReactMarkdown>
      </article>
    </div>
  )
}

export default NotePreview

