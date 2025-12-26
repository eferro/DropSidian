import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PathInput from "./PathInput";

vi.mock("../lib/dropbox-client", () => ({
  listFolder: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ accessToken: "test-token" }),
}));

import { listFolder } from "../lib/dropbox-client";

describe("PathInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an input with placeholder", () => {
    vi.mocked(listFolder).mockResolvedValue({
      entries: [],
      cursor: "cursor",
      has_more: false,
    });

    render(<PathInput onSelect={() => {}} />);

    expect(screen.getByPlaceholderText(/path/i)).toBeInTheDocument();
  });

  it("shows folder suggestions when typing", async () => {
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
          name: "Downloads",
          path_display: "/Downloads",
          path_lower: "/downloads",
          id: "id:folder2",
        },
        {
          ".tag": "file",
          name: "readme.txt",
          path_display: "/readme.txt",
          path_lower: "/readme.txt",
          id: "id:file1",
        },
        {
          ".tag": "folder",
          name: ".hidden",
          path_display: "/.hidden",
          path_lower: "/.hidden",
          id: "id:hidden",
        },
      ],
      cursor: "cursor",
      has_more: false,
    });

    const user = userEvent.setup();
    render(<PathInput onSelect={() => {}} />);

    const input = screen.getByPlaceholderText(/path/i);
    await user.type(input, "/Do");

    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.getByText("Downloads")).toBeInTheDocument();
    });

    expect(screen.queryByText("readme.txt")).not.toBeInTheDocument();
    expect(screen.queryByText(".hidden")).not.toBeInTheDocument();
  });

  it("updates input when clicking a suggestion", async () => {
    vi.mocked(listFolder).mockResolvedValue({
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
    render(<PathInput onSelect={() => {}} />);

    const input = screen.getByPlaceholderText(/path/i);
    await user.type(input, "/D");

    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Documents"));

    expect(input).toHaveValue("/Documents");
  });

  it("calls onSelect when clicking select button", async () => {
    vi.mocked(listFolder).mockResolvedValue({
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

    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<PathInput onSelect={onSelect} />);

    const input = screen.getByPlaceholderText(/path/i);
    await user.type(input, "/D");

    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Documents"));
    await user.click(screen.getByRole("button", { name: /select/i }));

    expect(onSelect).toHaveBeenCalledWith("/Documents");
  });

  it("hides suggestions after selecting one", async () => {
    vi.mocked(listFolder).mockResolvedValue({
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
    render(<PathInput onSelect={() => {}} />);

    const input = screen.getByPlaceholderText(/path/i);
    await user.type(input, "/D");

    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Documents"));

    await waitFor(() => {
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
  });

  it("filters suggestions based on input text", async () => {
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
          name: "Downloads",
          path_display: "/Downloads",
          path_lower: "/downloads",
          id: "id:folder2",
        },
        {
          ".tag": "folder",
          name: "Photos",
          path_display: "/Photos",
          path_lower: "/photos",
          id: "id:folder3",
        },
      ],
      cursor: "cursor",
      has_more: false,
    });

    const user = userEvent.setup();
    render(<PathInput onSelect={() => {}} />);

    const input = screen.getByPlaceholderText(/path/i);
    await user.type(input, "/Do");

    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.getByText("Downloads")).toBeInTheDocument();
    });

    expect(screen.queryByText("Photos")).not.toBeInTheDocument();
  });

  it("uses basePath as starting point for suggestions", async () => {
    vi.mocked(listFolder).mockResolvedValue({
      entries: [
        {
          ".tag": "folder",
          name: "Inbox",
          path_display: "/Vault/Inbox",
          path_lower: "/vault/inbox",
          id: "id:folder1",
        },
      ],
      cursor: "cursor",
      has_more: false,
    });

    const user = userEvent.setup();
    render(<PathInput onSelect={() => {}} basePath="/Vault" />);

    const input = screen.getByPlaceholderText(/path/i);
    expect(input).toHaveValue("/Vault/");

    await user.type(input, "I");

    await waitFor(() => {
      expect(listFolder).toHaveBeenCalledWith("test-token", "/Vault");
    });

    await waitFor(() => {
      expect(screen.getByText("Inbox")).toBeInTheDocument();
    });
  });
});

