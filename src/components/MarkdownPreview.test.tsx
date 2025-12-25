import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import MarkdownPreview from "./MarkdownPreview";
import * as imagePreview from "../lib/image-preview";

describe("MarkdownPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders basic markdown text", () => {
    const content = "This is a simple note";

    render(<MarkdownPreview content={content} maxHeight={200} />);

    expect(screen.getByText("This is a simple note")).toBeInTheDocument();
  });

  it("converts wikilink images to img tags", async () => {
    const content = "Text with image ![[test.png]] here";
    vi.spyOn(imagePreview, "getImagePreviewUrl").mockResolvedValue(
      "https://example.com/test.png"
    );

    render(
      <MarkdownPreview
        content={content}
        maxHeight={200}
        accessToken="test-token"
        vaultPath="/vault"
      />
    );

    await waitFor(() => {
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "https://example.com/test.png");
    });
  });

  it("keeps wikilink syntax when no accessToken provided", () => {
    const content = "Text with image ![[test.png]] here";

    render(<MarkdownPreview content={content} maxHeight={200} />);

    expect(screen.getByText(/Text with image !\[\[test\.png\]\] here/)).toBeInTheDocument();
  });
});
