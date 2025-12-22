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

