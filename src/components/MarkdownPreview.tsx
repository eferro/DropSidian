import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import styles from "./MarkdownPreview.module.css";
import {
  extractImageReferences,
  getImagePreviewUrl,
} from "../lib/image-preview";
import { useLazyLoad } from "../hooks/useLazyLoad";
import PreviewSkeleton from "./PreviewSkeleton";
import {
  getCachedContent,
  setCachedContent,
  generateCacheKey,
} from "../lib/content-cache";

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
  const [isLoading, setIsLoading] = useState(false);
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
        setIsLoading(false);
        return;
      }

      const cacheKey = generateCacheKey(content, vaultPath, notePath);
      const cached = getCachedContent(cacheKey);

      if (cached) {
        setProcessedContent(cached);
        setIsLoading(false);
        return;
      }

      const imageRefs = extractImageReferences(content);
      if (imageRefs.length > 0) {
        setIsLoading(true);
      }

      const noteDir = notePath
        ? notePath.substring(0, notePath.lastIndexOf("/"))
        : vaultPath;

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
      setCachedContent(cacheKey, processed);
      setIsLoading(false);
    }

    processImages();
  }, [content, accessToken, vaultPath, notePath, shouldLoadImages]);

  if (isLoading) {
    return (
      <div
        ref={ref}
        className={styles.preview}
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <PreviewSkeleton />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={styles.preview}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;
