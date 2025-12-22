import { createContext, useContext, useState, ReactNode } from 'react'
import { storeRefreshToken, clearRefreshToken } from '../lib/token-storage'

interface AuthState {
  accessToken: string | null
  accountId: string | null
  isAuthenticated: boolean
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
  })

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
    })
  }

  function logout(): void {
    clearRefreshToken()
    setAuthState({
      accessToken: null,
      accountId: null,
      isAuthenticated: false,
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
