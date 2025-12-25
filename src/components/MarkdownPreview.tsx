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
}

function MarkdownPreview({
  content,
  maxHeight,
  accessToken,
  vaultPath,
}: MarkdownPreviewProps) {
  const [processedContent, setProcessedContent] = useState(content);

  useEffect(() => {
    async function processImages() {
      if (!accessToken || !vaultPath) {
        setProcessedContent(content);
        return;
      }

      const imageRefs = extractImageReferences(content);
      let processed = content;

      for (const imageRef of imageRefs) {
        try {
          const imageUrl = await getImagePreviewUrl(
            accessToken,
            vaultPath,
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
  }, [content, accessToken, vaultPath]);

  return (
    <div className={styles.preview} style={{ maxHeight: `${maxHeight}px` }}>
      <ReactMarkdown>{processedContent}</ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;
