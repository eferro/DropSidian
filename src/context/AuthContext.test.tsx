import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../lib/token-storage', () => ({
  storeRefreshToken: vi.fn(),
  getRefreshToken: vi.fn(),
  clearRefreshToken: vi.fn(),
}))

vi.mock('../lib/dropbox-auth', () => ({
  refreshAccessToken: vi.fn(),
  revokeToken: vi.fn(),
}))

import { getRefreshToken, clearRefreshToken, storeRefreshToken } from '../lib/token-storage'
import { refreshAccessToken, revokeToken } from '../lib/dropbox-auth'

function TestConsumer() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="loading">{auth.isLoading.toString()}</span>
      <span data-testid="authenticated">{auth.isAuthenticated.toString()}</span>
      <span data-testid="token">{auth.accessToken ?? 'null'}</span>
      <button onClick={() => auth.setTokens('new-token', 'refresh', 'account-1')}>
        Set Tokens
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with loading state', async () => {
    vi.mocked(getRefreshToken).mockResolvedValue(null)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading').textContent).toBe('true')

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
  })

  it('sets authenticated to false when no refresh token exists', async () => {
    vi.mocked(getRefreshToken).mockResolvedValue(null)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false')
    })
  })

  it('refreshes token on mount when refresh token exists', async () => {
    vi.mocked(getRefreshToken).mockResolvedValue('stored-refresh-token')
    vi.mocked(refreshAccessToken).mockResolvedValue({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 14400,
      token_type: 'bearer',
      account_id: 'dbid:test-123',
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
      expect(screen.getByTestId('token').textContent).toBe('new-access-token')
    })
  })

  it('clears tokens when refresh fails', async () => {
    vi.mocked(getRefreshToken).mockResolvedValue('expired-token')
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error('Token expired'))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false')
    })
    expect(clearRefreshToken).toHaveBeenCalled()
  })

  it('setTokens updates auth state and stores refresh token', async () => {
    vi.mocked(getRefreshToken).mockResolvedValue(null)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    await act(async () => {
      screen.getByText('Set Tokens').click()
    })

    expect(screen.getByTestId('authenticated').textContent).toBe('true')
    expect(screen.getByTestId('token').textContent).toBe('new-token')
    expect(storeRefreshToken).toHaveBeenCalledWith('refresh')
  })

  it('logout clears tokens and revokes access token', async () => {
    vi.mocked(getRefreshToken).mockResolvedValue('stored-token')
    vi.mocked(refreshAccessToken).mockResolvedValue({
      access_token: 'access-token-to-revoke',
      refresh_token: 'refresh',
      expires_in: 14400,
      token_type: 'bearer',
      account_id: 'dbid:test',
    })
    vi.mocked(revokeToken).mockResolvedValue(undefined)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
    })

    await act(async () => {
      screen.getByText('Logout').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false')
    })
    expect(revokeToken).toHaveBeenCalledWith('access-token-to-revoke')
    expect(clearRefreshToken).toHaveBeenCalled()
  })
})

describe('useAuth', () => {
  it('throws error when used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleError.mockRestore()
  })
})

