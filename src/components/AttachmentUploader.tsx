import { useRef, useState } from "react";
import { uploadBinaryFile } from "../lib/dropbox-client";
import { getParentPath } from "../lib/path-utils";
import styles from "./AttachmentUploader.module.css";

interface AttachmentUploaderProps {
  currentNotePath: string;
  accessToken: string;
  onUploadComplete: (filename: string) => void;
}

function AttachmentUploader({
  currentNotePath,
  accessToken,
  onUploadComplete,
}: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const parentPath = getParentPath(currentNotePath);
    const uploadPath = `${parentPath}/${file.name}`;

    setUploading(true);
    try {
      await uploadBinaryFile(accessToken, uploadPath, file);
      onUploadComplete(file.name);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        className={styles.uploadButton}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "📎 Attach"}
      </button>
    </div>
  );
}

export default AttachmentUploader;
