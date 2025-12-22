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

