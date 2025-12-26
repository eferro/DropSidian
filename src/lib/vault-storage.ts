const VAULT_PATH_KEY = "dropsidian_vault_path";

export function storeVaultPath(path: string): void {
  localStorage.setItem(VAULT_PATH_KEY, path);
}

export function getVaultPath(): string | null {
  return localStorage.getItem(VAULT_PATH_KEY);
}

export function clearVaultPath(): void {
  localStorage.removeItem(VAULT_PATH_KEY);
}


