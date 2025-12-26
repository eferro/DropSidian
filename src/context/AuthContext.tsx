import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  storeRefreshToken,
  clearRefreshToken,
  getRefreshToken,
} from "../lib/token-storage";
import { clearVaultPath } from "../lib/vault-storage";
import { clearInboxPath } from "../lib/inbox-storage";
import { debugLog } from "../lib/logger";
import {
  refreshAccessToken,
  revokeToken,
  clearAllOAuthData,
} from "../lib/dropbox-auth";

interface AuthState {
  accessToken: string | null;
  accountId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  setTokens: (
    accessToken: string,
    refreshToken: string,
    accountId: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    accountId: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    getRefreshToken()
      .then((refreshToken) => {
        if (!refreshToken) {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        return refreshAccessToken(refreshToken).then((tokens) => {
          setAuthState({
            accessToken: tokens.access_token,
            accountId: tokens.account_id,
            isAuthenticated: true,
            isLoading: false,
          });
        });
      })
      .catch(() => {
        clearRefreshToken();
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      });
  }, []);

  const setTokens = useCallback(
    async (accessToken: string, refreshToken: string, accountId: string): Promise<void> => {
      await storeRefreshToken(refreshToken);
      setAuthState({
        accessToken,
        accountId,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    [],
  );

  async function logout(): Promise<void> {
    debugLog("logout - starting complete cleanup", {
      hasAccessToken: !!authState.accessToken,
    });

    if (authState.accessToken) {
      await revokeToken(authState.accessToken).catch(() => {});
    }

    clearRefreshToken();
    clearAllOAuthData();
    clearVaultPath();
    clearInboxPath();

    debugLog("logout - cleanup complete");

    setAuthState({
      accessToken: null,
      accountId: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }

  return (
    <AuthContext.Provider value={{ ...authState, setTokens, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
