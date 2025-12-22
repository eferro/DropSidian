import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  storeOAuthState,
  getStoredOAuthState,
  clearOAuthState,
  buildAuthUrl,
  validateOAuthState,
  revokeToken,
} from './dropbox-auth'

describe('OAuth state management', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('stores and retrieves OAuth state', () => {
    const state = 'test-state-123'

    storeOAuthState(state)
    const retrieved = getStoredOAuthState()

    expect(retrieved).toBe(state)
  })

  it('clears OAuth state', () => {
    storeOAuthState('state-to-clear')

    clearOAuthState()
    const retrieved = getStoredOAuthState()

    expect(retrieved).toBeNull()
  })
})

describe('buildAuthUrl', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('includes state parameter in URL and stores it', async () => {
    const url = await buildAuthUrl()
    const parsedUrl = new URL(url)
    const stateInUrl = parsedUrl.searchParams.get('state')
    const storedState = getStoredOAuthState()

    expect(stateInUrl).not.toBeNull()
    expect(stateInUrl).toHaveLength(32)
    expect(storedState).toBe(stateInUrl)
  })
})

describe('validateOAuthState', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('returns true when state matches stored state', () => {
    const state = 'valid-state-123'
    storeOAuthState(state)

    const result = validateOAuthState(state)

    expect(result).toBe(true)
  })

  it('returns false when state does not match', () => {
    storeOAuthState('stored-state')

    const result = validateOAuthState('different-state')

    expect(result).toBe(false)
  })

  it('returns false when no stored state exists', () => {
    const result = validateOAuthState('some-state')

    expect(result).toBe(false)
  })

  it('clears stored state after validation', () => {
    storeOAuthState('state-to-validate')

    validateOAuthState('state-to-validate')
    const storedAfter = getStoredOAuthState()

    expect(storedAfter).toBeNull()
  })
})

describe('revokeToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls Dropbox token revoke endpoint', async () => {
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 })
    )
    const accessToken = 'test-access-token'

    await revokeToken(accessToken)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.dropboxapi.com/2/auth/token/revoke',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    )
  })
})

