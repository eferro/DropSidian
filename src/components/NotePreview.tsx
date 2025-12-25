import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  downloadFileWithMetadata,
  updateFile,
  uploadFile,
  deleteFile,
} from "../lib/dropbox-client";
import { generateFilename } from "../lib/filename-utils";
import { useAuth } from "../context/AuthContext";
import { NoteIndex } from "../lib/note-index";
import { removeExtension } from "../lib/path-utils";
import MarkdownWithWikilinks from "./MarkdownWithWikilinks";
import AttachmentUploader from "./AttachmentUploader";
import { usePasteImage } from "../hooks/usePasteImage";
import styles from "./NotePreview.module.css";

interface NotePreviewProps {
  filePath: string | null;
  onClose: () => void;
  noteIndex?: NoteIndex;
  onNavigateNote?: (path: string) => void;
  vaultPath?: string;
  inboxPath?: string;
  onContentLoaded?: (path: string, content: string) => void;
  startInEditMode?: boolean;
  onDelete?: () => void;
  onCreateNote?: (path: string) => void;
}

function NotePreview({
  filePath,
  onClose,
  noteIndex,
  onNavigateNote,
  vaultPath,
  inboxPath,
  onContentLoaded,
  startInEditMode = false,
  onDelete,
  onCreateNote,
}: NotePreviewProps) {
  const { accessToken } = useAuth();
  const isNewNote = filePath === null;
  const [content, setContent] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [rev, setRev] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNewNote);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(isNewNote || startInEditMode);

  useEffect(() => {
    if (!accessToken || !filePath || isNewNote) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    downloadFileWithMetadata(accessToken, filePath)
      .then((result) => {
        setContent(result.content);
        setEditContent(result.content);
        setRev(result.rev);
        setLoading(false);
        if (onContentLoaded) {
          onContentLoaded(filePath, result.content);
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [accessToken, filePath, onContentLoaded, isNewNote]);

  const handleSave = useCallback(async () => {
    if (!accessToken) return;

    setSaving(true);
    setError(null);

    try {
      if (isNewNote) {
        if (!vaultPath || !inboxPath) {
          setError("Vault path and inbox path are required to create a note");
          setSaving(false);
          return;
        }

        const lines = editContent.split("\n");
        const title = lines[0]?.startsWith("# ") ? lines[0].slice(2) : "";
        const body = title ? lines.slice(1).join("\n").trim() : editContent;

        const noteName = generateFilename(title, body);
        const noteFullPath = `${vaultPath}/${inboxPath}/${noteName}.md`;
        const content = title.trim() ? `# ${title}\n\n${body}` : body;

        await uploadFile(accessToken, noteFullPath, content);
        setContent(content);
        setIsEditing(false);
        if (onCreateNote) {
          onCreateNote(noteFullPath);
        }
      } else {
        if (!rev) return;
        const result = await updateFile(
          accessToken,
          filePath,
          editContent,
          rev,
        );
        setContent(editContent);
        setRev(result.rev);
        setIsEditing(false);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Conflict")) {
        setError("Conflict: The file was modified elsewhere. Please reload.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }, [
    accessToken,
    filePath,
    editContent,
    rev,
    isNewNote,
    vaultPath,
    inboxPath,
    onCreateNote,
  ]);

  const handleEdit = () => {
    setEditContent(content ?? "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (isNewNote) {
      onClose();
      return;
    }
    setEditContent(content ?? "");
    setIsEditing(false);
    setError(null);
  };

  const handleImagePasted = useCallback((filename: string) => {
    setEditContent((prev) => `${prev}\n![[${filename}]]`);
  }, []);

  const currentNotePathForUpload =
    filePath ||
    (vaultPath && inboxPath ? `${vaultPath}/${inboxPath}/temp.md` : "");

  const { handlePaste: handlePasteImage, uploading: uploadingPastedImage } =
    usePasteImage({
      accessToken: accessToken ?? "",
      currentNotePath: currentNotePathForUpload,
      onImagePasted: handleImagePasted,
    });

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      handlePasteImage(event);
    },
    [handlePasteImage],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleDelete = useCallback(async () => {
    if (!filePath) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this note? This action cannot be undone.",
    );
    if (confirmed && accessToken) {
      await deleteFile(accessToken, filePath);
      if (onDelete) {
        onDelete();
      }
      onClose();
    }
  }, [accessToken, filePath, onClose, onDelete]);

  if (loading) {
    return (
      <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          Loading note...
        </div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>Error: {error}</p>
          <button
            type="button"
            className={styles.errorCloseButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const fileName = isNewNote
    ? "New Note"
    : (filePath.split("/").pop() ?? filePath);

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.header}>
            <h2 className={styles.title}>
              {isNewNote ? "New Note" : removeExtension(fileName)}
            </h2>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
              >
                ✕ Close
              </button>
              {!isEditing ? (
                <>
                  {!isNewNote && (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={handleDelete}
                    >
                      🗑 Delete
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={handleEdit}
                  >
                    ✎ Edit
                  </button>
                </>
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
                    {saving ? "Saving..." : "✓ Save"}
                  </button>
                </>
              )}
            </div>
          </div>
          {error && <p className={styles.errorMessage}>{error}</p>}
          {isEditing ? (
            <>
              {accessToken && currentNotePathForUpload && (
                <AttachmentUploader
                  currentNotePath={currentNotePathForUpload}
                  accessToken={accessToken}
                  onUploadComplete={(filename) => {
                    setEditContent((prev) => `${prev}\n![[${filename}]]`);
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
                  content={content ?? ""}
                  noteIndex={noteIndex}
                  onNavigate={onNavigateNote}
                  accessToken={accessToken ?? undefined}
                  currentPath={filePath ?? undefined}
                  vaultPath={vaultPath}
                />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content ?? ""}
                </ReactMarkdown>
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotePreview;
