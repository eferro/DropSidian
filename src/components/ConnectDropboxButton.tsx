import { buildAuthUrl, getStoredOAuthState } from "../lib/dropbox-auth";
import { debugLog } from "../lib/logger";

async function handleConnect(): Promise<void> {
  debugLog("ConnectDropboxButton - handleConnect started");

  const authUrl = await buildAuthUrl();

  debugLog("ConnectDropboxButton - auth URL built", {
    storedState: getStoredOAuthState()?.substring(0, 8) + "...",
    redirectingTo: authUrl.substring(0, 80) + "...",
  });

  window.location.href = authUrl;
}

function ConnectDropboxButton() {
  return (
    <button type="button" onClick={handleConnect}>
      Connect Dropbox
    </button>
  );
}

export default ConnectDropboxButton;

