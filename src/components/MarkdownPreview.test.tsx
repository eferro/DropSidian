import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MarkdownPreview from "./MarkdownPreview";

describe("MarkdownPreview", () => {
  it("renders basic markdown text", () => {
    const content = "This is a simple note";

    render(<MarkdownPreview content={content} maxHeight={200} />);

    expect(screen.getByText("This is a simple note")).toBeInTheDocument();
  });
});
