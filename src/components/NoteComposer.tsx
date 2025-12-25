import { useState } from 'react'
import styles from './NoteComposer.module.css'

interface NoteComposerProps {
  onCreateNote: (title: string, body: string) => void
}

function NoteComposer({ onCreateNote }: NoteComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  function handleClose(): void {
    if (title.trim() || body.trim()) {
      onCreateNote(title, body)
    }
    setIsExpanded(false)
    setTitle('')
    setBody('')
  }

  if (!isExpanded) {
    return (
      <div className={styles.container}>
        <div className={styles.collapsed}>
          <input
            type="text"
            className={styles.collapsedInput}
            placeholder="Take a note..."
            onFocus={() => setIsExpanded(true)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.expanded}>
        <input
          type="text"
          className={styles.titleInput}
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={styles.bodyTextarea}
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.closeButton} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoteComposer
