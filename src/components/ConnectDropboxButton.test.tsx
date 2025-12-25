import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConnectDropboxButton from './ConnectDropboxButton'

vi.mock('../lib/dropbox-auth', () => ({
  buildAuthUrl: vi.fn(),
}))

import { buildAuthUrl } from '../lib/dropbox-auth'

describe('ConnectDropboxButton', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('renders connect button', () => {
    render(<ConnectDropboxButton />)

    expect(screen.getByRole('button', { name: /connect dropbox/i })).toBeInTheDocument()
  })

  it('redirects to auth URL when clicked', async () => {
    vi.mocked(buildAuthUrl).mockResolvedValue('https://dropbox.com/oauth2/authorize?...')
    const user = userEvent.setup()

    render(<ConnectDropboxButton />)

    await user.click(screen.getByRole('button', { name: /connect dropbox/i }))

    expect(buildAuthUrl).toHaveBeenCalled()
    expect(window.location.href).toBe('https://dropbox.com/oauth2/authorize?...')
  })
})


