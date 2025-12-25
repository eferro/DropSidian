import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./MarkdownPreview.module.css";
import {
  extractImageReferences,
  getImagePreviewUrl,
} from "../lib/image-preview";

interface MarkdownPreviewProps {
  content: string;
  maxHeight: number;
  accessToken?: string;
  vaultPath?: string;
  notePath?: string;
}

function MarkdownPreview({
  content,
  maxHeight,
  accessToken,
  vaultPath,
  notePath,
}: MarkdownPreviewProps) {
  const [processedContent, setProcessedContent] = useState(content);

  useEffect(() => {
    async function processImages() {
      if (!accessToken || !vaultPath) {
        setProcessedContent(content);
        return;
      }

      const noteDir = notePath
        ? notePath.substring(0, notePath.lastIndexOf("/"))
        : vaultPath;

      const imageRefs = extractImageReferences(content);
      let processed = content;

      for (const imageRef of imageRefs) {
        try {
          const imageUrl = await getImagePreviewUrl(
            accessToken,
            noteDir,
            imageRef
          );
          processed = processed.replace(
            `![[${imageRef}]]`,
            `![${imageRef}](${imageUrl})`
          );
        } catch (error) {
          console.error(`Failed to load image ${imageRef}:`, error);
        }
      }

      setProcessedContent(processed);
    }

    processImages();
  }, [content, accessToken, vaultPath, notePath]);

  return (
    <div className={styles.preview} style={{ maxHeight: `${maxHeight}px` }}>
      <ReactMarkdown>{processedContent}</ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;
