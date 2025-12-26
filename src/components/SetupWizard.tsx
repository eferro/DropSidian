import { useState, useEffect } from "react";
import { getVaultPath, storeVaultPath } from "../lib/vault-storage";
import { getInboxPath, storeInboxPath } from "../lib/inbox-storage";
import PathInput from "./PathInput";
import styles from "./SetupWizard.module.css";

type SetupStep = "vault" | "inbox" | "complete";

interface SetupWizardProps {
  onComplete: (vaultPath: string, inboxPath: string) => void;
}

function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<SetupStep>("vault");
  const [vaultPath, setVaultPath] = useState<string | null>(null);

  useEffect(() => {
    const storedVault = getVaultPath();
    const storedInbox = getInboxPath();

    if (storedVault && storedInbox) {
      onComplete(storedVault, storedInbox);
      setStep("complete");
    } else if (storedVault) {
      setVaultPath(storedVault);
      setStep("inbox");
    } else {
      setStep("vault");
    }
  }, [onComplete]);

  function handleVaultSelect(path: string): void {
    storeVaultPath(path);
    setVaultPath(path);
    setStep("inbox");
  }

  function handleInboxSelect(path: string): void {
    const prefix = `${vaultPath}/`;
    const relativePath = path.startsWith(prefix)
      ? path.slice(prefix.length)
      : path.replace(/^\//, "");
    storeInboxPath(relativePath);
    if (vaultPath) {
      onComplete(vaultPath, relativePath);
    }
    setStep("complete");
  }

  if (step === "complete") {
    return null;
  }

  if (step === "vault") {
    return (
      <div className={styles.wizard}>
        <div className={styles.stepIndicator}>
          <span className={styles.stepNumber}>Step 1 of 2</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: "50%" }} />
          </div>
        </div>
        <h2 className={styles.title}>📁 Select your Obsidian vault</h2>
        <p className={styles.description}>
          Choose the root folder of your Obsidian vault in Dropbox.
        </p>
        <PathInput onSelect={handleVaultSelect} />
      </div>
    );
  }

  if (step === "inbox") {
    return (
      <div className={styles.wizard}>
        <div className={styles.stepIndicator}>
          <span className={styles.stepNumber}>Step 2 of 2</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: "100%" }} />
          </div>
        </div>
        <h2 className={styles.title}>📥 Select your inbox folder</h2>
        <p className={styles.description}>
          Choose where new notes will be created inside{" "}
          <strong>{vaultPath}</strong>
        </p>
        <PathInput onSelect={handleInboxSelect} basePath={vaultPath || ""} />
      </div>
    );
  }

  return null;
}

export default SetupWizard;

