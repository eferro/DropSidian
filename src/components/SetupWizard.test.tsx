import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SetupWizard from "./SetupWizard";

vi.mock("../lib/vault-storage", () => ({
  getVaultPath: vi.fn(),
  storeVaultPath: vi.fn(),
}));

vi.mock("../lib/inbox-storage", () => ({
  getInboxPath: vi.fn(),
  storeInboxPath: vi.fn(),
}));

vi.mock("./PathInput", () => ({
  default: ({ onSelect }: { onSelect: (path: string) => void }) => (
    <div data-testid="path-input">
      <button onClick={() => onSelect("/selected-path")}>Select</button>
    </div>
  ),
}));

import { getVaultPath, storeVaultPath } from "../lib/vault-storage";
import { getInboxPath, storeInboxPath } from "../lib/inbox-storage";

describe("SetupWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows vault selection step when no vault is configured", () => {
    vi.mocked(getVaultPath).mockReturnValue(null);
    vi.mocked(getInboxPath).mockReturnValue(null);

    render(<SetupWizard onComplete={() => {}} />);

    expect(
      screen.getByRole("heading", { name: /select.*vault/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("path-input")).toBeInTheDocument();
  });

  it("shows step indicator for vault step", () => {
    vi.mocked(getVaultPath).mockReturnValue(null);
    vi.mocked(getInboxPath).mockReturnValue(null);

    render(<SetupWizard onComplete={() => {}} />);

    expect(screen.getByText(/step 1.*2/i)).toBeInTheDocument();
  });

  it("moves to inbox step after vault is selected", async () => {
    vi.mocked(getVaultPath).mockReturnValue(null);
    vi.mocked(getInboxPath).mockReturnValue(null);

    const user = userEvent.setup();
    render(<SetupWizard onComplete={() => {}} />);

    await user.click(screen.getByRole("button", { name: /select/i }));

    expect(storeVaultPath).toHaveBeenCalledWith("/selected-path");
    expect(
      screen.getByRole("heading", { name: /select.*inbox/i }),
    ).toBeInTheDocument();
  });

  it("shows inbox step directly when vault is already configured", () => {
    vi.mocked(getVaultPath).mockReturnValue("/my-vault");
    vi.mocked(getInboxPath).mockReturnValue(null);

    render(<SetupWizard onComplete={() => {}} />);

    expect(
      screen.getByRole("heading", { name: /select.*inbox/i }),
    ).toBeInTheDocument();
  });

  it("shows step indicator for inbox step", () => {
    vi.mocked(getVaultPath).mockReturnValue("/my-vault");
    vi.mocked(getInboxPath).mockReturnValue(null);

    render(<SetupWizard onComplete={() => {}} />);

    expect(screen.getByText(/step 2.*2/i)).toBeInTheDocument();
  });

  it("calls onComplete when both vault and inbox are configured", () => {
    vi.mocked(getVaultPath).mockReturnValue("/my-vault");
    vi.mocked(getInboxPath).mockReturnValue("Inbox");

    const onComplete = vi.fn();
    render(<SetupWizard onComplete={onComplete} />);

    expect(onComplete).toHaveBeenCalledWith("/my-vault", "Inbox");
  });

  it("calls onComplete after selecting inbox", async () => {
    vi.mocked(getVaultPath).mockReturnValue("/my-vault");
    vi.mocked(getInboxPath).mockReturnValue(null);

    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<SetupWizard onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: /select/i }));

    expect(storeInboxPath).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it("correctly calculates relative inbox path from absolute path", async () => {
    vi.mocked(getVaultPath).mockReturnValue("/my-vault");
    vi.mocked(getInboxPath).mockReturnValue(null);

    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<SetupWizard onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: /select/i }));

    expect(storeInboxPath).toHaveBeenCalledWith("selected-path");
    expect(onComplete).toHaveBeenCalledWith("/my-vault", "selected-path");
  });
});

