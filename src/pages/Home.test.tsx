import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from './Home'

const mockLogout = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../components/ConnectDropboxButton', () => ({
  default: () => <button>Connect Dropbox</button>,
}))

vi.mock('../components/AccountInfo', () => ({
  default: () => <div data-testid="account-info">Account Info</div>,
}))

vi.mock('../lib/dropbox-client', () => ({
  getCurrentAccount: vi.fn(),
  uploadFile: vi.fn(),
}))

vi.mock('../components/VaultSelector', () => ({
  default: ({ onVaultSelected }: { onVaultSelected: (path: string) => void }) => (
    <button onClick={() => onVaultSelected('/test-vault')}>Select Vault</button>
  ),
}))

vi.mock('../components/FileList', () => ({
  default: ({ onFileSelect }: { onFileSelect: (path: string) => void }) => (
    <button onClick={() => onFileSelect('/test-vault/note.md')}>Select File</button>
  ),
}))

vi.mock('../components/InboxNotesList', () => ({
  default: ({ vaultPath, inboxPath }: { vaultPath: string; inboxPath: string }) => (
    <div data-testid="inbox-notes-list">
      Inbox Notes List
      <button onClick={() => {
        const event = new CustomEvent('inboxFileSelect', { 
          detail: `${vaultPath}/${inboxPath}/note.md` 
        })
        window.dispatchEvent(event)
      }}>Select File</button>
    </div>
  ),
}))

vi.mock('../components/NotePreview', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="note-preview">
      Note Preview
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

import { useAuth } from '../context/AuthContext'
import { getCurrentAccount } from '../lib/dropbox-client'

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state when auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: null,
      accountId: null,
      isAuthenticated: false,
      isLoading: true,
      setTokens: vi.fn(),
      logout: mockLogout,
    })

    render(<Home />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows connect button when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: null,
      accountId: null,
      isAuthenticated: false,
      isLoading: false,
      setTokens: vi.fn(),
      logout: mockLogout,
    })

    render(<Home />)

    expect(screen.getByText('Hello DropSidian')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connect dropbox/i })).toBeInTheDocument()
  })

  it('shows authenticated view with Header and vault selector', async () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: 'test-token',
      accountId: 'account-id',
      isAuthenticated: true,
      isLoading: false,
      setTokens: vi.fn(),
      logout: mockLogout,
    })
    vi.mocked(getCurrentAccount).mockResolvedValue({
      account_id: 'test-account-id',
      email: 'test@example.com',
      name: {
        display_name: 'Test User',
        given_name: 'Test',
        surname: 'User',
      },
    })

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /select vault/i })).toBeInTheDocument()
  })

  it('calls logout when disconnect button is clicked in user menu', async () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: 'test-token',
      accountId: 'account-id',
      isAuthenticated: true,
      isLoading: false,
      setTokens: vi.fn(),
      logout: mockLogout,
    })
    vi.mocked(getCurrentAccount).mockResolvedValue({
      account_id: 'test-account-id',
      email: 'test@example.com',
      name: {
        display_name: 'Test User',
        given_name: 'Test',
        surname: 'User',
      },
    })
    const user = userEvent.setup()

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /user menu/i }))
    await user.click(screen.getByRole('button', { name: /disconnect/i }))

    expect(mockLogout).toHaveBeenCalled()
  })

  it('shows inbox notes list after vault is selected', async () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: 'test-token',
      accountId: 'account-id',
      isAuthenticated: true,
      isLoading: false,
      setTokens: vi.fn(),
      logout: mockLogout,
    })
    const user = userEvent.setup()

    render(<Home />)

    await user.click(screen.getByRole('button', { name: /select vault/i }))

    await waitFor(() => {
      expect(screen.getByTestId('inbox-notes-list')).toBeInTheDocument()
    })
  })

  it('handles account fetch error gracefully', async () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: 'test-token',
      accountId: 'account-id',
      isAuthenticated: true,
      isLoading: false,
      setTokens: vi.fn(),
      logout: mockLogout,
    })
    vi.mocked(getCurrentAccount).mockRejectedValue(new Error('Network error'))

    render(<Home />)

    await waitFor(() => {
      expect(getCurrentAccount).toHaveBeenCalledWith('test-token')
    })
    expect(screen.getByRole('button', { name: /select vault/i })).toBeInTheDocument()
  })
})

