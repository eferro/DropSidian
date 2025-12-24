import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ImageEmbed from './ImageEmbed'

vi.mock('../lib/dropbox-client', () => ({
  getTemporaryLink: vi.fn(),
}))

import { getTemporaryLink } from '../lib/dropbox-client'

describe('ImageEmbed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(getTemporaryLink).mockReturnValue(new Promise(() => {}))

    render(
      <ImageEmbed
        target="photo.png"
        filePath="/vault/photo.png"
        accessToken="token"
      />
    )

    expect(screen.getByText('Loading image...')).toBeInTheDocument()
  })

  it('renders image when loaded', async () => {
    vi.mocked(getTemporaryLink).mockResolvedValue('https://example.com/image.png')

    render(
      <ImageEmbed
        target="photo.png"
        filePath="/vault/photo.png"
        accessToken="token"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        'https://example.com/image.png'
      )
    })
  })

  it('shows error message when image fails to load', async () => {
    vi.mocked(getTemporaryLink).mockRejectedValue(new Error('Failed'))

    render(
      <ImageEmbed
        target="photo.png"
        filePath="/vault/photo.png"
        accessToken="token"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('[Image not found]')).toBeInTheDocument()
    })
  })
})

