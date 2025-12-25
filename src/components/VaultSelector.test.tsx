import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VaultSelector from './VaultSelector'

vi.mock('../lib/vault-storage', () => ({
  storeVaultPath: vi.fn(),
  getVaultPath: vi.fn(),
}))

import { storeVaultPath, getVaultPath } from '../lib/vault-storage'

describe('VaultSelector', () => {
  const mockOnVaultSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form when no saved vault path exists', () => {
    vi.mocked(getVaultPath).mockReturnValue(null)

    render(<VaultSelector onVaultSelected={mockOnVaultSelected} />)

    expect(screen.getByLabelText(/vault path/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set vault/i })).toBeInTheDocument()
  })

  it('shows saved vault path when one exists', () => {
    vi.mocked(getVaultPath).mockReturnValue('/Obsidian/MyVault')

    render(<VaultSelector onVaultSelected={mockOnVaultSelected} />)

    expect(screen.getByText('/Obsidian/MyVault')).toBeInTheDocument()
    expect(mockOnVaultSelected).toHaveBeenCalledWith('/Obsidian/MyVault')
  })

  it('calls onVaultSelected when submitting new vault path', async () => {
    vi.mocked(getVaultPath).mockReturnValue(null)
    const user = userEvent.setup()

    render(<VaultSelector onVaultSelected={mockOnVaultSelected} />)

    await user.type(screen.getByLabelText(/vault path/i), '/NewVault')
    await user.click(screen.getByRole('button', { name: /set vault/i }))

    expect(storeVaultPath).toHaveBeenCalledWith('/NewVault')
    expect(mockOnVaultSelected).toHaveBeenCalledWith('/NewVault')
  })

  it('normalizes path by adding leading slash', async () => {
    vi.mocked(getVaultPath).mockReturnValue(null)
    const user = userEvent.setup()

    render(<VaultSelector onVaultSelected={mockOnVaultSelected} />)

    await user.type(screen.getByLabelText(/vault path/i), 'VaultWithoutSlash')
    await user.click(screen.getByRole('button', { name: /set vault/i }))

    expect(storeVaultPath).toHaveBeenCalledWith('/VaultWithoutSlash')
  })

  it('allows changing vault when clicking change button', async () => {
    vi.mocked(getVaultPath).mockReturnValue('/Obsidian/OldVault')
    const user = userEvent.setup()

    render(<VaultSelector onVaultSelected={mockOnVaultSelected} />)

    await user.click(screen.getByRole('button', { name: /change vault/i }))

    expect(screen.getByLabelText(/vault path/i)).toBeInTheDocument()
  })

  it('does not submit when path is empty', async () => {
    vi.mocked(getVaultPath).mockReturnValue(null)
    const user = userEvent.setup()

    render(<VaultSelector onVaultSelected={mockOnVaultSelected} />)

    await user.click(screen.getByRole('button', { name: /set vault/i }))

    expect(storeVaultPath).not.toHaveBeenCalled()
  })
})


