import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractImageReferences,
  getImagePreviewUrl,
  clearImageCache,
} from "./image-preview";
import * as dropboxClient from "./dropbox-client";

describe("extractImageReferences", () => {
  it("extracts single wikilink image reference", () => {
    const content = "Some text ![[image.png]] more text";
    const result = extractImageReferences(content);
    expect(result).toEqual(["image.png"]);
  });

  it("extracts multiple wikilink image references", () => {
    const content = "First ![[image1.png]] and second ![[image2.jpg]]";
    const result = extractImageReferences(content);
    expect(result).toEqual(["image1.png", "image2.jpg"]);
  });

  it("returns empty array when no images found", () => {
    const content = "Just plain text with no images";
    const result = extractImageReferences(content);
    expect(result).toEqual([]);
  });
});

describe("getImagePreviewUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches temporary link for image", async () => {
    const mockLink = "https://dl.dropboxusercontent.com/temp/image.png";
    vi.spyOn(dropboxClient, "getTemporaryLink").mockResolvedValue(mockLink);

    const result = await getImagePreviewUrl(
      "test-token",
      "/vault",
      "image.png"
    );

    expect(result).toBe(mockLink);
    expect(dropboxClient.getTemporaryLink).toHaveBeenCalledWith(
      "test-token",
      "/vault/image.png"
    );
  });

  it("uses cached URL on second call for same image", async () => {
    const mockLink = "https://dl.dropboxusercontent.com/temp/image.png";
    const getTemporaryLinkSpy = vi
      .spyOn(dropboxClient, "getTemporaryLink")
      .mockResolvedValue(mockLink);

    await getImagePreviewUrl("test-token", "/vault", "cached.png");
    await getImagePreviewUrl("test-token", "/vault", "cached.png");

    expect(getTemporaryLinkSpy).toHaveBeenCalledTimes(1);
  });

  it("refetches after cache is cleared", async () => {
    const mockLink = "https://dl.dropboxusercontent.com/temp/image.png";
    const getTemporaryLinkSpy = vi
      .spyOn(dropboxClient, "getTemporaryLink")
      .mockResolvedValue(mockLink);

    await getImagePreviewUrl("test-token", "/vault", "clear-test.png");
    clearImageCache();
    await getImagePreviewUrl("test-token", "/vault", "clear-test.png");

    expect(getTemporaryLinkSpy).toHaveBeenCalledTimes(2);
  });
});
