import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Callback from './pages/Callback'
import NotFound from './pages/NotFound'

function OAuthRedirectHandler() {
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [callbackParams, setCallbackParams] = useState('')

  useEffect(() => {
    console.log('[DropSidian Debug] OAuthRedirectHandler - checking URL:', {
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      pathname: window.location.pathname,
    })

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    const errorDescription = params.get('error_description')

    if (error) {
      console.error('[DropSidian Debug] OAuth error in URL:', {
        error,
        errorDescription,
      })
    }

    if (code) {
      console.log('[DropSidian Debug] OAuth code received, redirecting to callback')
      setCallbackParams(window.location.search)
      window.history.replaceState({}, '', window.location.pathname)
      setShouldRedirect(true)
    }
  }, [])

  if (shouldRedirect) {
    return <Navigate to={`/callback${callbackParams}`} replace />
  }

  return null
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <OAuthRedirectHandler />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}

export default App
