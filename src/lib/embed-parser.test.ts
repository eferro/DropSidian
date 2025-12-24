import { describe, it, expect } from 'vitest'
import { parseEmbeds, isImageEmbed } from './embed-parser'

describe('parseEmbeds', () => {
  it('returns empty array when no embeds present', () => {
    const text = 'This is plain text without any embeds.'

    const result = parseEmbeds(text)

    expect(result).toEqual([])
  })

  it('parses a simple image embed', () => {
    const text = 'Here is an image: ![[photo.png]]'

    const result = parseEmbeds(text)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      fullMatch: '![[photo.png]]',
      target: 'photo.png',
      startIndex: 18,
      endIndex: 32,
    })
  })
})

describe('isImageEmbed', () => {
  it('returns true for png files', () => {
    expect(isImageEmbed('photo.png')).toBe(true)
  })

  it('returns true for jpg files', () => {
    expect(isImageEmbed('photo.jpg')).toBe(true)
  })

  it('returns true for jpeg files', () => {
    expect(isImageEmbed('photo.jpeg')).toBe(true)
  })

  it('returns true for gif files', () => {
    expect(isImageEmbed('animation.gif')).toBe(true)
  })

  it('returns true for webp files', () => {
    expect(isImageEmbed('image.webp')).toBe(true)
  })

  it('returns false for pdf files', () => {
    expect(isImageEmbed('document.pdf')).toBe(false)
  })

  it('returns false for markdown files', () => {
    expect(isImageEmbed('note.md')).toBe(false)
  })

  it('is case insensitive', () => {
    expect(isImageEmbed('photo.PNG')).toBe(true)
    expect(isImageEmbed('photo.JPG')).toBe(true)
  })
})

