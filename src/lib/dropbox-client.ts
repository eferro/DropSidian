async function assertResponseOk(
  response: Response,
  errorPrefix: string,
): Promise<void> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${errorPrefix}: ${error}`);
  }
}

function encodeJsonForHeader(value: unknown): string {
  const jsonString = JSON.stringify(value);
  return jsonString.replace(/[\u0080-\uFFFF]/g, (char) => {
    return "\\u" + ("0000" + char.charCodeAt(0).toString(16)).slice(-4);
  });
}

export interface DropboxAccount {
  account_id: string;
  email: string;
  name: {
    display_name: string;
    given_name: string;
    surname: string;
  };
}

export async function getCurrentAccount(
  accessToken: string,
): Promise<DropboxAccount> {
  const response = await fetch(
    "https://api.dropboxapi.com/2/users/get_current_account",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  await assertResponseOk(response, "Failed to get account info");
  return response.json();
}

export interface DropboxEntry {
  ".tag": "file" | "folder";
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  server_modified?: string;
}

export interface ListFolderResponse {
  entries: DropboxEntry[];
  cursor: string;
  has_more: boolean;
}

export interface ListFolderOptions {
  recursive?: boolean;
}

export async function listFolder(
  accessToken: string,
  path: string,
  options: ListFolderOptions = {},
): Promise<ListFolderResponse> {
  const { recursive = false } = options;

  const response = await fetch(
    "https://api.dropboxapi.com/2/files/list_folder",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: path === "/" ? "" : path,
        recursive,
        include_media_info: false,
      }),
    },
  );

  await assertResponseOk(response, "Failed to list folder");
  return response.json();
}

export async function listFolderContinue(
  accessToken: string,
  cursor: string,
): Promise<ListFolderResponse> {
  const response = await fetch(
    "https://api.dropboxapi.com/2/files/list_folder/continue",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cursor }),
    },
  );

  await assertResponseOk(response, "Failed to continue listing folder");
  return response.json();
}

export async function listAllFiles(
  accessToken: string,
  path: string,
): Promise<DropboxEntry[]> {
  const allEntries: DropboxEntry[] = [];

  let response = await listFolder(accessToken, path, { recursive: true });
  allEntries.push(...response.entries);

  while (response.has_more) {
    response = await listFolderContinue(accessToken, response.cursor);
    allEntries.push(...response.entries);
  }

  return allEntries;
}

export async function downloadFile(
  accessToken: string,
  path: string,
): Promise<string> {
  const response = await fetch(
    "https://content.dropboxapi.com/2/files/download",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": encodeJsonForHeader({ path }),
      },
    },
  );

  await assertResponseOk(response, "Failed to download file");
  return response.text();
}

export interface FileWithMetadata {
  content: string;
  rev: string;
  name: string;
  path_display: string;
}

export async function downloadFileWithMetadata(
  accessToken: string,
  path: string,
): Promise<FileWithMetadata> {
  const response = await fetch(
    "https://content.dropboxapi.com/2/files/download",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": encodeJsonForHeader({ path }),
      },
    },
  );

  await assertResponseOk(response, "Failed to download file");

  const metadata = JSON.parse(
    response.headers.get("Dropbox-API-Result") ?? "{}",
  );
  const content = await response.text();

  return {
    content,
    rev: metadata.rev,
    name: metadata.name,
    path_display: metadata.path_display,
  };
}

export interface UploadFileResponse {
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
}

export async function uploadFile(
  accessToken: string,
  path: string,
  content: string,
): Promise<UploadFileResponse> {
  const response = await fetch(
    "https://content.dropboxapi.com/2/files/upload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": encodeJsonForHeader({ path, mode: "add" }),
        "Content-Type": "application/octet-stream",
      },
      body: content,
    },
  );

  await assertResponseOk(response, "Failed to upload file");
  return response.json();
}

export interface UpdateFileResponse {
  name: string;
  path_display: string;
  rev: string;
}

export async function updateFile(
  accessToken: string,
  path: string,
  content: string,
  rev: string,
): Promise<UpdateFileResponse> {
  const response = await fetch(
    "https://content.dropboxapi.com/2/files/upload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": encodeJsonForHeader({
          path,
          mode: { ".tag": "update", update: rev },
        }),
        "Content-Type": "application/octet-stream",
      },
      body: content,
    },
  );

  if (response.status === 409) {
    throw new Error("Conflict: file was modified");
  }

  await assertResponseOk(response, "Failed to update file");
  return response.json();
}

export interface MoveFileResponse {
  name: string;
  path_display: string;
  path_lower: string;
  id: string;
}

export async function moveFile(
  accessToken: string,
  fromPath: string,
  toPath: string,
): Promise<MoveFileResponse> {
  const response = await fetch("https://api.dropboxapi.com/2/files/move_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from_path: fromPath, to_path: toPath }),
  });

  await assertResponseOk(response, "Failed to move file");
  const data = await response.json();
  return data.metadata;
}

export async function deleteFile(
  accessToken: string,
  path: string,
): Promise<void> {
  const response = await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  await assertResponseOk(response, "Failed to delete file");
}

export async function getTemporaryLink(
  accessToken: string,
  path: string,
): Promise<string> {
  const response = await fetch(
    "https://api.dropboxapi.com/2/files/get_temporary_link",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    },
  );

  await assertResponseOk(response, "Failed to get temporary link");

  const data = await response.json();
  return data.link;
}

export async function uploadBinaryFile(
  accessToken: string,
  path: string,
  blob: Blob,
): Promise<UploadFileResponse> {
  const response = await fetch(
    "https://content.dropboxapi.com/2/files/upload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": encodeJsonForHeader({ path, mode: "add" }),
        "Content-Type": "application/octet-stream",
      },
      body: blob,
    },
  );

  await assertResponseOk(response, "Failed to upload file");
  return response.json();
}

export interface InboxNote {
  name: string;
  path_display: string;
  path_lower: string;
  id: string;
  server_modified: string;
  content?: string;
}

export async function listInboxNotes(
  accessToken: string,
  vaultPath: string,
  inboxPath: string,
): Promise<InboxNote[]> {
  const fullInboxPath = `${vaultPath}/${inboxPath}`;
  const response = await listFolder(accessToken, fullInboxPath);

  const markdownFiles = response.entries
    .filter(
      (entry): entry is DropboxEntry & { server_modified: string } =>
        entry[".tag"] === "file" &&
        entry.name.endsWith(".md") &&
        entry.name !== "README.md" &&
        entry.server_modified !== undefined,
    )
    .map(
      (entry): InboxNote => ({
        name: entry.name,
        path_display: entry.path_display,
        path_lower: entry.path_lower,
        id: entry.id,
        server_modified: entry.server_modified,
      }),
    );

  markdownFiles.sort((a, b) => {
    return (
      new Date(b.server_modified).getTime() -
      new Date(a.server_modified).getTime()
    );
  });

  return markdownFiles;
}

export async function listInboxNotesWithContent(
  accessToken: string,
  vaultPath: string,
  inboxPath: string,
  maxContentLength: number = 500,
): Promise<InboxNote[]> {
  const notes = await listInboxNotes(accessToken, vaultPath, inboxPath);

  const notesWithContent = await Promise.all(
    notes.map(async (note) => {
      try {
        const fullContent = await downloadFile(accessToken, note.path_display);
        const content = fullContent.substring(0, maxContentLength);
        return { ...note, content };
      } catch {
        return note;
      }
    }),
  );

  return notesWithContent;
}
