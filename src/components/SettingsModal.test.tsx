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

  it('calls onInboxPathChange only when Save button is clicked', async () => {
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

    expect(onInboxPathChange).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(onInboxPathChange).toHaveBeenCalledWith('GTD/Inbox')
  })

  it('does not call onInboxPathChange when Cancel button is clicked', async () => {
    const onInboxPathChange = vi.fn()
    const onClose = vi.fn()

    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        inboxPath="Inbox"
        onInboxPathChange={onInboxPathChange}
      />
    )

    const input = screen.getByLabelText(/inbox folder/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'GTD/Inbox')

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onInboxPathChange).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})

