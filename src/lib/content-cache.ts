const contentCache = new Map<string, string>();

export function getCachedContent(key: string): string | undefined {
  return contentCache.get(key);
}

export function setCachedContent(key: string, content: string): void {
  contentCache.set(key, content);
}

export function clearContentCache(): void {
  contentCache.clear();
}

export function generateCacheKey(
  content: string,
  vaultPath: string,
  notePath?: string,
): string {
  const path = notePath || vaultPath;
  return `${path}:${content.substring(0, 100)}`;
}
