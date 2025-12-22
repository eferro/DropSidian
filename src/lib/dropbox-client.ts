export interface DropboxAccount {
  account_id: string
  email: string
  name: {
    display_name: string
    given_name: string
    surname: string
  }
}

export async function getCurrentAccount(
  accessToken: string
): Promise<DropboxAccount> {
  const response = await fetch(
    'https://api.dropboxapi.com/2/users/get_current_account',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get account info: ${error}`)
  }

  return response.json()
}

export interface DropboxEntry {
  '.tag': 'file' | 'folder'
  name: string
  path_lower: string
  path_display: string
  id: string
}

export interface ListFolderResponse {
  entries: DropboxEntry[]
  cursor: string
  has_more: boolean
}

export async function listFolder(
  accessToken: string,
  path: string
): Promise<ListFolderResponse> {
  const response = await fetch(
    'https://api.dropboxapi.com/2/files/list_folder',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: path === '/' ? '' : path,
        recursive: false,
        include_media_info: false,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to list folder: ${error}`)
  }

  return response.json()
}

export async function downloadFile(
  accessToken: string,
  path: string
): Promise<string> {
  const response = await fetch(
    'https://content.dropboxapi.com/2/files/download',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path }),
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to download file: ${error}`)
  }

  return response.text()
}

