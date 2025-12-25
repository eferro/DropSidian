import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MarkdownWithWikilinks from "./MarkdownWithWikilinks";

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown">{children}</div>
  ),
}));

vi.mock("remark-gfm", () => ({
  default: {},
}));

vi.mock("./ImageEmbed", () => ({
  default: ({ filePath }: { filePath: string }) => (
    <img data-testid="image-embed" alt={filePath} />
  ),
}));

describe("MarkdownWithWikilinks", () => {
  it("renders plain markdown without wikilinks", () => {
    const onNavigate = vi.fn();
    const noteIndex = new Map<string, string>();

    render(
      <MarkdownWithWikilinks
        content="# Hello World"
        noteIndex={noteIndex}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByTestId("markdown")).toHaveTextContent("# Hello World");
  });

  it("renders wikilink as clickable button", () => {
    const onNavigate = vi.fn();
    const noteIndex = new Map<string, string>([
      ["My Note", "/vault/My Note.md"],
    ]);

    render(
      <MarkdownWithWikilinks
        content="See [[My Note]] for details."
        noteIndex={noteIndex}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByRole("button", { name: "My Note" })).toBeInTheDocument();
  });

  it("renders image embed when accessToken and currentPath provided", () => {
    const onNavigate = vi.fn();
    const noteIndex = new Map<string, string>();

    render(
      <MarkdownWithWikilinks
        content="Here is an image: ![[photo.png]]"
        noteIndex={noteIndex}
        onNavigate={onNavigate}
        accessToken="token"
        currentPath="/vault/note.md"
      />,
    );

    expect(screen.getByTestId("image-embed")).toBeInTheDocument();
  });
});
