import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileList from './FileList'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/dropbox-client', () => ({
  listAllFiles: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'
import { listAllFiles } from '../lib/dropbox-client'

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
    vi.mocked(listAllFiles).mockReturnValue(new Promise(() => {}))

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    expect(screen.getByText('Loading files...')).toBeInTheDocument()
  })

  it('shows markdown files on success', async () => {
    vi.mocked(listAllFiles).mockResolvedValue([
      { '.tag': 'file', name: 'note.md', path_lower: '/note.md', path_display: '/note.md', id: 'id:1' },
      { '.tag': 'file', name: 'another.md', path_lower: '/another.md', path_display: '/another.md', id: 'id:2' },
    ])

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })
    expect(screen.getByText('another')).toBeInTheDocument()
    expect(screen.getByText('2 notes')).toBeInTheDocument()
  })

  it('filters to show only markdown files', async () => {
    vi.mocked(listAllFiles).mockResolvedValue([
      { '.tag': 'file', name: 'note.md', path_lower: '/note.md', path_display: '/note.md', id: 'id:1' },
      { '.tag': 'file', name: 'image.png', path_lower: '/image.png', path_display: '/image.png', id: 'id:2' },
      { '.tag': 'folder', name: 'subfolder', path_lower: '/subfolder', path_display: '/subfolder', id: 'id:3' },
    ])

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })
    expect(screen.queryByText('image')).not.toBeInTheDocument()
    expect(screen.queryByText('subfolder')).not.toBeInTheDocument()
    expect(screen.getByText('1 notes')).toBeInTheDocument()
  })

  it('shows empty state when no markdown files', async () => {
    vi.mocked(listAllFiles).mockResolvedValue([
      { '.tag': 'folder', name: 'subfolder', path_lower: '/subfolder', path_display: '/subfolder', id: 'id:1' },
    ])

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('No markdown files found in vault.')).toBeInTheDocument()
    })
  })

  it('calls onFileSelect when clicking file', async () => {
    vi.mocked(listAllFiles).mockResolvedValue([
      { '.tag': 'file', name: 'note.md', path_lower: '/note.md', path_display: '/Vault/note.md', id: 'id:1' },
    ])
    const user = userEvent.setup()

    render(<FileList vaultPath="/vault" onFileSelect={mockOnFileSelect} />)

    await waitFor(() => {
      expect(screen.getByText('note')).toBeInTheDocument()
    })

    await user.click(screen.getByText('note'))

    expect(mockOnFileSelect).toHaveBeenCalledWith('/Vault/note.md')
  })

  it('shows error on failure', async () => {
    vi.mocked(listAllFiles).mockRejectedValue(new Error('API Error'))

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
    expect(listAllFiles).not.toHaveBeenCalled()
  })
})

