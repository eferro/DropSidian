import ReactMarkdown from "react-markdown";
import styles from "./MarkdownPreview.module.css";

interface MarkdownPreviewProps {
  content: string;
  maxHeight: number;
}

function MarkdownPreview({ content, maxHeight }: MarkdownPreviewProps) {
  return (
    <div className={styles.preview} style={{ maxHeight: `${maxHeight}px` }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;
