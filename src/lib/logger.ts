export function createLogger(isDev: boolean) {
  return function debugLog(message: string, data?: unknown): void {
    if (isDev) {
      if (data !== undefined) {
        console.log(`[DropSidian] ${message}`, JSON.stringify(data, null, 2));
      } else {
        console.log(`[DropSidian] ${message}`);
      }
    }
  };
}

export const debugLog = createLogger(import.meta.env.DEV);
