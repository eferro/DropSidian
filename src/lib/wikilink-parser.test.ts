import { describe, it, expect } from 'vitest'
import { parseWikilinks } from './wikilink-parser'

describe('parseWikilinks', () => {
  it('returns empty array when no wikilinks present', () => {
    const text = 'This is plain text without any links.'

    const result = parseWikilinks(text)

    expect(result).toEqual([])
  })

  it('parses a simple wikilink', () => {
    const text = 'Check out [[My Note]] for details.'

    const result = parseWikilinks(text)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      fullMatch: '[[My Note]]',
      target: 'My Note',
      displayText: null,
      startIndex: 10,
      endIndex: 21,
    })
  })

  it('parses wikilink with display text (alias)', () => {
    const text = 'See [[Target Note|click here]] for more.'

    const result = parseWikilinks(text)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      fullMatch: '[[Target Note|click here]]',
      target: 'Target Note',
      displayText: 'click here',
      startIndex: 4,
      endIndex: 30,
    })
  })

  it('parses multiple wikilinks in text', () => {
    const text = 'Link to [[First]] and [[Second|two]] here.'

    const result = parseWikilinks(text)

    expect(result).toHaveLength(2)
    expect(result[0].target).toBe('First')
    expect(result[1].target).toBe('Second')
    expect(result[1].displayText).toBe('two')
  })
})

