import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { listFolder, DropboxEntry } from "../lib/dropbox-client";

interface FolderBrowserProps {
  onSelect: (path: string) => void;
  basePath?: string;
}

function FolderBrowser({ onSelect, basePath = "" }: FolderBrowserProps) {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [folders, setFolders] = useState<DropboxEntry[]>([]);
  const [currentPath, setCurrentPath] = useState(basePath);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    listFolder(accessToken, currentPath || "")
      .then((response) => {
        const onlyFolders = response.entries.filter(
          (entry) => entry[".tag"] === "folder",
        );
        setFolders(onlyFolders);
      })
      .catch(() => {
        setFolders([]);
        setError("Failed to load folders. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, currentPath]);

  function handleBack(): void {
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    setCurrentPath(parentPath);
  }

  const canGoBack = currentPath !== "" && currentPath !== basePath;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => setCurrentPath(currentPath)}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {canGoBack && (
        <button type="button" onClick={handleBack}>
          Back
        </button>
      )}
      <p>Current: {currentPath || "/"}</p>
      {folders.length === 0 ? (
        <p>No folders in this directory</p>
      ) : (
        <ul>
          {folders.map((folder) => (
            <li key={folder.id}>
              <button
                type="button"
                onClick={() => setCurrentPath(folder.path_display)}
              >
                {folder.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => onSelect(currentPath)}>
        Select this folder
      </button>
    </div>
  );
}

export default FolderBrowser;

