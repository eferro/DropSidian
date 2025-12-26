import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Callback from "./pages/Callback";
import NotFound from "./pages/NotFound";
import { debugLog } from "./lib/logger";
import { getStoredOAuthState, getStoredCodeVerifier } from "./lib/dropbox-auth";

export function OAuthRedirectHandler() {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [callbackParams, setCallbackParams] = useState("");

  useEffect(() => {
    const storedState = getStoredOAuthState();
    const storedVerifier = getStoredCodeVerifier();

    debugLog("OAuthRedirectHandler - checking URL", {
      fullHref: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      pathname: window.location.pathname,
      storedState: storedState ? `${storedState.substring(0, 8)}...` : null,
      storedVerifier: storedVerifier ? "exists" : null,
      localStorageKeys: Object.keys(localStorage),
    });

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      debugLog("OAuthRedirectHandler - OAuth error in URL", {
        error,
        errorDescription,
      });
    }

    if (code) {
      debugLog("OAuthRedirectHandler - OAuth code received", {
        codeLength: code.length,
        receivedState: state ? `${state.substring(0, 8)}...` : null,
        storedState: storedState ? `${storedState.substring(0, 8)}...` : null,
        stateMatch: state === storedState,
        storedVerifier: storedVerifier ? "exists" : null,
        fullSearchParams: window.location.search,
      });

      setCallbackParams(window.location.search);
      window.history.replaceState({}, "", window.location.pathname);

      debugLog("OAuthRedirectHandler - redirecting to callback", {
        callbackRoute: `/callback${window.location.search}`,
      });

      setShouldRedirect(true);
    }
  }, []);

  if (shouldRedirect) {
    return <Navigate to={`/callback${callbackParams}`} replace />;
  }

  return null;
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
  );
}

export default App;
