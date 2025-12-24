import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  exchangeCodeForTokens,
  getStoredCodeVerifier,
  validateOAuthState,
  clearOAuthState,
} from '../lib/dropbox-auth'
import { useAuth } from '../context/AuthContext'

let isExchanging = false

function Callback() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const navigate = useNavigate()
  const { setTokens } = useAuth()

  useEffect(() => {
    console.log('[DropSidian Debug] Callback - processing:', {
      isExchanging,
      searchParams: Object.fromEntries(searchParams.entries()),
      href: window.location.href,
    })

    if (isExchanging) {
      console.log('[DropSidian Debug] Callback - already exchanging, skipping')
      return
    }

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      console.error('[DropSidian Debug] Callback - OAuth error:', {
        error,
        errorDescription,
      })
      setError(`OAuth error: ${error} - ${errorDescription}`)
      setIsProcessing(false)
      return
    }

    if (!code) {
      console.error('[DropSidian Debug] Callback - No code received')
      setError('No authorization code received')
      setIsProcessing(false)
      return
    }

    if (!state || !validateOAuthState(state)) {
      console.error('[DropSidian Debug] Callback - Invalid state:', {
        receivedState: state,
        storedState: 'check sessionStorage',
      })
      setError('Invalid state parameter - possible CSRF attack')
      setIsProcessing(false)
      return
    }

    const verifier = getStoredCodeVerifier()
    console.log('[DropSidian Debug] Callback - verifier exists:', !!verifier)
    
    if (!verifier) {
      console.error('[DropSidian Debug] Callback - No verifier found')
      setIsProcessing(false)
      return
    }

    isExchanging = true
    console.log('[DropSidian Debug] Callback - starting token exchange')

    exchangeCodeForTokens(code)
      .then((tokens) => {
        console.log('[DropSidian Debug] Callback - token exchange successful')
        clearOAuthState()
        setTokens(tokens.access_token, tokens.refresh_token, tokens.account_id)
        navigate('/', { replace: true })
      })
      .catch((err) => {
        console.error('[DropSidian Debug] Callback - token exchange failed:', err)
        setError(err.message)
        setIsProcessing(false)
      })
      .finally(() => {
        isExchanging = false
      })
  }, [searchParams, setTokens, navigate])

  if (error) {
    return (
      <main>
        <h1>Authentication Error</h1>
        <p>{error}</p>
        <a href="/">Go back home</a>
      </main>
    )
  }

  if (!isProcessing && !error) {
    return (
      <main>
        <h1>Authentication Complete</h1>
        <p>Redirecting...</p>
      </main>
    )
  }

  return (
    <main>
      <h1>Processing authentication...</h1>
    </main>
  )
}

export default Callback
