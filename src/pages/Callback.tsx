import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  exchangeCodeForTokens,
  getStoredCodeVerifier,
  validateOAuthState,
  clearOAuthState,
} from "../lib/dropbox-auth";
import { useAuth } from "../context/AuthContext";
import { debugLog } from "../lib/logger";

function Callback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const isExchangingRef = useRef(false);

  useEffect(() => {
    debugLog("Callback - processing", {
      isExchanging: isExchangingRef.current,
      searchParams: Object.fromEntries(searchParams.entries()),
    });

    if (isExchangingRef.current) {
      debugLog("Callback - already exchanging, skipping");
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      debugLog("Callback - OAuth error", { error, errorDescription });
      setError(`OAuth error: ${error} - ${errorDescription}`);
      setIsProcessing(false);
      return;
    }

    if (!code) {
      debugLog("Callback - No code received");
      setError("No authorization code received");
      setIsProcessing(false);
      return;
    }

    if (!state || !validateOAuthState(state)) {
      debugLog("Callback - Invalid state", { receivedState: state });
      setError("Invalid state parameter - possible CSRF attack");
      setIsProcessing(false);
      return;
    }

    const verifier = getStoredCodeVerifier();
    debugLog("Callback - verifier exists", { exists: !!verifier });

    if (!verifier) {
      debugLog("Callback - No verifier found");
      setIsProcessing(false);
      return;
    }

    isExchangingRef.current = true;
    debugLog("Callback - starting token exchange");

    exchangeCodeForTokens(code)
      .then((tokens) => {
        debugLog("Callback - token exchange successful");
        clearOAuthState();
        setTokens(tokens.access_token, tokens.refresh_token, tokens.account_id);
        navigate("/", { replace: true });
      })
      .catch((err) => {
        debugLog("Callback - token exchange failed", { error: err.message });
        setError(err.message);
        setIsProcessing(false);
      })
      .finally(() => {
        isExchangingRef.current = false;
      });
  }, [searchParams, setTokens, navigate]);

  if (error) {
    return (
      <main>
        <h1>Authentication Error</h1>
        <p>{error}</p>
        <a href="/">Go back home</a>
      </main>
    );
  }

  if (!isProcessing && !error) {
    return (
      <main>
        <h1>Authentication Complete</h1>
        <p>Redirecting...</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Processing authentication...</h1>
    </main>
  );
}

export default Callback;
