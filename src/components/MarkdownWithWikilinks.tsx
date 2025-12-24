import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { NoteIndex, resolveWikilink } from '../lib/note-index'
import { parseWikilinks } from '../lib/wikilink-parser'
import WikilinkRenderer from './WikilinkRenderer'

interface MarkdownWithWikilinksProps {
  content: string
  noteIndex: NoteIndex
  onNavigate: (path: string) => void
}

interface ContentSegment {
  type: 'text' | 'wikilink'
  content: string
  target?: string
  displayText?: string | null
  resolved?: string | null
}

function splitContentByWikilinks(
  content: string,
  noteIndex: NoteIndex
): ContentSegment[] {
  const wikilinks = parseWikilinks(content)

  if (wikilinks.length === 0) {
    return [{ type: 'text', content }]
  }

  const segments: ContentSegment[] = []
  let lastIndex = 0

  for (const wikilink of wikilinks) {
    if (wikilink.startIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, wikilink.startIndex),
      })
    }

    segments.push({
      type: 'wikilink',
      content: wikilink.fullMatch,
      target: wikilink.target,
      displayText: wikilink.displayText,
      resolved: resolveWikilink(wikilink.target, noteIndex),
    })

    lastIndex = wikilink.endIndex
  }

  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
    })
  }

  return segments
}

function MarkdownWithWikilinks({
  content,
  noteIndex,
  onNavigate,
}: MarkdownWithWikilinksProps) {
  const segments = splitContentByWikilinks(content, noteIndex)

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === 'wikilink') {
          return (
            <WikilinkRenderer
              key={index}
              target={segment.target!}
              displayText={segment.displayText ?? null}
              resolved={segment.resolved ?? null}
              onNavigate={onNavigate}
            />
          )
        }

        return (
          <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
            {segment.content}
          </ReactMarkdown>
        )
      })}
    </>
  )
}

export default MarkdownWithWikilinks

