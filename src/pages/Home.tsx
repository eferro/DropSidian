import { useState, useCallback, useEffect } from "react";
import ConnectDropboxButton from "../components/ConnectDropboxButton";
import Header from "../components/Header";
import VaultSelector from "../components/VaultSelector";
import SettingsModal from "../components/SettingsModal";
import InboxNotesList from "../components/InboxNotesList";
import NewNoteButton from "../components/NewNoteButton";
import NotePreview from "../components/NotePreview";
import { ViewMode } from "../components/ViewModeTabs";
import FileList from "../components/FileList";
import { useAuth } from "../context/AuthContext";
import { getCurrentAccount, DropboxAccount } from "../lib/dropbox-client";
import { getInboxPath, storeInboxPath } from "../lib/inbox-storage";

function Home() {
  const { isAuthenticated, isLoading, logout, accessToken } = useAuth();
  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isNewNote, setIsNewNote] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showVaultSelector, setShowVaultSelector] = useState(false);
  const [account, setAccount] = useState<DropboxAccount | null>(null);
  const [inboxPath, setInboxPath] = useState<string>(
    () => getInboxPath() || "Inbox",
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("inbox");
  const [currentVaultPath, setCurrentVaultPath] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    getCurrentAccount(accessToken)
      .then(setAccount)
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    const handleInboxFileSelect = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setSelectedFile(customEvent.detail);
    };

    window.addEventListener("inboxFileSelect", handleInboxFileSelect);
    return () => {
      window.removeEventListener("inboxFileSelect", handleInboxFileSelect);
    };
  }, []);

  const handleVaultSelected = useCallback((path: string) => {
    setVaultPath(path);
    setCurrentVaultPath(path);
    setSelectedFile(null);
    setShowVaultSelector(false);
    setIsSettingsOpen(false);
  }, []);

  const handleNavigateNote = useCallback((path: string) => {
    setSelectedFile(path);
  }, []);

  const handleNewNoteClick = useCallback(() => {
    setIsCreatingNote(true);
  }, []);

  const handleNoteCreated = useCallback((path: string) => {
    setRefreshKey((k) => k + 1);
    setIsNewNote(true);
    setSelectedFile(path);
    setIsCreatingNote(false);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleChangeVault = useCallback(() => {
    setShowVaultSelector(true);
  }, []);

  const handleInboxPathChange = useCallback((path: string) => {
    setInboxPath(path);
    storeInboxPath(path);
  }, []);

  const handleFileSelect = useCallback((path: string) => {
    setSelectedFile(path);
  }, []);

  const handleModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setSelectedFile(null);
  }, []);

  if (isLoading) {
    return (
      <main>
        <h1>DropSidian</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main>
        <h1>Hello DropSidian</h1>
        <p>Your Obsidian vault, accessible anywhere.</p>
        <ConnectDropboxButton />
      </main>
    );
  }

  const user = account
    ? { displayName: account.name.display_name, email: account.email }
    : undefined;

  const needsVaultSelection = !vaultPath || showVaultSelector;

  return (
    <main>
      <Header
        user={user}
        onLogout={logout}
        onSettings={handleOpenSettings}
        currentViewMode={needsVaultSelection ? undefined : viewMode}
        onViewModeChange={needsVaultSelection ? undefined : handleModeChange}
      />
      {needsVaultSelection ? (
        <VaultSelector onVaultSelected={handleVaultSelected} />
      ) : (
        <>
          {!selectedFile && (
            <>
              {viewMode === "inbox" && (
                <>
                  <NewNoteButton onClick={handleNewNoteClick} />
                  <InboxNotesList
                    vaultPath={vaultPath}
                    inboxPath={inboxPath}
                    refreshKey={refreshKey}
                  />
                </>
              )}
              {viewMode === "vault" && (
                <FileList
                  vaultPath={vaultPath}
                  currentPath={currentVaultPath ?? vaultPath}
                  onCurrentPathChange={setCurrentVaultPath}
                  onFileSelect={handleFileSelect}
                />
              )}
            </>
          )}
          {(selectedFile || isCreatingNote) && (
            <NotePreview
              filePath={selectedFile}
              onClose={() => {
                setSelectedFile(null);
                setIsNewNote(false);
                setIsCreatingNote(false);
              }}
              noteIndex={new Map()}
              onNavigateNote={handleNavigateNote}
              vaultPath={vaultPath}
              inboxPath={inboxPath}
              onContentLoaded={() => {}}
              startInEditMode={isNewNote}
              onDelete={() => setRefreshKey((k) => k + 1)}
              onCreateNote={handleNoteCreated}
            />
          )}
        </>
      )}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        vaultPath={vaultPath}
        onChangeVault={handleChangeVault}
        inboxPath={inboxPath}
        onInboxPathChange={handleInboxPathChange}
        accessToken={accessToken}
      />
    </main>
  );
}

export default Home;
