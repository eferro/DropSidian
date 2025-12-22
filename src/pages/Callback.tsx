import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCodeForTokens } from '../lib/dropbox-auth'
import { useAuth } from '../context/AuthContext'

function Callback() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setTokens } = useAuth()

  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) {
      setError('No authorization code received')
      return
    }

    exchangeCodeForTokens(code)
      .then((tokens) => {
        setTokens(tokens.access_token, tokens.account_id)
        navigate('/', { replace: true })
      })
      .catch((err) => {
        setError(err.message)
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

  return (
    <main>
      <h1>Processing authentication...</h1>
    </main>
  )
}

export default Callback
