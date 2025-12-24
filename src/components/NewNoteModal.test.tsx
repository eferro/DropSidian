import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewNoteModal from './NewNoteModal'

describe('NewNoteModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal with title and body fields', () => {
    render(
      <NewNoteModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    )

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <NewNoteModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    )

    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument()
  })

  it('calls onClose when clicking cancel button', async () => {
    const user = userEvent.setup()

    render(
      <NewNoteModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onSubmit with title and content when submitting', async () => {
    const user = userEvent.setup()

    render(
      <NewNoteModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    )

    await user.type(screen.getByLabelText(/title/i), 'My Note')
    await user.type(screen.getByLabelText(/content/i), 'Note content here')
    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(mockOnSubmit).toHaveBeenCalledWith('My Note', 'Note content here')
  })

  it('generates timestamp title when title is empty', async () => {
    const user = userEvent.setup()

    render(
      <NewNoteModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    )

    await user.type(screen.getByLabelText(/content/i), 'Quick note')
    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(mockOnSubmit).toHaveBeenCalled()
    const [title] = mockOnSubmit.mock.calls[0]
    expect(title).toMatch(/^\d{4}-\d{2}-\d{2}/)
  })
})

