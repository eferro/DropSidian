import { describe, it, expect } from "vitest";
import {
  sanitizeFilename,
  isWithinVault,
  sanitizePath,
  getParentPath,
  removeExtension,
} from "./path-utils";

describe("sanitizeFilename", () => {
  it("should remove path traversal sequences", () => {
    expect(sanitizeFilename("../../../etc/passwd")).toBe("etc-passwd");
  });

  it("should remove special filesystem characters", () => {
    expect(sanitizeFilename("file:name*test?.md")).toBe("file-name-test-.md");
  });

  it("should trim whitespace", () => {
    expect(sanitizeFilename("  my note  ")).toBe("my note");
  });

  it("should limit length to 200 characters", () => {
    const longName = "a".repeat(250);
    expect(sanitizeFilename(longName).length).toBe(200);
  });

  it("should handle normal filenames unchanged", () => {
    expect(sanitizeFilename("My Note Title")).toBe("My Note Title");
  });

  it("should remove backslashes", () => {
    expect(sanitizeFilename("path\\to\\file")).toBe("path-to-file");
  });
});

describe("isWithinVault", () => {
  it("should return true for paths within vault", () => {
    expect(isWithinVault("/vault/notes/file.md", "/vault")).toBe(true);
  });

  it("should return false for paths outside vault", () => {
    expect(isWithinVault("/other/file.md", "/vault")).toBe(false);
  });

  it("should return false for path traversal attempts", () => {
    expect(isWithinVault("/vault/../other/file.md", "/vault")).toBe(false);
  });

  it("should be case insensitive", () => {
    expect(isWithinVault("/Vault/Notes/File.md", "/vault")).toBe(true);
  });

  it("should handle vault at root", () => {
    expect(isWithinVault("/MyVault/notes/file.md", "/MyVault")).toBe(true);
  });
});

describe("sanitizePath", () => {
  it("should normalize path traversal sequences", () => {
    expect(sanitizePath("/vault/../../../etc/passwd")).toBe("/etc/passwd");
  });

  it("should normalize double slashes", () => {
    expect(sanitizePath("/vault//notes///file.md")).toBe(
      "/vault/notes/file.md",
    );
  });

  it("should keep leading slash", () => {
    expect(sanitizePath("/vault/notes")).toBe("/vault/notes");
  });
});

describe("getParentPath", () => {
  it("should return parent directory path", () => {
    expect(getParentPath("/vault/notes/file.md")).toBe("/vault/notes");
  });

  it("should handle root path", () => {
    expect(getParentPath("/vault")).toBe("");
  });

  it("should handle nested paths", () => {
    expect(getParentPath("/a/b/c/d.md")).toBe("/a/b/c");
  });

  it("should handle single segment", () => {
    expect(getParentPath("file.md")).toBe("");
  });
});

describe("removeExtension", () => {
  it("should remove .md extension", () => {
    expect(removeExtension("note.md")).toBe("note");
  });

  it("should not affect files without .md extension", () => {
    expect(removeExtension("note.txt")).toBe("note.txt");
  });

  it("should handle filenames without extension", () => {
    expect(removeExtension("note")).toBe("note");
  });

  it("should only remove .md extension", () => {
    expect(removeExtension("note.md.backup")).toBe("note.md.backup");
  });
});
