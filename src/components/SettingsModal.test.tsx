import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsModal from './SettingsModal'

describe('SettingsModal', () => {
  it('renders nothing when closed', () => {
    render(<SettingsModal isOpen={false} onClose={vi.fn()} />)

    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  it('renders modal with title when open', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()

    render(<SettingsModal isOpen={true} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('shows current vault path when provided', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        vaultPath="/my-vault"
      />
    )

    expect(screen.getByText('/my-vault')).toBeInTheDocument()
  })

  it('calls onChangeVault when change button is clicked', async () => {
    const onChangeVault = vi.fn()

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        vaultPath="/my-vault"
        onChangeVault={onChangeVault}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /change/i }))

    expect(onChangeVault).toHaveBeenCalled()
  })

  it('shows inbox path input field', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByLabelText(/inbox folder/i)).toBeInTheDocument()
  })

  it('calls onInboxPathChange when inbox path is changed', async () => {
    const onInboxPathChange = vi.fn()

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        inboxPath="Inbox"
        onInboxPathChange={onInboxPathChange}
      />
    )

    const input = screen.getByLabelText(/inbox folder/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'GTD/Inbox')

    expect(onInboxPathChange).toHaveBeenCalled()
  })
})

