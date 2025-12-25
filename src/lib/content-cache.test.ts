import { describe, it, expect, beforeEach } from "vitest";
import {
  getCachedContent,
  setCachedContent,
  clearContentCache,
  generateCacheKey,
} from "./content-cache";

describe("content-cache", () => {
  beforeEach(() => {
    clearContentCache();
  });

  it("returns undefined for non-existent cache key", () => {
    const result = getCachedContent("non-existent");
    expect(result).toBeUndefined();
  });

  it("stores and retrieves cached content", () => {
    const key = "test-key";
    const content = "processed content";

    setCachedContent(key, content);
    const result = getCachedContent(key);

    expect(result).toBe(content);
  });

  it("clears all cached content", () => {
    setCachedContent("key1", "content1");
    setCachedContent("key2", "content2");

    clearContentCache();

    expect(getCachedContent("key1")).toBeUndefined();
    expect(getCachedContent("key2")).toBeUndefined();
  });

  it("generates cache key from content and path", () => {
    const content = "This is a long note content that should be truncated";
    const vaultPath = "/vault";
    const notePath = "/vault/inbox/note.md";

    const key = generateCacheKey(content, vaultPath, notePath);

    expect(key).toContain(notePath);
    expect(key).toContain(content.substring(0, 100));
  });

  it("uses vaultPath when notePath is not provided", () => {
    const content = "Note content";
    const vaultPath = "/vault";

    const key = generateCacheKey(content, vaultPath);

    expect(key).toContain(vaultPath);
  });
});
