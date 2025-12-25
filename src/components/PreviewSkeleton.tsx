import styles from "./PreviewSkeleton.module.css";

function PreviewSkeleton() {
  return (
    <div className={styles.skeleton} data-testid="preview-skeleton">
      <div className={styles.line} />
      <div className={styles.line} />
      <div className={styles.lineShort} />
    </div>
  );
}

export default PreviewSkeleton;
