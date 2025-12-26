import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AccountInfo from "./AccountInfo";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/dropbox-client", () => ({
  getCurrentAccount: vi.fn(),
}));

import { useAuth } from "../context/AuthContext";
import { getCurrentAccount } from "../lib/dropbox-client";

describe("AccountInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: "test-token",
      accountId: null,
      isAuthenticated: true,
      isLoading: false,
      setTokens: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(getCurrentAccount).mockReturnValue(new Promise(() => {}));

    render(<AccountInfo />);

    expect(screen.getByText("Loading account info...")).toBeInTheDocument();
  });

  it("shows account info on success", async () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: "test-token",
      accountId: null,
      isAuthenticated: true,
      isLoading: false,
      setTokens: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(getCurrentAccount).mockResolvedValue({
      account_id: "dbid:123",
      email: "user@example.com",
      name: {
        display_name: "John Doe",
        given_name: "John",
        surname: "Doe",
      },
    });

    render(<AccountInfo />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("shows error on failure", async () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: "test-token",
      accountId: null,
      isAuthenticated: true,
      isLoading: false,
      setTokens: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(getCurrentAccount).mockRejectedValue(new Error("API Error"));

    render(<AccountInfo />);

    await waitFor(() => {
      expect(screen.getByText("Error: API Error")).toBeInTheDocument();
    });
  });

  it("renders nothing when no access token", async () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: null,
      accountId: null,
      isAuthenticated: false,
      isLoading: false,
      setTokens: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(<AccountInfo />);

    await waitFor(() => {
      expect(
        screen.queryByText("Loading account info..."),
      ).not.toBeInTheDocument();
    });
    expect(container.firstChild).toBeNull();
  });
});

