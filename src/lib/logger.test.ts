import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLogger } from './logger'

describe('createLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not log when isDev is false', () => {
    const debugLog = createLogger(false)

    debugLog('test message', { data: 'value' })

    expect(console.log).not.toHaveBeenCalled()
  })

  it('should log when isDev is true', () => {
    const debugLog = createLogger(true)

    debugLog('test message', { data: 'value' })

    expect(console.log).toHaveBeenCalledWith(
      '[DropSidian] test message',
      { data: 'value' }
    )
  })

  it('should handle undefined data parameter', () => {
    const debugLog = createLogger(true)

    debugLog('message only')

    expect(console.log).toHaveBeenCalledWith(
      '[DropSidian] message only',
      undefined
    )
  })
})
