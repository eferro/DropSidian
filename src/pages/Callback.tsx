import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  exchangeCodeForTokens,
  getStoredCodeVerifier,
  validateOAuthState,
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
    if (isExchanging) {
      return
    }

    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      setError('No authorization code received')
      setIsProcessing(false)
      return
    }

    if (!state || !validateOAuthState(state)) {
      setError('Invalid state parameter - possible CSRF attack')
      setIsProcessing(false)
      return
    }

    const verifier = getStoredCodeVerifier()
    if (!verifier) {
      setIsProcessing(false)
      return
    }

    isExchanging = true

    exchangeCodeForTokens(code)
      .then((tokens) => {
        setTokens(tokens.access_token, tokens.refresh_token, tokens.account_id)
        navigate('/', { replace: true })
      })
      .catch((err) => {
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
