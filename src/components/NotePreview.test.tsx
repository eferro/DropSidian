import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotePreview from './NotePreview'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/dropbox-client', () => ({
  downloadFileWithMetadata: vi.fn(),
  updateFile: vi.fn(),
  uploadBinaryFile: vi.fn(),
  deleteFile: vi.fn(),
}))

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}))

vi.mock('remark-gfm', () => ({
  default: {},
}))

vi.mock('./MarkdownWithWikilinks', () => ({
  default: ({
    content,
    onNavigate,
  }: {
    content: string
    onNavigate: (path: string) => void
  }) => (
    <div data-testid="markdown-wikilinks" onClick={() => onNavigate('/vault/Target.md')}>
      {content}
    </div>
  ),
}))

vi.mock('./AttachmentUploader', () => ({
  default: ({
    onUploadComplete,
  }: {
    onUploadComplete: (filename: string) => void
  }) => (
    <button
      data-testid="attachment-uploader"
      onClick={() => onUploadComplete('photo.png')}
    >
      Upload
    </button>
  ),
}))

import { useAuth } from '../context/AuthContext'
import { downloadFileWithMetadata, updateFile, uploadBinaryFile, deleteFile } from '../lib/dropbox-client'

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

  it('calls onNavigateNote when wikilink is clicked', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(
      mockFileResponse('See [[Target]] here.')
    )
    const onNavigateNote = vi.fn()
    const user = userEvent.setup()

    render(
      <NotePreview
        filePath="/vault/note.md"
        onClose={mockOnClose}
        noteIndex={new Map([['Target', '/vault/Target.md']])}
        onNavigateNote={onNavigateNote}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('markdown-wikilinks')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('markdown-wikilinks'))

    expect(onNavigateNote).toHaveBeenCalledWith('/vault/Target.md')
  })

  it('shows attachment uploader in edit mode', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Test'))
    const user = userEvent.setup()

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))

    expect(screen.getByTestId('attachment-uploader')).toBeInTheDocument()
  })

  it('inserts embed syntax when attachment is uploaded', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Test'))
    vi.mocked(updateFile).mockResolvedValue({ name: 'note.md', path_display: '/vault/note.md', rev: 'rev-2' })
    const user = userEvent.setup()

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.click(screen.getByTestId('attachment-uploader'))

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toContain('![[photo.png]]')
  })

  it('uploads pasted image and inserts embed syntax', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Test'))
    vi.mocked(uploadBinaryFile).mockResolvedValue({
      name: 'Pasted image 20240315143045.png',
      path_lower: '/vault/pasted image 20240315143045.png',
      path_display: '/vault/Pasted image 20240315143045.png',
      id: 'id:123',
    })
    const user = userEvent.setup()

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))

    const textarea = screen.getByRole('textbox')
    const mockFile = new File(['image data'], 'screenshot.png', { type: 'image/png' })
    const mockItem = {
      kind: 'file',
      type: 'image/png',
      getAsFile: () => mockFile,
    }

    fireEvent.paste(textarea, {
      clipboardData: {
        items: [mockItem],
      },
    })

    await waitFor(() => {
      expect(uploadBinaryFile).toHaveBeenCalledWith(
        'test-token',
        expect.stringMatching(/^\/vault\/Pasted image \d{14}\.png$/),
        mockFile
      )
    })

    await waitFor(() => {
      const ta = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(ta.value).toMatch(/!\[\[Pasted image \d{14}\.png\]\]/)
    })
  })

  it('renders with modal backdrop', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Test'))

    const { container } = render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })

    const backdrop = container.querySelector('[class*="modalBackdrop"]')
    expect(backdrop).toBeInTheDocument()
  })

  it('closes modal when clicking backdrop', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Test'))
    const user = userEvent.setup()

    const { container } = render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })

    const backdrop = container.querySelector('[class*="modalBackdrop"]')
    if (backdrop) {
      await user.click(backdrop)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })

  it('shows delete button in view mode', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Content'))

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })
  })

  it('shows confirmation dialog when delete button is clicked', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Content'))
    const user = userEvent.setup()
    const mockConfirm = vi.spyOn(window, 'confirm')
    mockConfirm.mockReturnValue(true)

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this note? This action cannot be undone.')

    mockConfirm.mockRestore()
  })

  it('calls deleteFile and closes modal when deletion is confirmed', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Content'))
    vi.mocked(deleteFile).mockResolvedValue()
    const user = userEvent.setup()
    const mockConfirm = vi.spyOn(window, 'confirm')
    mockConfirm.mockReturnValue(true)

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(deleteFile).toHaveBeenCalledWith('test-token', '/vault/note.md')
    })
    expect(mockOnClose).toHaveBeenCalled()

    mockConfirm.mockRestore()
  })

  it('does not call deleteFile when deletion is cancelled', async () => {
    vi.mocked(downloadFileWithMetadata).mockResolvedValue(mockFileResponse('# Content'))
    const user = userEvent.setup()
    const mockConfirm = vi.spyOn(window, 'confirm')
    mockConfirm.mockReturnValue(false)

    render(<NotePreview filePath="/vault/note.md" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(deleteFile).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()

    mockConfirm.mockRestore()
  })
})

