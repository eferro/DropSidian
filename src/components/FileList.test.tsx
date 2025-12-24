import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileList from './FileList'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/dropbox-client', () => ({
  listFolder: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'
import { listFolder, ListFolderResponse, DropboxEntry } from '../lib/dropbox-client'

function mockListFolderResponse(entries: DropboxEntry[]): ListFolderResponse {
  return {
    entries,
    cursor: 'cursor',
    has_more: false,
  }
}

describe('FileList', () => {
  const mockOnFileSelect = vi.fn()

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
    vi.mocked(listFolder).mockReturnValue(new Promise(() => {}))

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    expect(screen.getByText('Loading files...')).toBeInTheDocument()
  })

  it('shows markdown files on success', async () => {
    vi.mocked(listFolder).mockResolvedValue(
      mockListFolderResponse([
        { '.tag': 'file', name: 'note.md', path_lower: '/note.md', path_display: '/note.md', id: 'id:1' },
        { '.tag': 'file', name: 'another.md', path_lower: '/another.md', path_display: '/another.md', id: 'id:2' },
      ])
    )

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })
    expect(screen.getByText('another')).toBeInTheDocument()
    expect(screen.getByText('2 notes')).toBeInTheDocument()
  })

  it('filters non-markdown files but shows folders', async () => {
    vi.mocked(listFolder).mockResolvedValue(
      mockListFolderResponse([
        { '.tag': 'file', name: 'note.md', path_lower: '/note.md', path_display: '/note.md', id: 'id:1' },
        { '.tag': 'file', name: 'image.png', path_lower: '/image.png', path_display: '/image.png', id: 'id:2' },
        { '.tag': 'folder', name: 'subfolder', path_lower: '/subfolder', path_display: '/subfolder', id: 'id:3' },
      ])
    )

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })
    expect(screen.queryByText('image')).not.toBeInTheDocument()
    expect(screen.getByText('subfolder')).toBeInTheDocument()
    expect(screen.getByText(/1 notes/)).toBeInTheDocument()
  })

  it('shows empty state when no markdown files and no folders', async () => {
    vi.mocked(listFolder).mockResolvedValue(
      mockListFolderResponse([
        { '.tag': 'file', name: 'image.png', path_lower: '/image.png', path_display: '/image.png', id: 'id:1' },
      ])
    )

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('No markdown files found in vault.')).toBeInTheDocument()
    })
  })

  it('calls onFileSelect when clicking file', async () => {
    vi.mocked(listFolder).mockResolvedValue(
      mockListFolderResponse([
        { '.tag': 'file', name: 'note.md', path_lower: '/note.md', path_display: '/Vault/note.md', id: 'id:1' },
      ])
    )
    const user = userEvent.setup()

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })

    await user.click(screen.getByText('note'))

    expect(mockOnFileSelect).toHaveBeenCalledWith('/Vault/note.md')
  })

  it('shows error on failure', async () => {
    vi.mocked(listFolder).mockRejectedValue(new Error('API Error'))

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Error: API Error')).toBeInTheDocument()
    })
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

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.queryByText('Loading files...')).not.toBeInTheDocument()
    })
    expect(listFolder).not.toHaveBeenCalled()
  })

  it('shows folders alongside markdown files at current directory level', async () => {
    vi.mocked(listFolder).mockResolvedValue(
      mockListFolderResponse([
        { '.tag': 'folder', name: 'Projects', path_lower: '/vault/projects', path_display: '/Vault/Projects', id: 'id:1' },
        { '.tag': 'file', name: 'note.md', path_lower: '/vault/note.md', path_display: '/Vault/note.md', id: 'id:2' },
      ])
    )

    render(<FileList vaultPath="/Vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument()
    })
    expect(screen.getByText('note')).toBeInTheDocument()
  })

  it('navigates into folder on click', async () => {
    vi.mocked(listFolder)
      .mockResolvedValueOnce(
        mockListFolderResponse([
          { '.tag': 'folder', name: 'Projects', path_lower: '/vault/projects', path_display: '/Vault/Projects', id: 'id:1' },
        ])
      )
      .mockResolvedValueOnce(
        mockListFolderResponse([
          { '.tag': 'file', name: 'project-note.md', path_lower: '/vault/projects/project-note.md', path_display: '/Vault/Projects/project-note.md', id: 'id:2' },
        ])
      )
    const user = userEvent.setup()

    render(<FileList vaultPath="/Vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Projects'))

    await waitFor(() => {
      expect(screen.getByText('project-note')).toBeInTheDocument()
    })
    expect(listFolder).toHaveBeenCalledWith('test-token', '/Vault/Projects')
  })

  it('shows back button when navigated into a subdirectory', async () => {
    vi.mocked(listFolder)
      .mockResolvedValueOnce(
        mockListFolderResponse([
          { '.tag': 'folder', name: 'Projects', path_lower: '/vault/projects', path_display: '/Vault/Projects', id: 'id:1' },
        ])
      )
      .mockResolvedValueOnce(
        mockListFolderResponse([
          { '.tag': 'file', name: 'note.md', path_lower: '/vault/projects/note.md', path_display: '/Vault/Projects/note.md', id: 'id:2' },
        ])
      )
    const user = userEvent.setup()

    render(<FileList vaultPath="/Vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument()
    })

    expect(screen.queryByText('← Back')).not.toBeInTheDocument()

    await user.click(screen.getByText('Projects'))

    await waitFor(() => {
      expect(screen.getByText('← Back')).toBeInTheDocument()
    })
  })

  it('navigates back to parent folder when clicking back button', async () => {
    vi.mocked(listFolder)
      .mockResolvedValueOnce(
        mockListFolderResponse([
          { '.tag': 'folder', name: 'Projects', path_lower: '/vault/projects', path_display: '/Vault/Projects', id: 'id:1' },
        ])
      )
      .mockResolvedValueOnce(
        mockListFolderResponse([
          { '.tag': 'file', name: 'note.md', path_lower: '/vault/projects/note.md', path_display: '/Vault/Projects/note.md', id: 'id:2' },
        ])
      )
      .mockResolvedValueOnce(
        mockListFolderResponse([
          { '.tag': 'folder', name: 'Projects', path_lower: '/vault/projects', path_display: '/Vault/Projects', id: 'id:1' },
        ])
      )
    const user = userEvent.setup()

    render(<FileList vaultPath="/Vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Projects'))

    await waitFor(() => {
      expect(screen.getByText('← Back')).toBeInTheDocument()
    })

    await user.click(screen.getByText('← Back'))

    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument()
    })
    expect(screen.queryByText('← Back')).not.toBeInTheDocument()
  })

  it('calls onFilesLoaded with markdown file paths when files are loaded', async () => {
    const onFilesLoaded = vi.fn()
    vi.mocked(listFolder).mockResolvedValue(
      mockListFolderResponse([
        { '.tag': 'file', name: 'note.md', path_lower: '/note.md', path_display: '/Vault/note.md', id: 'id:1' },
        { '.tag': 'file', name: 'another.md', path_lower: '/another.md', path_display: '/Vault/another.md', id: 'id:2' },
        { '.tag': 'folder', name: 'subfolder', path_lower: '/subfolder', path_display: '/Vault/subfolder', id: 'id:3' },
      ])
    )

    render(
      <FileList
        vaultPath="/Vault"
        onFileSelect={mockOnFileSelect}
        onFilesLoaded={onFilesLoaded}
      />
    )

    await waitFor(() => {
      expect(onFilesLoaded).toHaveBeenCalledWith(['/Vault/note.md', '/Vault/another.md'])
    })
  })
})
