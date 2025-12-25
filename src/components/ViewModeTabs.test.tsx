import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ViewModeTabs from "./ViewModeTabs";

describe("ViewModeTabs", () => {
  it("renders both Inbox and Vault tabs", () => {
    const mockOnModeChange = vi.fn();

    render(
      <ViewModeTabs currentMode="inbox" onModeChange={mockOnModeChange} />,
    );

    expect(screen.getByRole("button", { name: /inbox/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /vault/i })).toBeInTheDocument();
  });

  it("marks Inbox tab as active when currentMode is inbox", () => {
    const mockOnModeChange = vi.fn();

    render(
      <ViewModeTabs currentMode="inbox" onModeChange={mockOnModeChange} />,
    );

    const inboxTab = screen.getByRole("button", { name: /inbox/i });
    expect(inboxTab).toHaveAttribute("aria-pressed", "true");
  });

  it("marks Vault tab as active when currentMode is vault", () => {
    const mockOnModeChange = vi.fn();

    render(
      <ViewModeTabs currentMode="vault" onModeChange={mockOnModeChange} />,
    );

    const vaultTab = screen.getByRole("button", { name: /vault/i });
    expect(vaultTab).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onModeChange when Inbox tab is clicked", async () => {
    const mockOnModeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ViewModeTabs currentMode="vault" onModeChange={mockOnModeChange} />,
    );

    await user.click(screen.getByRole("button", { name: /inbox/i }));

    expect(mockOnModeChange).toHaveBeenCalledWith("inbox");
  });

  it("calls onModeChange when Vault tab is clicked", async () => {
    const mockOnModeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ViewModeTabs currentMode="inbox" onModeChange={mockOnModeChange} />,
    );

    await user.click(screen.getByRole("button", { name: /vault/i }));

    expect(mockOnModeChange).toHaveBeenCalledWith("vault");
  });
});
