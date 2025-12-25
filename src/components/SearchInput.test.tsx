import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchInput from "./SearchInput";

describe("SearchInput", () => {
  it("renders search input", () => {
    render(<SearchInput value="" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("calls onChange when typing", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SearchInput value="" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText(/search/i), "test");

    expect(onChange).toHaveBeenCalledWith("t");
    expect(onChange).toHaveBeenCalledTimes(4);
  });
});
