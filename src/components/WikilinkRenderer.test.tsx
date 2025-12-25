import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WikilinkRenderer from "./WikilinkRenderer";

describe("WikilinkRenderer", () => {
  it("renders wikilink as clickable text", () => {
    const onNavigate = vi.fn();

    render(
      <WikilinkRenderer
        target="My Note"
        displayText={null}
        resolved="/vault/My Note.md"
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText("My Note")).toBeInTheDocument();
  });

  it("shows displayText when provided", () => {
    const onNavigate = vi.fn();

    render(
      <WikilinkRenderer
        target="Target Note"
        displayText="click here"
        resolved="/vault/Target Note.md"
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText("click here")).toBeInTheDocument();
    expect(screen.queryByText("Target Note")).not.toBeInTheDocument();
  });

  it("calls onNavigate when resolved link is clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <WikilinkRenderer
        target="My Note"
        displayText={null}
        resolved="/vault/My Note.md"
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(onNavigate).toHaveBeenCalledWith("/vault/My Note.md");
  });

  it("renders as non-clickable span when not resolved", () => {
    const onNavigate = vi.fn();

    render(
      <WikilinkRenderer
        target="Unknown Note"
        displayText={null}
        resolved={null}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText("Unknown Note")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
