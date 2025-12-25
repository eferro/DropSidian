export function createLogger(isDev: boolean) {
  return function debugLog(message: string, data?: unknown): void {
    if (isDev) {
      console.log(`[DropSidian] ${message}`, data)
    }
  }
}

export const debugLog = createLogger(import.meta.env.DEV)
