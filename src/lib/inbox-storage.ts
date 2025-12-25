const INBOX_PATH_KEY = 'dropsidian_inbox_path'

export function storeInboxPath(path: string): void {
  localStorage.setItem(INBOX_PATH_KEY, path)
}

export function getInboxPath(): string | null {
  return localStorage.getItem(INBOX_PATH_KEY)
}

export function clearInboxPath(): void {
  localStorage.removeItem(INBOX_PATH_KEY)
}
