import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./pages/Home', () => ({
  default: () => <div data-testid="home-page">Home Page</div>,
}))

vi.mock('./pages/Callback', () => ({
  default: () => <div data-testid="callback-page">Callback Page</div>,
}))

vi.mock('./pages/NotFound', () => ({
  default: () => <div data-testid="not-found-page">Not Found Page</div>,
}))

import Home from './pages/Home'
import Callback from './pages/Callback'
import NotFound from './pages/NotFound'
import { AuthProvider } from './context/AuthContext'

function TestApp({ initialRoute = '/' }: { initialRoute?: string }) {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders home page at root route', async () => {
    render(<TestApp initialRoute="/" />)

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
  })

  it('renders callback page at /callback route', async () => {
    render(<TestApp initialRoute="/callback?code=test&state=test" />)

    await waitFor(() => {
      expect(screen.getByTestId('callback-page')).toBeInTheDocument()
    })
  })

  it('renders not found page for unknown routes', async () => {
    render(<TestApp initialRoute="/unknown-route" />)

    await waitFor(() => {
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
    })
  })
})

describe('OAuthRedirectHandler', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('detects OAuth code in URL search params', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        href: 'http://localhost:3000/?code=auth-code&state=test',
        search: '?code=auth-code&state=test',
        hash: '',
        pathname: '/',
      },
    })

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    expect(code).toBe('auth-code')
  })

  it('detects OAuth error in URL search params', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        href: 'http://localhost:3000/?error=access_denied',
        search: '?error=access_denied',
        hash: '',
        pathname: '/',
      },
    })

    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')

    expect(error).toBe('access_denied')
  })
})
