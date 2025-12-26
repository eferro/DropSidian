import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listInboxNotesWithContent,
  InboxNote,
  deleteFile,
} from "../lib/dropbox-client";
import { formatDate } from "../lib/date-utils";
import MarkdownPreview from "./MarkdownPreview";
import styles from "./InboxNotesList.module.css";

interface InboxNotesListProps {
  vaultPath: string;
  inboxPath: string;
  refreshKey?: number;
  onDelete?: () => void;
}

function InboxNotesList({
  vaultPath,
  inboxPath,
  refreshKey,
  onDelete,
}: InboxNotesListProps) {
  const { accessToken } = useAuth();
  const [notes, setNotes] = useState<InboxNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!accessToken) return;

    setIsLoading(true);
    listInboxNotesWithContent(accessToken, vaultPath, inboxPath)
      .then(setNotes)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [accessToken, vaultPath, inboxPath, refreshKey]);

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (notes.length === 0) {
    return <div className={styles.empty}>No notes in inbox</div>;
  }

  const handleNoteClick = (notePath: string) => {
    const event = new CustomEvent("inboxFileSelect", { detail: notePath });
    window.dispatchEvent(event);
  };

  const toggleSelection = (noteId: string) => {
    setSelectedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    const count = selectedNotes.size;
    const confirmed = window.confirm(
      `Delete ${count} note(s)? This cannot be undone.`,
    );

    if (!confirmed || !accessToken) return;

    const notesToDelete = notes.filter((note) => selectedNotes.has(note.id));

    await Promise.all(
      notesToDelete.map((note) => deleteFile(accessToken, note.path_display)),
    );

    setSelectedNotes(new Set());

    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className={styles.container}>
      {selectedNotes.size > 0 && (
        <button
          type="button"
          className={styles.deleteButton}
          onClick={handleDeleteSelected}
        >
          Delete selected ({selectedNotes.size})
        </button>
      )}
      <div className={styles.grid}>
        {notes.map((note) => {
          const nameWithoutExt = note.name.replace(/\.md$/, "");
          const isSelected = selectedNotes.has(note.id);
          return (
            <div
              key={note.id}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => handleNoteClick(note.path_display)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNoteClick(note.path_display);
                }
              }}
            >
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedNotes.has(note.id)}
                onChange={() => toggleSelection(note.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <h3 className={styles.cardTitle}>{nameWithoutExt}</h3>
              {note.content && (
                <div className={styles.cardPreview}>
                  <MarkdownPreview
                    content={note.content}
                    maxHeight={200}
                    accessToken={accessToken ?? undefined}
                    vaultPath={vaultPath}
                    notePath={note.path_display}
                    enableLazyLoad={true}
                  />
                </div>
              )}
              <div className={styles.cardFooter}>
                <p className={styles.cardDate}>
                  {formatDate(note.server_modified)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InboxNotesList;
