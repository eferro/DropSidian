import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { listInboxNotes, InboxNote } from '../lib/dropbox-client'
import styles from './InboxNotesList.module.css'

interface InboxNotesListProps {
  vaultPath: string
  inboxPath: string
}

function InboxNotesList({ vaultPath, inboxPath }: InboxNotesListProps) {
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
  }, [accessToken, vaultPath, inboxPath])

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (notes.length === 0) {
    return <div className={styles.empty}>No notes in inbox</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {notes.map((note) => {
          const nameWithoutExt = note.name.replace(/\.md$/, '')
          return (
            <div key={note.id} className={styles.card}>
              <h3 className={styles.cardTitle}>{nameWithoutExt}</h3>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InboxNotesList
