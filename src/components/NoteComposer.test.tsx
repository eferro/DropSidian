import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteComposer from './NoteComposer'

describe('NoteComposer', () => {
  it('shows collapsed state initially', () => {
    render(<NoteComposer onCreateNote={vi.fn()} />)

    expect(screen.getByPlaceholderText(/take a note/i)).toBeInTheDocument()
  })

  it('expands when collapsed input is clicked', async () => {
    const user = userEvent.setup()
    render(<NoteComposer onCreateNote={vi.fn()} />)

    await user.click(screen.getByPlaceholderText(/take a note/i))

    expect(screen.getByPlaceholderText(/title/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/body/i)).toBeInTheDocument()
  })

  it('collapses when Close button is clicked without calling onCreateNote', async () => {
    const onCreateNote = vi.fn()
    const user = userEvent.setup()
    render(<NoteComposer onCreateNote={onCreateNote} />)

    await user.click(screen.getByPlaceholderText(/take a note/i))
    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(screen.getByPlaceholderText(/take a note/i)).toBeInTheDocument()
    expect(onCreateNote).not.toHaveBeenCalled()
  })

  it('calls onCreateNote with title and body when Close is clicked with content', async () => {
    const onCreateNote = vi.fn()
    const user = userEvent.setup()
    render(<NoteComposer onCreateNote={onCreateNote} />)

    await user.click(screen.getByPlaceholderText(/take a note/i))
    await user.type(screen.getByPlaceholderText(/title/i), 'My Note')
    await user.type(screen.getByPlaceholderText(/body/i), 'Note content')
    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(onCreateNote).toHaveBeenCalledWith('My Note', 'Note content')
    expect(screen.getByPlaceholderText(/take a note/i)).toBeInTheDocument()
  })
})
