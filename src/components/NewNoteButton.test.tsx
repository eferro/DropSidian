import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewNoteButton from "./NewNoteButton";

describe("NewNoteButton", () => {
  it("renders button with correct text", () => {
    render(<NewNoteButton onClick={vi.fn()} />);

    expect(screen.getByRole("button")).toHaveTextContent("+ New Note");
  });

  it("calls onClick when button is clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<NewNoteButton onClick={onClick} />);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

