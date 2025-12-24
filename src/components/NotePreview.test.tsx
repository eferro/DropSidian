import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotePreview from './NotePreview'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/dropbox-client', () => ({
  downloadFileWithMetadata: vi.fn(),
  updateFile: vi.fn(),
}))

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}))

vi.mock('remark-gfm', () => ({
  default: {},
}))

import { useAuth } from '../context/AuthContext'
import { downloadFileWithMetadata, updateFile } from '../lib/dropbox-client'

function mockFileResponse(content: string, rev = 'rev-123') {
  return { content, rev, name: 'note.md', path_display: '/vault/note.md' }
}

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
    vi.mocked(downloadFileWithMetadata).mockReturnValue(new Promise(() => {}))

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    expect(screen.getByText('Loading note...')).toBeInTheDocument()
  })

  it('shows note content on success', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(
      mockFileResponse('# Hello World\n\nThis is content.')
    )

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })
    expect(screen.getByTestId('markdown')).toHaveTextContent('# Hello World')
  })

  it('removes .md extension from title', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('content'))

    render(<NotePreview filePath="/vault/my-note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('my-note')).toBeInTheDocument()
    })
  })

  it('shows error on failure', async () => {
    vi.mocked(downloadFileWithMetadata).mockRejectedValue(new Error('Download failed'))

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('Error: Download failed')).toBeInTheDocument()
    })
  })

  it('calls onClose when clicking close button', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('content'))
    const user = userEvent.setup()

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows close button on error state', async () => {
    vi.mocked(downloadFileWithMetadata).mockRejectedValue(new Error('Error'))
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
    expect(downloadFileWithMetadata).not.toHaveBeenCalled()
  })

  it('shows edit button and switches to edit mode', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Content'))
    const user = userEvent.setup()

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))

    expect(screen.getByRole('textbox')).toHaveValue('# Content')
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('saves changes and returns to view mode', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Old', 'rev-1'))
    vi.mocked(updateFile).mockResolvedValue({
      name: 'note.md',
      path_display: '/vault/note.md',
      rev: 'rev-2',
    })
    const user = userEvent.setup()

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), '# New')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
    expect(updateFile).toHaveBeenCalledWith('test-token', '/vault/note.md', '# New', 'rev-1')
  })

  it('shows conflict error when save fails with 409', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('content', 'rev-1'))
    vi.mocked(updateFile).mockRejectedValue(new Error('Conflict: file was modified'))
    const user = userEvent.setup()

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/Conflict/)).toBeInTheDocument()
    })
  })
})

