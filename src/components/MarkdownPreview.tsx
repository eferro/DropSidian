import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./MarkdownPreview.module.css";
import {
  extractImageReferences,
  getImagePreviewUrl,
} from "../lib/image-preview";
import { useLazyLoad } from "../hooks/useLazyLoad";

interface MarkdownPreviewProps {
  content: string;
  maxHeight: number;
  accessToken?: string;
  vaultPath?: string;
  notePath?: string;
  enableLazyLoad?: boolean;
}

function MarkdownPreview({
  content,
  maxHeight,
  accessToken,
  vaultPath,
  notePath,
  enableLazyLoad = false,
}: MarkdownPreviewProps) {
  const [processedContent, setProcessedContent] = useState(content);
  const { isVisible, ref } = useLazyLoad();

  const shouldLoadImages = enableLazyLoad ? isVisible : true;

  useEffect(() => {
    if (!shouldLoadImages) {
      setProcessedContent(content);
      return;
    }

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
  }, [content, accessToken, vaultPath, notePath, shouldLoadImages]);

  return (
    <div
      ref={ref}
      className={styles.preview}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <ReactMarkdown>{processedContent}</ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;
