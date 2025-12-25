import styles from "./ViewModeTabs.module.css";

export type ViewMode = "inbox" | "vault";

interface ViewModeTabsProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

function ViewModeTabs({ currentMode, onModeChange }: ViewModeTabsProps) {
  return (
    <div className={styles.container}>
      <button
        type="button"
        className={`${styles.tab} ${currentMode === "inbox" ? styles.active : ""}`}
        onClick={() => onModeChange("inbox")}
        aria-pressed={currentMode === "inbox"}
      >
        Inbox
      </button>
      <button
        type="button"
        className={`${styles.tab} ${currentMode === "vault" ? styles.active : ""}`}
        onClick={() => onModeChange("vault")}
        aria-pressed={currentMode === "vault"}
      >
        Vault
      </button>
    </div>
  );
}

export default ViewModeTabs;
