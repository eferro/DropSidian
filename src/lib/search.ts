function getFileName(path: string): string {
  const parts = path.split('/')
  const filename = parts.pop() || ''
  return filename.replace(/\.md$/, '')
}

export function filterNotesByTitle(notePaths: string[], query: string): string[] {
  const trimmedQuery = query.trim().toLowerCase()

  if (!trimmedQuery) {
    return notePaths
  }

  return notePaths.filter((path) => {
    const filename = getFileName(path).toLowerCase()
    return filename.includes(trimmedQuery)
  })
}

