import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Callback from './Callback'

const mockNavigate = vi.fn()
const mockSetTokens = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    setTokens: mockSetTokens,
  }),
}))

vi.mock('../lib/dropbox-auth', () => ({
  validateOAuthState: vi.fn(),
  getStoredCodeVerifier: vi.fn(),
  exchangeCodeForTokens: vi.fn(),
}))

import { validateOAuthState, getStoredCodeVerifier, exchangeCodeForTokens } from '../lib/dropbox-auth'

function renderWithRouter(searchParams: string) {
  return render(
    <MemoryRouter initialEntries={[`/callback${searchParams}`]}>
      <Callback />
    </MemoryRouter>
  )
}

describe('Callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error when no authorization code is received', async () => {
    renderWithRouter('')

    await waitFor(() => {
      expect(screen.getByText('No authorization code received')).toBeInTheDocument()
    })
  })

  it('shows error when OAuth returns error', async () => {
    renderWithRouter('?error=access_denied&error_description=User+denied+access')

    await waitFor(() => {
      expect(screen.getByText(/OAuth error: access_denied/)).toBeInTheDocument()
    })
  })

  it('shows error when state is invalid (CSRF protection)', async () => {
    vi.mocked(validateOAuthState).mockReturnValue(false)

    renderWithRouter('?code=auth-code&state=invalid-state')

    await waitFor(() => {
      expect(screen.getByText(/Invalid state parameter/)).toBeInTheDocument()
    })
  })

  it('exchanges code for tokens on valid callback', async () => {
    vi.mocked(validateOAuthState).mockReturnValue(true)
    vi.mocked(getStoredCodeVerifier).mockReturnValue('verifier')
    vi.mocked(exchangeCodeForTokens).mockResolvedValue({
      access_token: 'access-123',
      refresh_token: 'refresh-123',
      expires_in: 14400,
      token_type: 'bearer',
      account_id: 'dbid:account-123',
    })

    renderWithRouter('?code=auth-code&state=valid-state')

    await waitFor(() => {
      expect(exchangeCodeForTokens).toHaveBeenCalledWith('auth-code')
    })

    await waitFor(() => {
      expect(mockSetTokens).toHaveBeenCalledWith('access-123', 'refresh-123', 'dbid:account-123')
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('shows error when token exchange fails', async () => {
    vi.mocked(validateOAuthState).mockReturnValue(true)
    vi.mocked(getStoredCodeVerifier).mockReturnValue('verifier')
    vi.mocked(exchangeCodeForTokens).mockRejectedValue(new Error('Token exchange failed'))

    renderWithRouter('?code=auth-code&state=valid-state')

    await waitFor(() => {
      expect(screen.getByText('Token exchange failed')).toBeInTheDocument()
    })
  })

  it('shows processing state while exchanging tokens', () => {
    vi.mocked(validateOAuthState).mockReturnValue(true)
    vi.mocked(getStoredCodeVerifier).mockReturnValue('verifier')
    vi.mocked(exchangeCodeForTokens).mockReturnValue(new Promise(() => {}))

    renderWithRouter('?code=auth-code&state=valid-state')

    expect(screen.getByText('Processing authentication...')).toBeInTheDocument()
  })
})

