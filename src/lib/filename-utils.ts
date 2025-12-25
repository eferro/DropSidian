export function sanitizeFilename(filename: string): string {
  return filename.replace(/[/\\:*?"<>|]/g, "-").trim();
}

export function generateFilename(title: string, body: string): string {
  const titleTrimmed = title.trim();
  if (titleTrimmed) {
    return sanitizeFilename(titleTrimmed).substring(0, 100);
  }

  const firstLine = body.split("\n")[0]?.trim() || "";
  if (firstLine) {
    return sanitizeFilename(firstLine).substring(0, 100);
  }

  return "Untitled";
}
