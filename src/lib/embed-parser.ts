export interface EmbedMatch {
  fullMatch: string
  target: string
  startIndex: number
  endIndex: number
}

const EMBED_REGEX = /!\[\[([^\]]+)\]\]/g

export function parseEmbeds(text: string): EmbedMatch[] {
  const matches: EmbedMatch[] = []
  let match: RegExpExecArray | null

  while ((match = EMBED_REGEX.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      target: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return matches
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']

export function isImageEmbed(target: string): boolean {
  const lowerTarget = target.toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => lowerTarget.endsWith(ext))
}

