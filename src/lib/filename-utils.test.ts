import { describe, it, expect } from 'vitest'
import { sanitizeFilename, generateFilename } from './filename-utils'

describe('sanitizeFilename', () => {
  it('removes illegal characters from filename', () => {
    const result = sanitizeFilename('My/Note\\File:Name')

    expect(result).toBe('My-Note-File-Name')
  })

  it('trims whitespace from both ends', () => {
    const result = sanitizeFilename('  My Note  ')

    expect(result).toBe('My Note')
  })

  it('returns empty string for whitespace-only input', () => {
    const result = sanitizeFilename('   ')

    expect(result).toBe('')
  })
})

describe('generateFilename', () => {
  it('uses title when provided', () => {
    const result = generateFilename('My Title', 'Some body content')

    expect(result).toBe('My Title')
  })

  it('uses first line of body when title is empty', () => {
    const result = generateFilename('', 'First line\nSecond line')

    expect(result).toBe('First line')
  })

  it('truncates long filenames to 100 characters', () => {
    const longTitle = 'A'.repeat(150)
    const result = generateFilename(longTitle, '')

    expect(result).toBe('A'.repeat(100))
  })

  it('returns "Untitled" when both title and body are empty', () => {
    const result = generateFilename('', '')

    expect(result).toBe('Untitled')
  })

  it('sanitizes the generated filename', () => {
    const result = generateFilename('My/Title:Name', '')

    expect(result).toBe('My-Title-Name')
  })
})
