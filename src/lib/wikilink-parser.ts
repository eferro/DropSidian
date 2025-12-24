export interface WikilinkMatch {
  fullMatch: string
  target: string
  displayText: string | null
  startIndex: number
  endIndex: number
}

const WIKILINK_REGEX = /(?<!!)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

export function parseWikilinks(text: string): WikilinkMatch[] {
  const matches: WikilinkMatch[] = []
  let match: RegExpExecArray | null

  while ((match = WIKILINK_REGEX.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      target: match[1],
      displayText: match[2] ?? null,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return matches
}

