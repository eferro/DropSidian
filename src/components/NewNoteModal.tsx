import { useState, FormEvent } from 'react'

interface NewNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string, content: string) => void
}

function generateTimestampTitle(): string {
  const now = new Date()
  return now.toISOString().slice(0, 19).replace('T', ' ')
}

function NewNoteModal({ isOpen, onClose, onSubmit }: NewNoteModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  if (!isOpen) {
    return null
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const finalTitle = title.trim() || generateTimestampTitle()
    onSubmit(finalTitle, content)
    setTitle('')
    setContent('')
  }

  return (
    <div role="dialog" aria-modal="true">
      <h2>New Note</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="note-title">Title (optional)</label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leave empty for timestamp"
          />
        </div>
        <div>
          <label htmlFor="note-content">Content</label>
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
          />
        </div>
        <div>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit">Create</button>
        </div>
      </form>
    </div>
  )
}

export default NewNoteModal

