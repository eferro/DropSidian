import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { listFolder, DropboxEntry } from "../lib/dropbox-client";
import styles from "./PathInput.module.css";

interface PathInputProps {
  onSelect: (path: string) => void;
  basePath?: string;
}

function getDirectoryPath(path: string): string {
  if (path.endsWith("/")) {
    return path.slice(0, -1);
  }
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return "/" + parts.slice(0, -1).join("/");
}

function isHidden(name: string): boolean {
  return name.startsWith(".");
}

function getSearchTerm(path: string): string {
  if (path.endsWith("/") || path === "") return "";
  const parts = path.split("/");
  return parts[parts.length - 1].toLowerCase();
}

function PathInput({ onSelect, basePath = "" }: PathInputProps) {
  const { accessToken } = useAuth();
  const basePrefix = basePath ? `${basePath}/` : "";
  const [value, setValue] = useState(basePrefix);
  const [suggestions, setSuggestions] = useState<DropboxEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  function handleValueChange(newValue: string): void {
    if (basePrefix && !newValue.startsWith(basePrefix)) {
      return;
    }
    setValue(newValue);
  }

  useEffect(() => {
    if (!accessToken) {
      setSuggestions([]);
      return;
    }

    const directoryPath = value ? getDirectoryPath(value) : "";
    listFolder(accessToken, directoryPath)
      .then((response) => {
        const folders = response.entries.filter(
          (entry) => entry[".tag"] === "folder" && !isHidden(entry.name),
        );
        setSuggestions(folders);
      })
      .catch(() => {
        setSuggestions([]);
      });
  }, [accessToken, value]);

  const filteredSuggestions = suggestions.filter((folder) => {
    const searchTerm = getSearchTerm(value);
    return folder.name.toLowerCase().startsWith(searchTerm);
  });

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={styles.input}
          placeholder="Enter path..."
          value={value}
          onChange={(e) => {
            handleValueChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        <button
          type="button"
          className={styles.selectButton}
          onClick={() => {
            const cleanPath = value.endsWith("/") ? value.slice(0, -1) : value;
            onSelect(cleanPath);
          }}
        >
          Select
        </button>
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {filteredSuggestions.map((folder) => (
            <li key={folder.id}>
              <button
                type="button"
                className={styles.suggestionItem}
                onClick={() => {
                  setValue(`${folder.path_display}/`);
                  setShowSuggestions(false);
                }}
              >
                <span className={styles.folderIcon}>📁</span>
                {folder.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PathInput;

