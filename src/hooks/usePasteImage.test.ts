import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePasteImage } from './usePasteImage'

vi.mock('../lib/dropbox-client', () => ({
  uploadBinaryFile: vi.fn(),
}))

import { uploadBinaryFile, UploadFileResponse } from '../lib/dropbox-client'

describe('usePasteImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when paste event has no image', async () => {
    const onImagePasted = vi.fn()
    const { result } = renderHook(() =>
      usePasteImage({
        accessToken: 'token',
        currentNotePath: '/vault/note.md',
        onImagePasted,
      })
    )

    const pasteEvent = {
      clipboardData: {
        items: [],
      },
      preventDefault: vi.fn(),
    } as unknown as React.ClipboardEvent

    await act(async () => {
      result.current.handlePaste(pasteEvent)
    })

    expect(uploadBinaryFile).not.toHaveBeenCalled()
    expect(onImagePasted).not.toHaveBeenCalled()
    expect(pasteEvent.preventDefault).not.toHaveBeenCalled()
  })

  it('uploads image and calls callback when paste contains image', async () => {
    vi.mocked(uploadBinaryFile).mockResolvedValue({
      name: 'Pasted image 20240315143045.png',
      path_lower: '/vault/pasted image 20240315143045.png',
      path_display: '/vault/Pasted image 20240315143045.png',
      id: 'id:123',
    })

    const onImagePasted = vi.fn()
    const { result } = renderHook(() =>
      usePasteImage({
        accessToken: 'token',
        currentNotePath: '/vault/note.md',
        onImagePasted,
      })
    )

    const mockFile = new File(['image data'], 'test.png', { type: 'image/png' })
    const mockItem = {
      kind: 'file',
      type: 'image/png',
      getAsFile: () => mockFile,
    }
    const pasteEvent = {
      clipboardData: {
        items: [mockItem],
      },
      preventDefault: vi.fn(),
    } as unknown as React.ClipboardEvent

    await act(async () => {
      await result.current.handlePaste(pasteEvent)
    })

    expect(pasteEvent.preventDefault).toHaveBeenCalled()
    expect(uploadBinaryFile).toHaveBeenCalledWith(
      'token',
      expect.stringMatching(/^\/vault\/Pasted image \d{14}\.png$/),
      mockFile
    )
    expect(onImagePasted).toHaveBeenCalledWith(
      expect.stringMatching(/^Pasted image \d{14}\.png$/)
    )
  })

  it('sets uploading state during upload', async () => {
    let resolveUpload: (value: UploadFileResponse) => void = () => {}
    vi.mocked(uploadBinaryFile).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve
        })
    )

    const onImagePasted = vi.fn()
    const { result } = renderHook(() =>
      usePasteImage({
        accessToken: 'token',
        currentNotePath: '/vault/note.md',
        onImagePasted,
      })
    )

    const mockFile = new File(['image data'], 'test.png', { type: 'image/png' })
    const mockItem = {
      kind: 'file',
      type: 'image/png',
      getAsFile: () => mockFile,
    }
    const pasteEvent = {
      clipboardData: {
        items: [mockItem],
      },
      preventDefault: vi.fn(),
    } as unknown as React.ClipboardEvent

    expect(result.current.uploading).toBe(false)

    let pastePromise: Promise<void>
    act(() => {
      pastePromise = result.current.handlePaste(pasteEvent)
    })

    expect(result.current.uploading).toBe(true)

    await act(async () => {
      resolveUpload({
        name: 'test.png',
        path_lower: '/vault/test.png',
        path_display: '/vault/test.png',
        id: 'id:123',
      })
      await pastePromise
    })

    expect(result.current.uploading).toBe(false)
  })
})

