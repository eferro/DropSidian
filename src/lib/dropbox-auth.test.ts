import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  storeOAuthState,
  getStoredOAuthState,
  clearOAuthState,
  storeCodeVerifier,
  getStoredCodeVerifier,
  clearCodeVerifier,
  buildAuthUrl,
  validateOAuthState,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
} from "./dropbox-auth";

describe("OAuth state management", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores and retrieves OAuth state", () => {
    const state = "test-state-123";

    storeOAuthState(state);
    const retrieved = getStoredOAuthState();

    expect(retrieved).toBe(state);
  });

  it("clears OAuth state", () => {
    storeOAuthState("state-to-clear");

    clearOAuthState();
    const retrieved = getStoredOAuthState();

    expect(retrieved).toBeNull();
  });
});

describe("code verifier management", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores and retrieves code verifier", () => {
    const verifier = "test-verifier-abc123";

    storeCodeVerifier(verifier);
    const retrieved = getStoredCodeVerifier();

    expect(retrieved).toBe(verifier);
  });

  it("clears code verifier", () => {
    storeCodeVerifier("verifier-to-clear");

    clearCodeVerifier();
    const retrieved = getStoredCodeVerifier();

    expect(retrieved).toBeNull();
  });
});

describe("buildAuthUrl", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("includes state parameter in URL and stores it", async () => {
    const url = await buildAuthUrl();
    const parsedUrl = new URL(url);
    const stateInUrl = parsedUrl.searchParams.get("state");
    const storedState = getStoredOAuthState();

    expect(stateInUrl).not.toBeNull();
    expect(stateInUrl).toHaveLength(32);
    expect(storedState).toBe(stateInUrl);
  });
});

describe("validateOAuthState", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns true when state matches stored state", () => {
    const state = "valid-state-123";
    storeOAuthState(state);

    const result = validateOAuthState(state);

    expect(result).toBe(true);
  });

  it("returns false when state does not match", () => {
    storeOAuthState("stored-state");

    const result = validateOAuthState("different-state");

    expect(result).toBe(false);
  });

  it("returns false when no stored state exists", () => {
    const result = validateOAuthState("some-state");

    expect(result).toBe(false);
  });

  it("does not clear stored state after validation", () => {
    storeOAuthState("state-to-validate");

    validateOAuthState("state-to-validate");
    const storedAfter = getStoredOAuthState();

    expect(storedAfter).toBe("state-to-validate");
  });
});

describe("exchangeCodeForTokens", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("throws error when no code verifier is stored", async () => {
    await expect(exchangeCodeForTokens("some-code")).rejects.toThrow(
      "No code verifier found",
    );
  });

  it("exchanges code for tokens successfully", async () => {
    const mockTokenResponse = {
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_in: 14400,
      token_type: "bearer",
      account_id: "dbid:test-account",
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockTokenResponse), { status: 200 }),
    );
    storeCodeVerifier("test-verifier");

    const result = await exchangeCodeForTokens("auth-code");

    expect(result).toEqual(mockTokenResponse);
  });

  it("clears code verifier after successful exchange", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "token" }), { status: 200 }),
    );
    storeCodeVerifier("verifier-to-clear");

    await exchangeCodeForTokens("auth-code");

    expect(getStoredCodeVerifier()).toBeNull();
  });

  it("throws error when API returns error response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("invalid_grant", { status: 400 }),
    );
    storeCodeVerifier("test-verifier");

    await expect(exchangeCodeForTokens("bad-code")).rejects.toThrow(
      "Token exchange failed: invalid_grant",
    );
  });
});

describe("refreshAccessToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshes access token successfully", async () => {
    const mockTokenResponse = {
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      expires_in: 14400,
      token_type: "bearer",
      account_id: "dbid:test-account",
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockTokenResponse), { status: 200 }),
    );

    const result = await refreshAccessToken("old-refresh-token");

    expect(result).toEqual(mockTokenResponse);
  });

  it("throws error when API returns error response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("invalid_grant", { status: 400 }),
    );

    await expect(refreshAccessToken("expired-token")).rejects.toThrow(
      "Token refresh failed: invalid_grant",
    );
  });
});

describe("revokeToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls Dropbox token revoke endpoint", async () => {
    const mockFetch = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    const accessToken = "test-access-token";

    await revokeToken(accessToken);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.dropboxapi.com/2/auth/token/revoke",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
  });
});
