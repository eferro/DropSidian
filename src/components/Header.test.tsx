import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from './Header'

describe('Header', () => {
  it('displays the app logo', () => {
    render(<Header />)

    expect(screen.getByText('DropSidian')).toBeInTheDocument()
  })

  it('shows user avatar button when user is provided', () => {
    const user = { displayName: 'John Doe', email: 'john@example.com' }

    render(<Header user={user} />)

    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
  })

  it('opens dropdown with user info when avatar is clicked', async () => {
    const user = { displayName: 'John Doe', email: 'john@example.com' }

    render(<Header user={user} />)
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }))

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('calls onLogout when disconnect button is clicked', async () => {
    const user = { displayName: 'John Doe', email: 'john@example.com' }
    const onLogout = vi.fn()

    render(<Header user={user} onLogout={onLogout} />)
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }))
    await userEvent.click(screen.getByRole('button', { name: /disconnect/i }))

    expect(onLogout).toHaveBeenCalled()
  })

  it('calls onSettings when settings button is clicked', async () => {
    const user = { displayName: 'John Doe', email: 'john@example.com' }
    const onSettings = vi.fn()

    render(<Header user={user} onSettings={onSettings} />)
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }))
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))

    expect(onSettings).toHaveBeenCalled()
  })
})

