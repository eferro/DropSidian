import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotePreview from './NotePreview'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/dropbox-client', () => ({
  downloadFile: vi.fn(),
}))

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}))

vi.mock('remark-gfm', () => ({
  default: {},
}))

import { useAuth } from '../context/AuthContext'
import { downloadFile } from '../lib/dropbox-client'

describe('NotePreview', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      accessToken: 'test-token',
      accountId: null,
      isAuthenticated: true,
      isLoading: false,
      setTokens: vi.fn(),
      logout: vi.fn(),
    })
  })

  it('shows loading state initially', () => {
    vi.mocked(downloadFile).mockReturnValue(new Promise(() => {}))

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    expect(screen.getByText('Loading note...')).toBeInTheDocument()
  })

  it('shows note content on success', async () => {
    vi.mocked(downloadFile).mockResolvedValue('# Hello World\n\nThis is content.')

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })
    expect(screen.getByTestId('markdown')).toHaveTextContent('# Hello World')
  })

  it('removes .md extension from title', async () => {
    vi.mocked(downloadFile).mockResolvedValue('content')

    render(<NotePreview filePath="/vault/my-note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('my-note')).toBeInTheDocument()
    })
  })

  it('shows error on failure', async () => {
    vi.mocked(downloadFile).mockRejectedValue(new Error('Download failed'))

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('Error: Download failed')).toBeInTheDocument()
    })
  })

  it('calls onClose when clicking close button', async () => {
    vi.mocked(downloadFile).mockResolvedValue('content')
    const user = userEvent.setup()

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows close button on error state', async () => {
    vi.mocked(downloadFile).mockRejectedValue(new Error('Error'))
    const user = userEvent.setup()

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('does not load when no access token', async () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: null,
      accountId: null,
      isAuthenticated: false,
      isLoading: false,
      setTokens: vi.fn(),
      logout: vi.fn(),
    })

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
    })
    expect(downloadFile).not.toHaveBeenCalled()
  })
})

