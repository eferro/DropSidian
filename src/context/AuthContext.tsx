import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { storeRefreshToken, clearRefreshToken, getRefreshToken } from '../lib/token-storage'
import { refreshAccessToken } from '../lib/dropbox-auth'

interface AuthState {
  accessToken: string | null
  accountId: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  setTokens: (
    accessToken: string,
    refreshToken: string,
    accountId: string
  ) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    accountId: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    getRefreshToken()
      .then((refreshToken) => {
        if (!refreshToken) {
          setAuthState((prev) => ({ ...prev, isLoading: false }))
          return
        }

        return refreshAccessToken(refreshToken).then((tokens) => {
          setAuthState({
            accessToken: tokens.access_token,
            accountId: tokens.account_id,
            isAuthenticated: true,
            isLoading: false,
          })
        })
      })
      .catch(() => {
        clearRefreshToken()
        setAuthState((prev) => ({ ...prev, isLoading: false }))
      })
  }, [])

  function setTokens(
    accessToken: string,
    refreshToken: string,
    accountId: string
  ): void {
    storeRefreshToken(refreshToken)
    setAuthState({
      accessToken,
      accountId,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  function logout(): void {
    clearRefreshToken()
    setAuthState({
      accessToken: null,
      accountId: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  return (
    <AuthContext.Provider value={{ ...authState, setTokens, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
