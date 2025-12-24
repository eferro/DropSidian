# DropSidian Testing Plan

## Overview

This document outlines the test coverage strategy for DropSidian, prioritizing code by risk and production impact.

## Current Status

| Metric | Value |
|--------|-------|
| Total Tests | 90 |
| Statement Coverage | 91.43% |
| Branch Coverage | 95.82% |

## Coverage by Layer

| Layer | Coverage | Status |
|-------|----------|--------|
| `src/lib/` | 100% | ✅ Complete |
| `src/context/` | 100% | ✅ Complete |
| `src/components/` | 100% | ✅ Complete |
| `src/pages/` | 96.38% | ✅ Complete |
| `src/App.tsx` | Partial | ✅ Routing tested |

---

## Priority Tiers

### Tier 1 — High Risk / Core Logic ✅ COMPLETED

Critical business logic that must be tested first.

| File | Coverage | Tests |
|------|----------|-------|
| `lib/token-storage.ts` | 100% | 4 |
| `lib/dropbox-auth.ts` | 100% | 16 |
| `lib/dropbox-client.ts` | 100% | 11 |
| `lib/pkce.ts` | 100% | 1 |
| `lib/vault-storage.ts` | 100% | 3 |
| `context/AuthContext.tsx` | 100% | 7 |

### Tier 2 — Medium Risk / User Flows ✅ COMPLETED

User-facing flows with error handling.

| File | Coverage | Tests |
|------|----------|-------|
| `pages/Callback.tsx` | 86.17% | 6 |
| `components/VaultSelector.tsx` | 100% | 6 |

### Tier 3 — Lower Risk / Presentation ✅ COMPLETED

Display-only components with minimal logic.

| File | Coverage | Tests |
|------|----------|-------|
| `components/AccountInfo.tsx` | 100% | 4 |
| `components/FileList.tsx` | 100% | 7 |
| `components/NotePreview.tsx` | 100% | 7 |
| `pages/Home.tsx` | 0% | Deferred - orchestration only |

### Tier 4 — Simple Components ✅ COMPLETED

Originally deferred but now tested for completeness.

| File | Coverage | Tests |
|------|----------|-------|
| `pages/NotFound.tsx` | 100% | 2 |
| `components/ConnectDropboxButton.tsx` | 100% | 2 |
| `pages/Home.tsx` | 100% | 7 |

### Tier 5 — App Routing ✅ COMPLETED

| File | Coverage | Tests |
|------|----------|-------|
| `App.tsx` | Partial | 5 (routing tests) |

### Tier 6 — Intentionally Not Tested

| File | Reason |
|------|--------|
| Config files (`vite.config.ts`, etc.) | Infrastructure, excluded from coverage |

---

## Test Implementation Details

### Phase 1: `lib/dropbox-auth.ts` ✅

**Tests implemented:**

1. `storeOAuthState` / `getStoredOAuthState` — stores and retrieves state
2. `clearOAuthState` — removes state from storage
3. `storeCodeVerifier` / `getStoredCodeVerifier` — verifier management
4. `clearCodeVerifier` — removes verifier
5. `buildAuthUrl` — includes state parameter and stores it
6. `validateOAuthState` — validates matching state, returns false on mismatch
7. `exchangeCodeForTokens` — happy path with mocked fetch
8. `exchangeCodeForTokens` — throws when no verifier
9. `exchangeCodeForTokens` — throws on API error
10. `exchangeCodeForTokens` — clears verifier after success
11. `refreshAccessToken` — happy path
12. `refreshAccessToken` — throws on API error
13. `revokeToken` — calls revoke endpoint

### Phase 2: `lib/token-storage.ts` ✅

**Tests implemented:**

1. `storeRefreshToken` / `getRefreshToken` — stores and retrieves token
2. `getRefreshToken` — returns null when empty
3. `clearRefreshToken` — removes token
4. Token overwrite behavior

**Note:** Uses `fake-indexeddb` for IndexedDB mocking.

### Phase 3: `lib/dropbox-client.ts` ✅

**Tests implemented:**

1. `getCurrentAccount` — returns account data on success
2. `getCurrentAccount` — throws on API failure
3. `listFolder` — returns entries on success
4. `listFolder` — sends empty path for root folder
5. `listFolder` — throws on API failure
6. `listFolderContinue` — continues listing with cursor
7. `listFolderContinue` — throws on API failure
8. `listAllFiles` — returns all entries when no pagination needed
9. `listAllFiles` — collects all entries when pagination required
10. `downloadFile` — returns content on success
11. `downloadFile` — throws on API failure

### Phase 4: `context/AuthContext.tsx` ✅

**Tests implemented:**

1. Initial loading state
2. Sets authenticated to false when no refresh token
3. Auto-refreshes token on mount
4. Clears tokens when refresh fails
5. `setTokens` updates state and persists
6. `logout` clears tokens and revokes access token
7. `useAuth` throws when used outside provider

### Phase 5: `lib/vault-storage.ts` ✅

**Tests implemented:**

1. `storeVaultPath` / `getVaultPath` — stores and retrieves path
2. `getVaultPath` — returns null when empty
3. `clearVaultPath` — removes path

### Phase 6: Components ✅

#### `VaultSelector.tsx`

1. Renders form when no saved vault path exists
2. Shows saved vault path when one exists
3. Calls `onVaultSelected` when submitting new path
4. Normalizes path by adding leading slash
5. Allows changing vault when clicking change button
6. Does not submit when path is empty

#### `Callback.tsx`

1. Shows error when no authorization code received
2. Shows error when OAuth returns error
3. Shows error when state is invalid (CSRF protection)
4. Exchanges code for tokens on valid callback
5. Shows error when token exchange fails
6. Shows processing state while exchanging tokens

### Phase 7: Tier 3 Components ✅

#### `AccountInfo.tsx`

1. Shows loading state initially
2. Shows account info on success
3. Shows error on failure
4. Renders nothing when no access token

#### `FileList.tsx`

1. Shows loading state initially
2. Shows markdown files on success
3. Filters to show only markdown files
4. Shows empty state when no markdown files
5. Calls `onFileSelect` when clicking file
6. Shows error on failure
7. Does not load when no access token

#### `NotePreview.tsx`

1. Shows loading state initially
2. Shows note content on success
3. Removes `.md` extension from title
4. Shows error on failure
5. Calls `onClose` when clicking close button
6. Shows close button on error state
7. Does not load when no access token

### Phase 8: Tier 4 Components ✅

#### `ConnectDropboxButton.tsx`

1. Renders connect button
2. Redirects to auth URL when clicked

#### `NotFound.tsx`

1. Renders 404 message
2. Shows link to home page

#### `Home.tsx`

1. Shows loading state when auth is loading
2. Shows connect button when not authenticated
3. Shows authenticated view with vault selector
4. Calls logout when disconnect button is clicked
5. Shows file list after vault is selected
6. Shows note preview after file is selected
7. Hides note preview when close is clicked

---

## Testing Patterns

### Mocking External Dependencies

```typescript
// Mocking fetch for API calls
vi.spyOn(global, 'fetch').mockResolvedValue(
  new Response(JSON.stringify(mockData), { status: 200 })
)

// Mocking modules
vi.mock('../lib/token-storage', () => ({
  storeRefreshToken: vi.fn(),
  getRefreshToken: vi.fn(),
  clearRefreshToken: vi.fn(),
}))
```

### Testing React Components

```typescript
// With React Testing Library
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('handles user interaction', async () => {
  const user = userEvent.setup()
  render(<Component />)
  
  await user.click(screen.getByRole('button'))
  
  await waitFor(() => {
    expect(screen.getByText('Expected')).toBeInTheDocument()
  })
})
```

### Testing IndexedDB

```typescript
import 'fake-indexeddb/auto'

beforeEach(async () => {
  await clearRefreshToken().catch(() => {})
})
```

### Testing with Router

```typescript
import { MemoryRouter } from 'react-router-dom'

function renderWithRouter(searchParams: string) {
  return render(
    <MemoryRouter initialEntries={[`/callback${searchParams}`]}>
      <Component />
    </MemoryRouter>
  )
}
```

---

## Running Tests

```bash
# Run all tests once
make test

# Run tests in watch mode (TDD)
make test-watch

# Run tests with coverage report
make test-coverage

# Run full validation (lint + type-check + test)
make validate
```

---

## Future Test Additions

If coverage needs to increase beyond current levels, consider:

### Remaining Untested File

```
App.tsx (E2E candidate)
├── Handles OAuth redirect from query params
├── Routes to correct pages
└── Wraps app in AuthProvider
```

### Integration Tests (E2E)

For full user flow testing:

1. Complete OAuth flow with mocked Dropbox API
2. Vault selection and persistence
3. File browsing and note preview
4. Logout flow

---

## Validation Checklist

Before committing:

1. ✅ `make test` — all tests pass
2. ✅ `make lint` — no lint errors
3. ✅ `make type-check` — no type errors
4. ✅ `make validate` — all checks pass

Target: Maintain >70% statement coverage on core logic (`lib/`, `context/`, critical pages).
