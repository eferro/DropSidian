export type ContentIndex = Map<string, string>

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

export function searchInContent(index: ContentIndex, query: string): string[] {
  const trimmedQuery = query.trim().toLowerCase()

  if (!trimmedQuery) {
    return []
  }

  const results: string[] = []

  for (const [path, content] of index.entries()) {
    if (content.toLowerCase().includes(trimmedQuery)) {
      results.push(path)
    }
  }

  return results
}

export function combinedSearch(
  allPaths: string[],
  contentIndex: ContentIndex,
  query: string
): string[] {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return []
  }

  const titleMatches = filterNotesByTitle(allPaths, trimmedQuery)
  const contentMatches = searchInContent(contentIndex, trimmedQuery)

  const titleMatchSet = new Set(titleMatches)
  const uniqueContentMatches = contentMatches.filter(
    (path) => !titleMatchSet.has(path)
  )

  return [...titleMatches, ...uniqueContentMatches]
}

