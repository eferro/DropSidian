import { buildAuthUrl } from "../lib/dropbox-auth";

async function handleConnect(): Promise<void> {
  const authUrl = await buildAuthUrl();
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

