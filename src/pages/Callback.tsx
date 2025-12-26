import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  exchangeCodeForTokens,
  getStoredCodeVerifier,
  validateOAuthState,
  clearOAuthState,
  getStoredOAuthState,
} from "../lib/dropbox-auth";
import { useAuth } from "../context/AuthContext";
import { debugLog } from "../lib/logger";

const OAUTH_COMPLETE_KEY = "dropsidian_oauth_complete";
const OAUTH_RESPONSE_KEY = "dropsidian_oauth_response";

interface OAuthResponse {
  code: string | null;
  state: string | null;
  error: string | null;
  errorDescription: string | null;
}

function getOAuthParams(searchParams: URLSearchParams): OAuthResponse {
  // First try to get from sessionStorage (set by main.tsx before React loaded)
  const storedResponse = sessionStorage.getItem(OAUTH_RESPONSE_KEY);
  if (storedResponse) {
    sessionStorage.removeItem(OAUTH_RESPONSE_KEY); // Clean up after reading
    try {
      return JSON.parse(storedResponse);
    } catch {
      // Fall through to URL params
    }
  }
  
  // Fallback to URL params (for direct navigation to /#/callback?...)
  return {
    code: searchParams.get("code"),
    state: searchParams.get("state"),
    error: searchParams.get("error"),
    errorDescription: searchParams.get("error_description"),
  };
}

function Callback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const isExchangingRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (hasRedirectedRef.current) {
      debugLog("Callback - already redirected, skipping");
      return;
    }

    const storedState = getStoredOAuthState();
    const storedVerifier = getStoredCodeVerifier();
    const completeFlag = sessionStorage.getItem(OAUTH_COMPLETE_KEY);

    debugLog("Callback - useEffect triggered", {
      isExchanging: isExchangingRef.current,
      completeFlag,
      searchParams: Object.fromEntries(searchParams.entries()),
      storedState: storedState ? `${storedState.substring(0, 8)}...` : "NULL",
      storedVerifier: storedVerifier ? "EXISTS" : "NULL",
      localStorageKeys: Object.keys(localStorage),
      hasOAuthResponse: !!sessionStorage.getItem(OAUTH_RESPONSE_KEY),
    });

    if (completeFlag === "true") {
      debugLog("Callback - OAuth already completed, redirecting to home");
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        window.location.replace("/");
      }
      return;
    }

    if (!storedState && !storedVerifier) {
      debugLog(
        "Callback - No OAuth state in progress (state and verifier both missing)",
      );
      hasRedirectedRef.current = true;
      navigate("/", { replace: true });
      return;
    }

    if (isExchangingRef.current) {
      debugLog("Callback - already exchanging, skipping duplicate call");
      return;
    }

    const oauthParams = getOAuthParams(searchParams);
    const { code, state, error: oauthError, errorDescription } = oauthParams;

    debugLog("Callback - parsed OAuth params", {
      hasCode: !!code,
      codeLength: code?.length ?? 0,
      receivedState: state ? `${state.substring(0, 8)}...` : "NULL",
      hasError: !!oauthError,
      error: oauthError,
      errorDescription,
    });

    if (oauthError) {
      debugLog("Callback - OAuth error from Dropbox", {
        error: oauthError,
        errorDescription,
      });
      setError(`OAuth error: ${oauthError} - ${errorDescription}`);
      setIsProcessing(false);
      return;
    }

    if (!code) {
      debugLog("Callback - No authorization code in URL");
      setError("No authorization code received");
      setIsProcessing(false);
      return;
    }

    debugLog("Callback - State validation", {
      receivedState: state,
      receivedStateFull: state,
      storedState: storedState,
      storedStateFull: storedState,
      exactMatch: state === storedState,
      receivedStateLength: state?.length ?? 0,
      storedStateLength: storedState?.length ?? 0,
    });

    if (!state || !validateOAuthState(state)) {
      debugLog("Callback - STATE VALIDATION FAILED", {
        receivedState: state,
        storedState: storedState,
        receivedIsNull: state === null,
        storedIsNull: storedState === null,
        receivedIsEmpty: state === "",
        storedIsEmpty: storedState === "",
        localStorageKeys: Object.keys(localStorage),
        localStorageContent: {
          dropbox_oauth_state: localStorage.getItem("dropbox_oauth_state"),
          dropbox_code_verifier: localStorage.getItem("dropbox_code_verifier")
            ? "EXISTS"
            : "NULL",
        },
      });
      setError("Invalid state parameter - possible CSRF attack");
      setIsProcessing(false);
      return;
    }

    debugLog("Callback - State validation PASSED");

    const verifier = storedVerifier;
    debugLog("Callback - Code verifier check", {
      exists: !!verifier,
      verifierLength: verifier?.length ?? 0,
    });

    if (!verifier) {
      debugLog("Callback - No code verifier found in localStorage");
      setError("No code verifier found - please try connecting again");
      setIsProcessing(false);
      return;
    }

    isExchangingRef.current = true;
    debugLog("Callback - Starting token exchange with Dropbox API");

    exchangeCodeForTokens(code)
      .then(async (tokens) => {
        debugLog("Callback - Token exchange SUCCESS", {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          hasAccountId: !!tokens.account_id,
        });
        sessionStorage.setItem(OAUTH_COMPLETE_KEY, "true");
        clearOAuthState();
        await setTokens(tokens.access_token, tokens.refresh_token, tokens.account_id);
        debugLog("Callback - Tokens stored, navigating to home page");
        hasRedirectedRef.current = true;
        window.location.replace("/");
      })
      .catch((err) => {
        debugLog("Callback - Token exchange FAILED", {
          error: err.message,
          stack: err.stack,
        });
        sessionStorage.removeItem(OAUTH_COMPLETE_KEY);
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
