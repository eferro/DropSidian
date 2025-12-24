import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  storeRefreshToken,
  getRefreshToken,
  clearRefreshToken,
} from './token-storage'

describe('token-storage', () => {
  beforeEach(async () => {
    await clearRefreshToken().catch(() => {})
  })

  it('stores and retrieves refresh token', async () => {
    const token = 'test-refresh-token-123'

    await storeRefreshToken(token)
    const retrieved = await getRefreshToken()

    expect(retrieved).toBe(token)
  })

  it('returns null when no token is stored', async () => {
    const retrieved = await getRefreshToken()

    expect(retrieved).toBeNull()
  })

  it('clears stored refresh token', async () => {
    await storeRefreshToken('token-to-clear')

    await clearRefreshToken()
    const retrieved = await getRefreshToken()

    expect(retrieved).toBeNull()
  })

  it('overwrites existing token when storing new one', async () => {
    await storeRefreshToken('old-token')

    await storeRefreshToken('new-token')
    const retrieved = await getRefreshToken()

    expect(retrieved).toBe('new-token')
  })
})

