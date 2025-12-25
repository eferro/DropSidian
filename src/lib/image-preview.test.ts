import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractImageReferences, getImagePreviewUrl } from "./image-preview";
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
});
