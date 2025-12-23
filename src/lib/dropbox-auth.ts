import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateRandomString,
} from './pkce'

const DROPBOX_APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY as string
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string

console.log('[DropSidian Debug] Environment config:', {
  DROPBOX_APP_KEY: DROPBOX_APP_KEY ? `${DROPBOX_APP_KEY.substring(0, 4)}...` : 'NOT SET',
  REDIRECT_URI: REDIRECT_URI || 'NOT SET',
  currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
  currentHref: typeof window !== 'undefined' ? window.location.href : 'N/A',
})

const CODE_VERIFIER_KEY = 'dropbox_code_verifier'
const OAUTH_STATE_KEY = 'dropbox_oauth_state'

export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier)
}

export function storeOAuthState(state: string): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state)
}

export function getStoredOAuthState(): string | null {
  return sessionStorage.getItem(OAUTH_STATE_KEY)
}

export function clearOAuthState(): void {
  sessionStorage.removeItem(OAUTH_STATE_KEY)
}

export function validateOAuthState(state: string): boolean {
  const storedState = getStoredOAuthState()
  clearOAuthState()
  return storedState !== null && storedState === state
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
  const state = generateRandomString(32)

  storeCodeVerifier(verifier)
  storeOAuthState(state)

  const params = new URLSearchParams({
    client_id: DROPBOX_APP_KEY,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    redirect_uri: REDIRECT_URI,
    token_access_type: 'offline',
    state,
  })

  const authUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`
  
  console.log('[DropSidian Debug] buildAuthUrl:', {
    redirect_uri: REDIRECT_URI,
    client_id: DROPBOX_APP_KEY ? `${DROPBOX_APP_KEY.substring(0, 4)}...` : 'NOT SET',
    state: state.substring(0, 8) + '...',
    fullUrl: authUrl,
  })

  return authUrl
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

export async function revokeToken(accessToken: string): Promise<void> {
  await fetch('https://api.dropboxapi.com/2/auth/token/revoke', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

