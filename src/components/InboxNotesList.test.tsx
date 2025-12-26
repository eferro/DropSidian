import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InboxNotesList from "./InboxNotesList";
import * as dropboxClient from "../lib/dropbox-client";
import styles from "./InboxNotesList.module.css";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "test-token",
  }),
}));

describe("InboxNotesList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state initially", () => {
    vi.spyOn(dropboxClient, "listInboxNotesWithContent").mockImplementation(
      () => new Promise(() => {}),
    );

    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("loads and displays inbox notes", async () => {
    vi.spyOn(dropboxClient, "listInboxNotesWithContent").mockResolvedValue([
      {
        name: "Note 1.md",
        path_display: "/vault/Inbox/Note 1.md",
        path_lower: "/vault/inbox/note 1.md",
        id: "id:1",
        server_modified: "2024-01-15T10:00:00Z",
      },
      {
        name: "Note 2.md",
        path_display: "/vault/Inbox/Note 2.md",
        path_lower: "/vault/inbox/note 2.md",
        id: "id:2",
        server_modified: "2024-01-14T10:00:00Z",
      },
    ]);

    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Note 1")).toBeInTheDocument();
      expect(screen.getByText("Note 2")).toBeInTheDocument();
    });

    expect(dropboxClient.listInboxNotesWithContent).toHaveBeenCalledWith(
      "test-token",
      "/vault",
      "Inbox",
    );
  });

  it("shows empty state when there are no notes", async () => {
    vi.spyOn(dropboxClient, "listInboxNotesWithContent").mockResolvedValue([]);

    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />);

    await waitFor(() => {
      expect(screen.getByText(/no notes/i)).toBeInTheDocument();
    });
  });

  it("refreshes when refreshKey changes", async () => {
    const listSpy = vi
      .spyOn(dropboxClient, "listInboxNotesWithContent")
      .mockResolvedValue([
        {
          name: "Note 1.md",
          path_display: "/vault/Inbox/Note 1.md",
          path_lower: "/vault/inbox/note 1.md",
          id: "id:1",
          server_modified: "2024-01-15T10:00:00Z",
        },
      ]);

    const { rerender } = render(
      <InboxNotesList vaultPath="/vault" inboxPath="Inbox" refreshKey={0} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Note 1")).toBeInTheDocument();
    });

    expect(listSpy).toHaveBeenCalledTimes(1);

    rerender(
      <InboxNotesList vaultPath="/vault" inboxPath="Inbox" refreshKey={1} />,
    );

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("dispatches custom event when note card is clicked", async () => {
    vi.spyOn(dropboxClient, "listInboxNotesWithContent").mockResolvedValue([
      {
        name: "Note 1.md",
        path_display: "/vault/Inbox/Note 1.md",
        path_lower: "/vault/inbox/note 1.md",
        id: "id:1",
        server_modified: "2024-01-15T10:00:00Z",
      },
    ]);

    const eventSpy = vi.fn();
    window.addEventListener("inboxFileSelect", eventSpy);
    const user = userEvent.setup();

    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Note 1")).toBeInTheDocument();
    });

    const card = screen.getByRole("button", { name: /note 1/i });
    await user.click(card);

    expect(eventSpy).toHaveBeenCalledTimes(1);
    const event = eventSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toBe("/vault/Inbox/Note 1.md");

    window.removeEventListener("inboxFileSelect", eventSpy);
  });

  it("displays formatted last modified date for each note", async () => {
    vi.spyOn(dropboxClient, "listInboxNotesWithContent").mockResolvedValue([
      {
        name: "Note 1.md",
        path_display: "/vault/Inbox/Note 1.md",
        path_lower: "/vault/inbox/note 1.md",
        id: "id:1",
        server_modified: "2024-01-15T10:00:00Z",
      },
    ]);

    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Note 1")).toBeInTheDocument();
    });

    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it("displays content preview when available", async () => {
    vi.spyOn(dropboxClient, "listInboxNotesWithContent").mockResolvedValue([
      {
        name: "Note 1.md",
        path_display: "/vault/Inbox/Note 1.md",
        path_lower: "/vault/inbox/note 1.md",
        id: "id:1",
        server_modified: "2024-01-15T10:00:00Z",
        content: "This is the preview content",
      },
    ]);

    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Note 1")).toBeInTheDocument();
    });

    expect(screen.getByText("This is the preview content")).toBeInTheDocument();
  });

  it("renders a checkbox for each note card", async () => {
    vi.spyOn(dropboxClient, "listInboxNotesWithContent").mockResolvedValue([
      {
        name: "Note 1.md",
        path_display: "/vault/Inbox/Note 1.md",
        path_lower: "/vault/inbox/note 1.md",
        id: "id:1",
        server_modified: "2024-01-15T10:00:00Z",
      },
      {
        name: "Note 2.md",
        path_display: "/vault/Inbox/Note 2.md",
        path_lower: "/vault/inbox/note 2.md",
        id: "id:2",
        server_modified: "2024-01-14T10:00:00Z",
      },
    ]);

    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Note 1")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
  });

  it("applies selected class when checkbox is checked", async () => {
    vi.spyOn(dropboxClient, "listInboxNotesWithContent").mockResolvedValue([
      {
        name: "Note 1.md",
        path_display: "/vault/Inbox/Note 1.md",
        path_lower: "/vault/inbox/note 1.md",
        id: "id:1",
        server_modified: "2024-01-15T10:00:00Z",
      },
    ]);

    const user = userEvent.setup();
    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Note 1")).toBeInTheDocument();
    });

    const card = screen.getByRole("button", { name: /note 1/i });
    expect(card).not.toHaveClass(styles.cardSelected);

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(card).toHaveClass(styles.cardSelected);
  });

  it("shows delete button when notes are selected", async () => {
    vi.spyOn(dropboxClient, "listInboxNotesWithContent").mockResolvedValue([
      {
        name: "Note 1.md",
        path_display: "/vault/Inbox/Note 1.md",
        path_lower: "/vault/inbox/note 1.md",
        id: "id:1",
        server_modified: "2024-01-15T10:00:00Z",
      },
      {
        name: "Note 2.md",
        path_display: "/vault/Inbox/Note 2.md",
        path_lower: "/vault/inbox/note 2.md",
        id: "id:2",
        server_modified: "2024-01-14T10:00:00Z",
      },
    ]);

    const user = userEvent.setup();
    render(<InboxNotesList vaultPath="/vault" inboxPath="Inbox" />);

    await waitFor(() => {
      expect(screen.getByText("Note 1")).toBeInTheDocument();
    });

    expect(screen.queryByText(/delete selected/i)).not.toBeInTheDocument();

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    expect(screen.getByText("Delete selected (1)")).toBeInTheDocument();

    await user.click(checkboxes[1]);

    expect(screen.getByText("Delete selected (2)")).toBeInTheDocument();
  });

  it("deletes selected notes when delete button is clicked", async () => {
    vi.spyOn(dropboxClient, "listInboxNotesWithContent").mockResolvedValue([
      {
        name: "Note 1.md",
        path_display: "/vault/Inbox/Note 1.md",
        path_lower: "/vault/inbox/note 1.md",
        id: "id:1",
        server_modified: "2024-01-15T10:00:00Z",
      },
      {
        name: "Note 2.md",
        path_display: "/vault/Inbox/Note 2.md",
        path_lower: "/vault/inbox/note 2.md",
        id: "id:2",
        server_modified: "2024-01-14T10:00:00Z",
      },
    ]);

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const deleteSpy = vi
      .spyOn(dropboxClient, "deleteFile")
      .mockResolvedValue();
    const onDeleteMock = vi.fn();

    const user = userEvent.setup();
    render(
      <InboxNotesList
        vaultPath="/vault"
        inboxPath="Inbox"
        onDelete={onDeleteMock}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Note 1")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    const deleteButton = screen.getByText("Delete selected (2)");
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      "Delete 2 note(s)? This cannot be undone.",
    );
    expect(deleteSpy).toHaveBeenCalledTimes(2);
    expect(deleteSpy).toHaveBeenCalledWith(
      "test-token",
      "/vault/Inbox/Note 1.md",
    );
    expect(deleteSpy).toHaveBeenCalledWith(
      "test-token",
      "/vault/Inbox/Note 2.md",
    );
    expect(onDeleteMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.queryByText(/delete selected/i)).not.toBeInTheDocument();
    });
  });
});
