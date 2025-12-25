import { describe, it, expect } from 'vitest'
import { filterNotesByTitle, searchInContent, combinedSearch, ContentIndex } from './search'

describe('filterNotesByTitle', () => {
  const notes = [
    '/vault/Meeting Notes.md',
    '/vault/Project Ideas.md',
    '/vault/Daily/2024-01-01.md',
    '/vault/Archive/Old Notes.md',
  ]

  it('returns all notes when query is empty', () => {
    const result = filterNotesByTitle(notes, '')

    expect(result).toEqual(notes)
  })

  it('filters notes by title match', () => {
    const result = filterNotesByTitle(notes, 'notes')

    expect(result).toEqual([
      '/vault/Meeting Notes.md',
      '/vault/Archive/Old Notes.md',
    ])
  })

  it('is case insensitive', () => {
    const result = filterNotesByTitle(notes, 'MEETING')

    expect(result).toEqual(['/vault/Meeting Notes.md'])
  })

  it('matches partial title', () => {
    const result = filterNotesByTitle(notes, 'proj')

    expect(result).toEqual(['/vault/Project Ideas.md'])
  })
})

describe('searchInContent', () => {
  it('returns empty array when index is empty', () => {
    const index: ContentIndex = new Map()

    const result = searchInContent(index, 'test')

    expect(result).toEqual([])
  })

  it('finds notes containing the query in content', () => {
    const index: ContentIndex = new Map([
      ['/vault/note1.md', 'This is about TypeScript programming'],
      ['/vault/note2.md', 'Python is also great'],
      ['/vault/note3.md', 'JavaScript and TypeScript are similar'],
    ])

    const result = searchInContent(index, 'typescript')

    expect(result).toEqual(['/vault/note1.md', '/vault/note3.md'])
  })

  it('is case insensitive', () => {
    const index: ContentIndex = new Map([
      ['/vault/note.md', 'Hello World'],
    ])

    const result = searchInContent(index, 'HELLO')

    expect(result).toEqual(['/vault/note.md'])
  })

  it('returns empty array when query is empty', () => {
    const index: ContentIndex = new Map([
      ['/vault/note.md', 'Some content'],
    ])

    const result = searchInContent(index, '')

    expect(result).toEqual([])
  })
})

describe('combinedSearch', () => {
  it('returns title matches first, then content matches', () => {
    const allPaths = [
      '/vault/Meeting Notes.md',
      '/vault/Project.md',
      '/vault/Ideas.md',
    ]
    const contentIndex: ContentIndex = new Map([
      ['/vault/Project.md', 'Some meeting happened here'],
      ['/vault/Ideas.md', 'Random ideas'],
    ])

    const result = combinedSearch(allPaths, contentIndex, 'meeting')

    expect(result).toEqual([
      '/vault/Meeting Notes.md',
      '/vault/Project.md',
    ])
  })

  it('removes duplicates when found in both title and content', () => {
    const allPaths = ['/vault/TypeScript Guide.md']
    const contentIndex: ContentIndex = new Map([
      ['/vault/TypeScript Guide.md', 'This guide is about TypeScript'],
    ])

    const result = combinedSearch(allPaths, contentIndex, 'typescript')

    expect(result).toEqual(['/vault/TypeScript Guide.md'])
  })
})

