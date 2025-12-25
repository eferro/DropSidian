import { getTemporaryLink } from "./dropbox-client";

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
  return await getTemporaryLink(accessToken, fullPath);
}
