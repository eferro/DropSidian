import styles from "./NewNoteButton.module.css";

interface NewNoteButtonProps {
  onClick: () => void;
}

function NewNoteButton({ onClick }: NewNoteButtonProps) {
  return (
    <div className={styles.container}>
      <button type="button" className={styles.button} onClick={onClick}>
        + New Note
      </button>
    </div>
  );
}

export default NewNoteButton;
