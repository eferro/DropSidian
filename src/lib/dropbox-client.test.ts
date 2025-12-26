import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getCurrentAccount,
  listFolder,
  listFolderContinue,
  listAllFiles,
  downloadFile,
  downloadFileWithMetadata,
  uploadFile,
  updateFile,
  listInboxNotes,
  listInboxNotesWithContent,
} from "./dropbox-client";

describe("getCurrentAccount", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns account data on success", async () => {
    const mockAccount = {
      account_id: "dbid:test-123",
      email: "test@example.com",
      name: {
        display_name: "Test User",
        given_name: "Test",
        surname: "User",
      },
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockAccount), { status: 200 }),
    );

    const result = await getCurrentAccount("test-access-token");

    expect(result).toEqual(mockAccount);
  });

  it("throws error on API failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 }),
    );

    await expect(getCurrentAccount("invalid-token")).rejects.toThrow(
      "Failed to get account info: Unauthorized",
    );
  });
});

describe("listFolder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns folder entries on success", async () => {
    const mockResponse = {
      entries: [
        {
          ".tag": "file",
          name: "note.md",
          path_lower: "/vault/note.md",
          path_display: "/Vault/note.md",
          id: "id:file-123",
        },
      ],
      cursor: "cursor-abc",
      has_more: false,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await listFolder("token", "/Vault");

    expect(result).toEqual(mockResponse);
  });

  it("sends empty path for root folder", async () => {
    const mockFetch = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ entries: [], cursor: "", has_more: false }),
          { status: 200 },
        ),
      );

    await listFolder("token", "/");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.dropboxapi.com/2/files/list_folder",
      expect.objectContaining({
        body: expect.stringContaining('"path":""'),
      }),
    );
  });

  it("throws error on API failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Not found", { status: 404 }),
    );

    await expect(listFolder("token", "/invalid")).rejects.toThrow(
      "Failed to list folder: Not found",
    );
  });
});

describe("listFolderContinue", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("continues listing with cursor", async () => {
    const mockResponse = {
      entries: [
        {
          ".tag": "file",
          name: "b.md",
          path_lower: "/b.md",
          path_display: "/b.md",
          id: "id:2",
        },
      ],
      cursor: "cursor-2",
      has_more: false,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await listFolderContinue("token", "cursor-1");

    expect(result).toEqual(mockResponse);
  });

  it("throws error on API failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Invalid cursor", { status: 400 }),
    );

    await expect(listFolderContinue("token", "bad-cursor")).rejects.toThrow(
      "Failed to continue listing folder: Invalid cursor",
    );
  });
});

describe("listAllFiles", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns all entries when no pagination needed", async () => {
    const mockResponse = {
      entries: [
        {
          ".tag": "file",
          name: "a.md",
          path_lower: "/a.md",
          path_display: "/a.md",
          id: "id:1",
        },
      ],
      cursor: "cursor-1",
      has_more: false,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await listAllFiles("token", "/vault");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("a.md");
  });

  it("collects all entries when pagination required", async () => {
    const firstResponse = {
      entries: [
        {
          ".tag": "file",
          name: "a.md",
          path_lower: "/a.md",
          path_display: "/a.md",
          id: "id:1",
        },
      ],
      cursor: "cursor-1",
      has_more: true,
    };
    const secondResponse = {
      entries: [
        {
          ".tag": "file",
          name: "b.md",
          path_lower: "/b.md",
          path_display: "/b.md",
          id: "id:2",
        },
      ],
      cursor: "cursor-2",
      has_more: false,
    };
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(firstResponse), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(secondResponse), { status: 200 }),
      );

    const result = await listAllFiles("token", "/vault");

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("a.md");
    expect(result[1].name).toBe("b.md");
  });
});

describe("downloadFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns file content on success", async () => {
    const fileContent = "# Hello World\n\nThis is a note.";
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(fileContent, { status: 200 }),
    );

    const result = await downloadFile("token", "/Vault/note.md");

    expect(result).toBe(fileContent);
  });

  it("throws error on API failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("File not found", { status: 404 }),
    );

    await expect(downloadFile("token", "/invalid.md")).rejects.toThrow(
      "Failed to download file: File not found",
    );
  });
});

describe("uploadFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uploads file content to specified path", async () => {
    const mockResponse = {
      name: "new-note.md",
      path_lower: "/vault/inbox/new-note.md",
      path_display: "/Vault/Inbox/new-note.md",
      id: "id:uploaded-123",
    };
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

    const result = await uploadFile(
      "token",
      "/Vault/Inbox/new-note.md",
      "# New Note",
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://content.dropboxapi.com/2/files/upload",
      expect.objectContaining({
        method: "POST",
        body: "# New Note",
      }),
    );
    expect(result.path_display).toBe("/Vault/Inbox/new-note.md");
  });

  it("throws error on API failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Path not found", { status: 409 }),
    );

    await expect(
      uploadFile("token", "/invalid/path.md", "content"),
    ).rejects.toThrow("Failed to upload file: Path not found");
  });
});

describe("downloadFileWithMetadata", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns content and metadata including rev", async () => {
    const fileContent = "# My Note";
    const metadata = {
      name: "note.md",
      path_display: "/Vault/note.md",
      rev: "abc123rev",
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(fileContent, {
        status: 200,
        headers: { "Dropbox-API-Result": JSON.stringify(metadata) },
      }),
    );

    const result = await downloadFileWithMetadata("token", "/Vault/note.md");

    expect(result.content).toBe("# My Note");
    expect(result.rev).toBe("abc123rev");
  });
});

describe("updateFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("updates file with rev for conflict prevention", async () => {
    const mockResponse = {
      name: "note.md",
      path_display: "/Vault/note.md",
      rev: "newrev456",
    };
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

    const result = await updateFile(
      "token",
      "/Vault/note.md",
      "# Updated",
      "oldrev123",
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://content.dropboxapi.com/2/files/upload",
      expect.objectContaining({
        body: "# Updated",
      }),
    );
    const headers = (fetchSpy.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    const callArg = JSON.parse(headers["Dropbox-API-Arg"]);
    expect(callArg.mode).toEqual({ ".tag": "update", update: "oldrev123" });
    expect(result.rev).toBe("newrev456");
  });

  it("throws ConflictError on 409 response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("conflict", { status: 409 }),
    );

    await expect(
      updateFile("token", "/note.md", "content", "oldrev"),
    ).rejects.toThrow("Conflict: file was modified");
  });
});

describe("getTemporaryLink", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns temporary link for file", async () => {
    const mockResponse = {
      link: "https://dl.dropboxusercontent.com/temp/image.png",
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const { getTemporaryLink } = await import("./dropbox-client");
    const result = await getTemporaryLink("token", "/vault/image.png");

    expect(result).toBe("https://dl.dropboxusercontent.com/temp/image.png");
  });
});

describe("uploadBinaryFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uploads binary file and returns metadata", async () => {
    const mockResponse = {
      name: "photo.png",
      path_lower: "/vault/photo.png",
      path_display: "/Vault/photo.png",
      id: "id:abc123",
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const { uploadBinaryFile } = await import("./dropbox-client");
    const blob = new Blob(["fake image data"], { type: "image/png" });
    const result = await uploadBinaryFile("token", "/Vault/photo.png", blob);

    expect(result.name).toBe("photo.png");
    expect(result.path_display).toBe("/Vault/photo.png");
  });
});

describe("listInboxNotes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns only markdown files sorted by server_modified desc", async () => {
    const mockResponse = {
      entries: [
        {
          ".tag": "file",
          name: "note1.md",
          path_lower: "/vault/inbox/note1.md",
          path_display: "/Vault/Inbox/note1.md",
          id: "id:1",
          server_modified: "2024-01-01T10:00:00Z",
        },
        {
          ".tag": "file",
          name: "image.png",
          path_lower: "/vault/inbox/image.png",
          path_display: "/Vault/Inbox/image.png",
          id: "id:2",
          server_modified: "2024-01-02T10:00:00Z",
        },
        {
          ".tag": "file",
          name: "note2.md",
          path_lower: "/vault/inbox/note2.md",
          path_display: "/Vault/Inbox/note2.md",
          id: "id:3",
          server_modified: "2024-01-03T10:00:00Z",
        },
      ],
      cursor: "",
      has_more: false,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await listInboxNotes("token", "/Vault", "Inbox");

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("note2.md");
    expect(result[1].name).toBe("note1.md");
  });

  it("returns empty array when no markdown files exist", async () => {
    const mockResponse = {
      entries: [
        {
          ".tag": "file",
          name: "image.png",
          path_lower: "/vault/inbox/image.png",
          path_display: "/Vault/Inbox/image.png",
          id: "id:1",
          server_modified: "2024-01-01T10:00:00Z",
        },
      ],
      cursor: "",
      has_more: false,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await listInboxNotes("token", "/Vault", "Inbox");

    expect(result).toHaveLength(0);
  });

  it("filters out README.md from inbox notes", async () => {
    const mockResponse = {
      entries: [
        {
          ".tag": "file",
          name: "README.md",
          path_lower: "/vault/inbox/readme.md",
          path_display: "/Vault/Inbox/README.md",
          id: "id:readme",
          server_modified: "2024-01-01T10:00:00Z",
        },
        {
          ".tag": "file",
          name: "note1.md",
          path_lower: "/vault/inbox/note1.md",
          path_display: "/Vault/Inbox/note1.md",
          id: "id:1",
          server_modified: "2024-01-02T10:00:00Z",
        },
      ],
      cursor: "",
      has_more: false,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await listInboxNotes("token", "/Vault", "Inbox");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("note1.md");
  });
});

describe("listInboxNotesWithContent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches notes with content", async () => {
    const mockListResponse = {
      entries: [
        {
          ".tag": "file",
          name: "note1.md",
          path_lower: "/vault/inbox/note1.md",
          path_display: "/Vault/Inbox/note1.md",
          id: "id:1",
          server_modified: "2024-01-01T10:00:00Z",
        },
      ],
      cursor: "",
      has_more: false,
    };

    const mockContent = "# Note 1\n\nThis is the content of note 1.";

    const fetchSpy = vi.spyOn(global, "fetch");

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(mockListResponse), { status: 200 }),
    );

    fetchSpy.mockResolvedValueOnce(new Response(mockContent, { status: 200 }));

    const result = await listInboxNotesWithContent("token", "/Vault", "Inbox");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("note1.md");
    expect(result[0].content).toBe(mockContent);
  });

  it("truncates content to max length", async () => {
    const mockListResponse = {
      entries: [
        {
          ".tag": "file",
          name: "note1.md",
          path_lower: "/vault/inbox/note1.md",
          path_display: "/Vault/Inbox/note1.md",
          id: "id:1",
          server_modified: "2024-01-01T10:00:00Z",
        },
      ],
      cursor: "",
      has_more: false,
    };

    const longContent = "a".repeat(1000);

    const fetchSpy = vi.spyOn(global, "fetch");

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(mockListResponse), { status: 200 }),
    );

    fetchSpy.mockResolvedValueOnce(new Response(longContent, { status: 200 }));

    const result = await listInboxNotesWithContent(
      "token",
      "/Vault",
      "Inbox",
      100,
    );

    expect(result[0].content).toHaveLength(100);
  });

  it("handles download errors gracefully", async () => {
    const mockListResponse = {
      entries: [
        {
          ".tag": "file",
          name: "note1.md",
          path_lower: "/vault/inbox/note1.md",
          path_display: "/Vault/Inbox/note1.md",
          id: "id:1",
          server_modified: "2024-01-01T10:00:00Z",
        },
      ],
      cursor: "",
      has_more: false,
    };

    const fetchSpy = vi.spyOn(global, "fetch");

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(mockListResponse), { status: 200 }),
    );

    fetchSpy.mockResolvedValueOnce(new Response("error", { status: 404 }));

    const result = await listInboxNotesWithContent("token", "/Vault", "Inbox");

    expect(result).toHaveLength(1);
    expect(result[0].content).toBeUndefined();
  });
});

describe("moveFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("moves file from source to destination path", async () => {
    const mockResponse = {
      metadata: {
        ".tag": "file",
        name: "new-name.md",
        path_lower: "/vault/inbox/new-name.md",
        path_display: "/Vault/Inbox/new-name.md",
        id: "id:abc123",
      },
    };
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

    const { moveFile } = await import("./dropbox-client");
    const result = await moveFile(
      "token",
      "/Vault/Inbox/old-name.md",
      "/Vault/Inbox/new-name.md",
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.dropboxapi.com/2/files/move_v2",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          from_path: "/Vault/Inbox/old-name.md",
          to_path: "/Vault/Inbox/new-name.md",
        }),
      }),
    );
    expect(result.path_display).toBe("/Vault/Inbox/new-name.md");
  });

  it("throws error on API failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Path not found", { status: 409 }),
    );

    const { moveFile } = await import("./dropbox-client");
    await expect(
      moveFile("token", "/invalid/old.md", "/invalid/new.md"),
    ).rejects.toThrow("Failed to move file: Path not found");
  });
});

describe("deleteFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("deletes file successfully", async () => {
    const mockResponse = {
      metadata: {
        ".tag": "file",
        name: "note.md",
        path_display: "/Vault/note.md",
      },
    };
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

    const { deleteFile } = await import("./dropbox-client");
    await deleteFile("token", "/Vault/note.md");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.dropboxapi.com/2/files/delete_v2",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ path: "/Vault/note.md" }),
      }),
    );
  });

  it("throws error on API failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Not found", { status: 409 }),
    );

    const { deleteFile } = await import("./dropbox-client");
    await expect(deleteFile("token", "/Vault/note.md")).rejects.toThrow(
      "Failed to delete file: Not found",
    );
  });
});
