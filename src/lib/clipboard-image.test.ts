import { describe, it, expect } from 'vitest'
import { extractImageFromClipboard, generatePastedImageName } from './clipboard-image'

describe('generatePastedImageName', () => {
  it('generates a unique filename with timestamp', () => {
    const mockDate = new Date('2024-03-15T14:30:45.123Z')
    const result = generatePastedImageName(mockDate)

    expect(result).toBe('Pasted image 20240315143045.png')
  })
})

describe('extractImageFromClipboard', () => {
  it('returns null when no items in clipboard', () => {
    const clipboardData = {
      items: [] as DataTransferItemList,
    } as unknown as DataTransfer

    const result = extractImageFromClipboard(clipboardData)

    expect(result).toBeNull()
  })

  it('returns the image file when clipboard contains an image', () => {
    const mockFile = new File(['image data'], 'test.png', { type: 'image/png' })
    const mockItem = {
      kind: 'file',
      type: 'image/png',
      getAsFile: () => mockFile,
    }
    const clipboardData = {
      items: [mockItem],
    } as unknown as DataTransfer

    const result = extractImageFromClipboard(clipboardData)

    expect(result).toBe(mockFile)
  })

  it('returns null when clipboard contains only text', () => {
    const mockItem = {
      kind: 'string',
      type: 'text/plain',
      getAsFile: () => null,
    }
    const clipboardData = {
      items: [mockItem],
    } as unknown as DataTransfer

    const result = extractImageFromClipboard(clipboardData)

    expect(result).toBeNull()
  })
})

