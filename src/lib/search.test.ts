import { describe, it, expect } from 'vitest'
import { filterNotesByTitle } from './search'

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

