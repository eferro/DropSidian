import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AttachmentUploader from "./AttachmentUploader";

vi.mock("../lib/dropbox-client", () => ({
  uploadBinaryFile: vi.fn(),
}));

import { uploadBinaryFile } from "../lib/dropbox-client";

describe("AttachmentUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload button", () => {
    render(
      <AttachmentUploader
        currentNotePath="/vault/note.md"
        accessToken="token"
        onUploadComplete={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /attach/i })).toBeInTheDocument();
  });

  it("uploads file when selected and calls onUploadComplete", async () => {
    const onUploadComplete = vi.fn();
    vi.mocked(uploadBinaryFile).mockResolvedValue({
      name: "photo.png",
      path_lower: "/vault/photo.png",
      path_display: "/vault/photo.png",
      id: "id:123",
    });

    render(
      <AttachmentUploader
        currentNotePath="/vault/note.md"
        accessToken="token"
        onUploadComplete={onUploadComplete}
      />,
    );

    const file = new File(["image data"], "photo.png", { type: "image/png" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadBinaryFile).toHaveBeenCalledWith(
        "token",
        "/vault/photo.png",
        file,
      );
    });

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledWith("photo.png");
    });
  });
});
