import { useState, useEffect } from "react";
import { getVaultPath, storeVaultPath } from "../lib/vault-storage";
import { getInboxPath, storeInboxPath } from "../lib/inbox-storage";
import PathInput from "./PathInput";

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
      <div>
        <h2>Select your Obsidian vault</h2>
        <p>Type or select your vault folder path in Dropbox.</p>
        <PathInput onSelect={handleVaultSelect} />
      </div>
    );
  }

  if (step === "inbox") {
    return (
      <div>
        <h2>Select your inbox folder</h2>
        <p>Type or select your inbox folder path inside the vault.</p>
        <PathInput onSelect={handleInboxSelect} basePath={vaultPath || ""} />
      </div>
    );
  }

  return null;
}

export default SetupWizard;

