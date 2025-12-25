import { describe, it, expect } from 'vitest'
import { formatDate } from './date-utils'

describe('formatDate', () => {
  it('formats date in readable format', () => {
    const result = formatDate('2024-01-15T10:00:00Z')
    expect(result).toBe('Jan 15, 2024')
  })

  it('handles different months', () => {
    expect(formatDate('2024-03-20T10:00:00Z')).toBe('Mar 20, 2024')
    expect(formatDate('2024-12-31T23:59:59Z')).toBe('Dec 31, 2024')
  })

  it('formats single-digit days correctly', () => {
    const result = formatDate('2024-01-05T10:00:00Z')
    expect(result).toBe('Jan 5, 2024')
  })
})
