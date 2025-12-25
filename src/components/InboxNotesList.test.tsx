import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import InboxNotesList from './InboxNotesList'
import * as dropboxClient from '../lib/dropbox-client'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    accessToken: 'test-token',
  }),
}))

describe('InboxNotesList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    vi.spyOn(dropboxClient, 'listInboxNotes').mockImplementation(
      () => new Promise(() => {})
    )

    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('loads and displays inbox notes', async () => {
    vi.spyOn(dropboxClient, 'listInboxNotes').mockResolvedValue([
      {
        name: 'Note 1.md',
        path_display: '/vault/Inbox/Note 1.md',
        path_lower: '/vault/inbox/note 1.md',
        id: 'id:1',
        server_modified: '2024-01-15T10:00:00Z',
      },
      {
        name: 'Note 2.md',
        path_display: '/vault/Inbox/Note 2.md',
        path_lower: '/vault/inbox/note 2.md',
        id: 'id:2',
        server_modified: '2024-01-14T10:00:00Z',
      },
    ])

    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />)

    await waitFor(() => {
      expect(screen.getByText('Note 1')).toBeInTheDocument()
      expect(screen.getByText('Note 2')).toBeInTheDocument()
    })

    expect(dropboxClient.listInboxNotes).toHaveBeenCalledWith(
      'test-token',
      '/vault',
      'Inbox'
    )
  })

  it('shows empty state when there are no notes', async () => {
    vi.spyOn(dropboxClient, 'listInboxNotes').mockResolvedValue([])

    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />)

    await waitFor(() => {
      expect(screen.getByText(/no notes/i)).toBeInTheDocument()
    })
  })

  it('refreshes when refreshKey changes', async () => {
    const listSpy = vi.spyOn(dropboxClient, 'listInboxNotes').mockResolvedValue([
      {
        name: 'Note 1.md',
        path_display: '/vault/Inbox/Note 1.md',
        path_lower: '/vault/inbox/note 1.md',
        id: 'id:1',
        server_modified: '2024-01-15T10:00:00Z',
      },
    ])

    const { rerender } = render(
      <InboxNotesList vaultPath="/vault" inboxPath="Inbox" refreshKey={0} />
    )

    await waitFor(() => {
      expect(screen.getByText('Note 1')).toBeInTheDocument()
    })

    expect(listSpy).toHaveBeenCalledTimes(1)

    rerender(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" refreshKey={1} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledTimes(2)
    })
  })
})
