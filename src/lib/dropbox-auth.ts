import { generateCodeVerifier, generateCodeChallenge } from './pkce'

const DROPBOX_APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY as string
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string

const CODE_VERIFIER_KEY = 'dropbox_code_verifier'

export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier)
}

export function getStoredCodeVerifier(): string | null {
  return sessionStorage.getItem(CODE_VERIFIER_KEY)
}

export function clearCodeVerifier(): void {
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
}

export async function buildAuthUrl(): Promise<string> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)

  storeCodeVerifier(verifier)

  const params = new URLSearchParams({
    client_id: DROPBOX_APP_KEY,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    redirect_uri: REDIRECT_URI,
    token_access_type: 'offline',
  })

  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  account_id: string
}

export async function exchangeCodeForTokens(
  code: string
): Promise<TokenResponse> {
  const verifier = getStoredCodeVerifier()
  if (!verifier) {
    throw new Error('No code verifier found')
  }

  const params = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    code_verifier: verifier,
    client_id: DROPBOX_APP_KEY,
    redirect_uri: REDIRECT_URI,
  })

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  clearCodeVerifier()
  return response.json()
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: DROPBOX_APP_KEY,
  })

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token refresh failed: ${error}`)
  }

  return response.json()
}

