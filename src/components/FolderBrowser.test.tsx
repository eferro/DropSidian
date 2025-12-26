import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FolderBrowser from "./FolderBrowser";

vi.mock("../lib/dropbox-client", () => ({
  listFolder: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ accessToken: "test-token" }),
}));

import { listFolder } from "../lib/dropbox-client";

describe("FolderBrowser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(listFolder).mockImplementation(() => new Promise(() => {}));

    render(<FolderBrowser onSelect={() => {}} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays folders after loading", async () => {
    vi.mocked(listFolder).mockResolvedValue({
      entries: [
        {
          ".tag": "folder",
          name: "Documents",
          path_display: "/Documents",
          path_lower: "/documents",
          id: "id:folder1",
        },
        {
          ".tag": "folder",
          name: "Photos",
          path_display: "/Photos",
          path_lower: "/photos",
          id: "id:folder2",
        },
        {
          ".tag": "file",
          name: "readme.txt",
          path_display: "/readme.txt",
          path_lower: "/readme.txt",
          id: "id:file1",
        },
      ],
      cursor: "cursor",
      has_more: false,
    });

    render(<FolderBrowser onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.getByText("Photos")).toBeInTheDocument();
    });

    expect(screen.queryByText("readme.txt")).not.toBeInTheDocument();
  });

  it("navigates into folder when clicking on it", async () => {
    vi.mocked(listFolder)
      .mockResolvedValueOnce({
        entries: [
          {
            ".tag": "folder",
            name: "Documents",
            path_display: "/Documents",
            path_lower: "/documents",
            id: "id:folder1",
          },
        ],
        cursor: "cursor",
        has_more: false,
      })
      .mockResolvedValueOnce({
        entries: [
          {
            ".tag": "folder",
            name: "Work",
            path_display: "/Documents/Work",
            path_lower: "/documents/work",
            id: "id:folder2",
          },
        ],
        cursor: "cursor",
        has_more: false,
      });

    const user = userEvent.setup();
    render(<FolderBrowser onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Documents"));

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    expect(listFolder).toHaveBeenCalledWith("test-token", "/Documents");
  });

  it("calls onSelect with current path when select button is clicked", async () => {
    vi.mocked(listFolder)
      .mockResolvedValueOnce({
        entries: [
          {
            ".tag": "folder",
            name: "Documents",
            path_display: "/Documents",
            path_lower: "/documents",
            id: "id:folder1",
          },
        ],
        cursor: "cursor",
        has_more: false,
      })
      .mockResolvedValueOnce({
        entries: [],
        cursor: "cursor",
        has_more: false,
      });

    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<FolderBrowser onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Documents"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /select/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /select/i }));

    expect(onSelect).toHaveBeenCalledWith("/Documents");
  });

  it("shows back button and navigates up when clicked", async () => {
    vi.mocked(listFolder)
      .mockResolvedValueOnce({
        entries: [
          {
            ".tag": "folder",
            name: "Documents",
            path_display: "/Documents",
            path_lower: "/documents",
            id: "id:folder1",
          },
        ],
        cursor: "cursor",
        has_more: false,
      })
      .mockResolvedValueOnce({
        entries: [
          {
            ".tag": "folder",
            name: "Work",
            path_display: "/Documents/Work",
            path_lower: "/documents/work",
            id: "id:folder2",
          },
        ],
        cursor: "cursor",
        has_more: false,
      })
      .mockResolvedValueOnce({
        entries: [
          {
            ".tag": "folder",
            name: "Documents",
            path_display: "/Documents",
            path_lower: "/documents",
            id: "id:folder1",
          },
        ],
        cursor: "cursor",
        has_more: false,
      });

    const user = userEvent.setup();
    render(<FolderBrowser onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Documents"));

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /back/i }));

    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });
  });

  it("shows error message when folder listing fails", async () => {
    vi.mocked(listFolder).mockRejectedValue(new Error("Network error"));

    render(<FolderBrowser onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when folder has no subfolders", async () => {
    vi.mocked(listFolder).mockResolvedValue({
      entries: [],
      cursor: "cursor",
      has_more: false,
    });

    render(<FolderBrowser onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/no folders/i)).toBeInTheDocument();
    });
  });
});

