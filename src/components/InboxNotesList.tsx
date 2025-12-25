import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { listInboxNotes, InboxNote } from '../lib/dropbox-client'
import { formatDate } from '../lib/date-utils'
import styles from './InboxNotesList.module.css'

interface InboxNotesListProps {
  vaultPath: string
  inboxPath: string
  refreshKey?: number
}

function InboxNotesList({ vaultPath, inboxPath, refreshKey }: InboxNotesListProps) {
  const { accessToken } = useAuth()
  const [notes, setNotes] = useState<InboxNote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return

    setIsLoading(true)
    listInboxNotes(accessToken, vaultPath, inboxPath)
      .then(setNotes)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [accessToken, vaultPath, inboxPath, refreshKey])

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (notes.length === 0) {
    return <div className={styles.empty}>No notes in inbox</div>
  }

  const handleNoteClick = (notePath: string) => {
    const event = new CustomEvent('inboxFileSelect', { detail: notePath })
    window.dispatchEvent(event)
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {notes.map((note) => {
          const nameWithoutExt = note.name.replace(/\.md$/, '')
          return (
            <div
              key={note.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => handleNoteClick(note.path_display)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleNoteClick(note.path_display)
                }
              }}
            >
              <h3 className={styles.cardTitle}>{nameWithoutExt}</h3>
              <p className={styles.cardDate}>{formatDate(note.server_modified)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InboxNotesList
