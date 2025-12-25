import { describe, it, expect } from "vitest";
import { buildNoteIndex, resolveWikilink } from "./note-index";

describe("buildNoteIndex", () => {
  it("returns empty map for empty file list", () => {
    const files: string[] = [];

    const result = buildNoteIndex(files);

    expect(result.size).toBe(0);
  });

  it("maps note title to file path", () => {
    const files = ["/vault/My Note.md"];

    const result = buildNoteIndex(files);

    expect(result.get("My Note")).toBe("/vault/My Note.md");
  });

  it("maps multiple notes", () => {
    const files = ["/vault/First.md", "/vault/subfolder/Second.md"];

    const result = buildNoteIndex(files);

    expect(result.size).toBe(2);
    expect(result.get("First")).toBe("/vault/First.md");
    expect(result.get("Second")).toBe("/vault/subfolder/Second.md");
  });
});

describe("resolveWikilink", () => {
  it("returns null when target not found", () => {
    const index = buildNoteIndex([]);

    const result = resolveWikilink("Unknown", index);

    expect(result).toBeNull();
  });

  it("returns path when target is found by exact title", () => {
    const index = buildNoteIndex(["/vault/My Note.md"]);

    const result = resolveWikilink("My Note", index);

    expect(result).toBe("/vault/My Note.md");
  });
});
