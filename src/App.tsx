import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Callback from './pages/Callback'
import NotFound from './pages/NotFound'

function OAuthRedirectHandler() {
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [callbackParams, setCallbackParams] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
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
    <HashRouter>
      <OAuthRedirectHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  )
}

export default App
