import { getTemporaryLink } from "./dropbox-client";

const imageUrlCache = new Map<string, string>();

export function extractImageReferences(content: string): string[] {
  const wikiImageRegex = /!\[\[([^\]]+)\]\]/g;
  const matches: string[] = [];
  let match;

  while ((match = wikiImageRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

export async function getImagePreviewUrl(
  accessToken: string,
  vaultPath: string,
  filename: string
): Promise<string> {
  const fullPath = `${vaultPath}/${filename}`;
  const cacheKey = fullPath;

  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey)!;
  }

  const url = await getTemporaryLink(accessToken, fullPath);
  imageUrlCache.set(cacheKey, url);

  return url;
}

export function clearImageCache(): void {
  imageUrlCache.clear();
}
