export type NoteIndex = Map<string, string>;

function extractTitleFromPath(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? filePath;
  return fileName.replace(/\.md$/, "");
}

export function buildNoteIndex(files: string[]): NoteIndex {
  const index: NoteIndex = new Map();

  for (const filePath of files) {
    const title = extractTitleFromPath(filePath);
    index.set(title, filePath);
  }

  return index;
}

export function resolveWikilink(
  target: string,
  index: NoteIndex,
): string | null {
  return index.get(target) ?? null;
}
