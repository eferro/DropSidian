# DropSidian — Implementation Plan

> Detailed technical implementation plan following TDD and baby steps.

---

## Overview

| Phase | Goal | Status |
|-------|------|--------|
| H0.0 | Repo + GitHub Pages "Hello world" | ✅ Completed |
| H0.1 | Dropbox OAuth PKCE | ✅ Completed |
| H0.2 | Persist session + logout | ✅ Completed |
| H0.3 | Vault file access proof | ✅ Completed |
| H1 | Browse + Read | ✅ Completed |
| H2 | Create note (Inbox) | ✅ Completed |
| H3 | Edit + Save | ✅ Completed |
| H4 | Wikilinks | ✅ Completed |
| H5 | Attachments | ✅ Completed |
| H6 | Search | 🔄 H6.1 Done |

---

# 🍔 Phase 0 — Deploy + Dropbox Proof

## H0.0 — Repo + GitHub Pages "Hello world"

### H0.0.1 — Create Vite React TS project

**Goal:** Working local dev environment with TypeScript.

**Tasks:**
1. Initialize Vite project with React + TypeScript template
2. Configure strict TypeScript (`tsconfig.json`)
3. Create Makefile with development commands
4. Add `.gitignore` for Node.js projects
5. Verify `make dev` works locally

**Technical details:**
```bash
npm create vite@latest . -- --template react-ts
```

**Makefile targets:**
- `make dev` — Start dev server
- `make build` — Production build
- `make preview` — Preview production build
- `make lint` — Run ESLint
- `make type-check` — Run TypeScript compiler
- `make validate` — Run all checks

**Files to create/modify:**
- `package.json`
- `tsconfig.json` (strict mode)
- `vite.config.ts`
- `Makefile`
- `src/App.tsx` (simple "Hello DropSidian")
- `src/main.tsx`
- `index.html`

**Validation:**
- [ ] `make dev` starts server on localhost
- [ ] Browser shows "Hello DropSidian"
- [ ] `make validate` passes with zero errors

---

### H0.0.2 — GitHub Actions for Pages deployment

**Goal:** Automatic deploy to GitHub Pages on push to main.

**Tasks:**
1. Create `.github/workflows/deploy.yml`
2. Configure Vite base path for GitHub Pages
3. Push to main and verify deployment

**Technical details:**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

`vite.config.ts` update:
```typescript
export default defineConfig({
  base: '/DropSidian/',  // repo name
  plugins: [react()],
})
```

**Validation:**
- [ ] Push to main triggers workflow
- [ ] `https://<user>.github.io/DropSidian/` shows "Hello DropSidian"
- [ ] Subsequent pushes redeploy correctly

---

### H0.0.3 — Hash router scaffold

**Goal:** SPA routing that works with GitHub Pages (no 404 on refresh).

**Tasks:**
1. Install react-router-dom
2. Configure HashRouter
3. Create basic route structure
4. Test refresh behavior

**Technical details:**
```bash
npm install react-router-dom
```

**Router structure:**
```typescript
<HashRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/callback" element={<Callback />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</HashRouter>
```

**Files to create/modify:**
- `src/App.tsx` — HashRouter setup
- `src/pages/Home.tsx` — Landing page
- `src/pages/Callback.tsx` — OAuth callback (placeholder)
- `src/pages/NotFound.tsx` — 404 page

**Validation:**
- [ ] Navigate to `/#/` works
- [ ] Refresh on `/#/callback` doesn't 404
- [ ] Unknown routes show NotFound

---

## H0.1 — Dropbox OAuth PKCE

### H0.1.1 — Create Dropbox app

**Goal:** Dropbox developer app configured for OAuth PKCE.

**Tasks:**
1. Go to https://www.dropbox.com/developers/apps
2. Create new app (scoped access, full Dropbox or app folder)
3. Configure OAuth settings:
   - Add redirect URI: `https://<user>.github.io/DropSidian/#/callback`
   - Add redirect URI: `http://localhost:5173/#/callback` (dev)
4. Note App Key (no secret needed for PKCE)

**Required scopes:**
- `files.metadata.read`
- `files.content.read`
- `files.content.write`
- `account_info.read`

**Validation:**
- [ ] App created in Dropbox console
- [ ] Redirect URIs configured
- [ ] App Key obtained

---

### H0.1.2 — "Connect Dropbox" button

**Goal:** UI button that starts OAuth flow.

**Tasks:**
1. Create PKCE code verifier + challenge utilities
2. Create Dropbox auth URL builder
3. Create "Connect Dropbox" button component
4. Store code verifier in sessionStorage before redirect

**Technical details:**

PKCE utilities:
```typescript
// Generate random code verifier (43-128 chars)
function generateCodeVerifier(): string

// SHA-256 hash, base64url encoded
async function generateCodeChallenge(verifier: string): Promise<string>
```

Auth URL:
```
https://www.dropbox.com/oauth2/authorize?
  client_id={APP_KEY}
  &response_type=code
  &code_challenge={challenge}
  &code_challenge_method=S256
  &redirect_uri={REDIRECT_URI}
  &token_access_type=offline
```

**Files to create:**
- `src/lib/pkce.ts` — PKCE utilities
- `src/lib/dropbox-auth.ts` — Auth URL builder
- `src/components/ConnectDropboxButton.tsx`

**Validation:**
- [ ] Click button redirects to Dropbox
- [ ] Code verifier stored in sessionStorage
- [ ] Auth page shows correct app name

---

### H0.1.3 — OAuth callback + token exchange

**Goal:** Handle callback and exchange code for tokens.

**Tasks:**
1. Parse authorization code from callback URL
2. Exchange code for tokens (POST to Dropbox)
3. Store access token in memory
4. Update UI to show "Connected"

**Technical details:**

Token exchange (no CORS, so we need to use Dropbox's token endpoint):
```typescript
POST https://api.dropboxapi.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

code={code}
&grant_type=authorization_code
&code_verifier={verifier}
&client_id={APP_KEY}
&redirect_uri={REDIRECT_URI}
```

Response:
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 14400,
  "token_type": "bearer",
  "account_id": "..."
}
```

**Files to create/modify:**
- `src/lib/dropbox-auth.ts` — Token exchange
- `src/pages/Callback.tsx` — Handle callback
- `src/context/AuthContext.tsx` — Auth state management

**Validation:**
- [ ] Callback receives code
- [ ] Token exchange succeeds
- [ ] UI shows "Connected" after callback

---

### H0.1.4 — Display account info

**Goal:** Prove API access works by showing user email.

**Tasks:**
1. Create Dropbox API client wrapper
2. Call `/users/get_current_account`
3. Display account email in UI

**Technical details:**
```typescript
POST https://api.dropboxapi.com/2/users/get_current_account
Authorization: Bearer {access_token}
```

**Files to create:**
- `src/lib/dropbox-client.ts` — API client
- `src/components/AccountInfo.tsx` — Display component

**Validation:**
- [ ] API call succeeds
- [ ] Email displayed correctly
- [ ] Works on GitHub Pages

---

## H0.2 — Persist Session + Logout

### H0.2.1 — Store refresh token in IndexedDB

**Goal:** Persist auth across browser sessions.

**Tasks:**
1. Create IndexedDB wrapper for token storage
2. Store refresh token after OAuth
3. Keep access token in memory only

**Technical details:**
```typescript
// IndexedDB store
interface TokenStore {
  refreshToken: string;
  expiresAt: number;  // for refresh token expiry
}
```

**Files to create:**
- `src/lib/token-storage.ts` — IndexedDB wrapper

**Validation:**
- [ ] Refresh token persisted after login
- [ ] Access token NOT in IndexedDB (security)

---

### H0.2.2 — Restore session on reload

**Goal:** Auto-login using stored refresh token.

**Tasks:**
1. Check IndexedDB on app load
2. If refresh token exists, exchange for new access token
3. Update auth state

**Technical details:**
```typescript
POST https://api.dropboxapi.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={refresh_token}
&client_id={APP_KEY}
```

**Validation:**
- [ ] Reload page keeps user logged in
- [ ] No re-auth prompt needed
- [ ] Access token refreshed automatically

---

### H0.2.3 — Logout

**Goal:** Clean logout with token revocation.

**Tasks:**
1. Revoke token via Dropbox API (optional, best effort)
2. Clear IndexedDB
3. Clear in-memory tokens
4. Redirect to home

**Technical details:**
```typescript
POST https://api.dropboxapi.com/2/auth/token/revoke
Authorization: Bearer {access_token}
```

**Files to modify:**
- `src/lib/dropbox-auth.ts` — Add revoke
- `src/context/AuthContext.tsx` — Logout action

**Validation:**
- [ ] Logout clears all tokens
- [ ] Reload requires re-auth
- [ ] Clean UX transition

---

## H0.3 — Vault File Access Proof

### H0.3.1 — Select vault root folder

**Goal:** User picks their Obsidian vault folder.

**Tasks:**
1. Create folder path input (MVP: text input)
2. Persist selected path in localStorage
3. Display current vault path

**Technical details:**
- MVP: Simple text input for path (e.g., `/Obsidian/MyVault`)
- Later: Could use Dropbox Chooser or custom folder browser

**Files to create:**
- `src/components/VaultSelector.tsx`
- `src/lib/vault-storage.ts` — Persist vault path

**Validation:**
- [ ] User can input vault path
- [ ] Path persisted across reloads
- [ ] Path displayed in UI

---

### H0.3.2 — List folder contents

**Goal:** Prove we can read the vault structure.

**Tasks:**
1. Call `files/list_folder` API
2. Display file/folder entries
3. Show count of items

**Technical details:**
```typescript
POST https://api.dropboxapi.com/2/files/list_folder
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "path": "/Obsidian/MyVault",
  "recursive": false,
  "include_media_info": false
}
```

**Files to create/modify:**
- `src/lib/dropbox-client.ts` — Add listFolder
- `src/components/FileList.tsx` — Display component

**Validation:**
- [ ] API returns folder contents
- [ ] UI shows file names
- [ ] Count matches Dropbox web UI

---

### H0.3.3 — Download and preview one markdown file

**Goal:** Prove we can read actual note content.

**Tasks:**
1. Click on `.md` file in list
2. Download file content
3. Display raw markdown

**Technical details:**
```typescript
POST https://content.dropboxapi.com/2/files/download
Authorization: Bearer {access_token}
Dropbox-API-Arg: {"path": "/Obsidian/MyVault/note.md"}
```

Note: Response body IS the file content.

**Files to create/modify:**
- `src/lib/dropbox-client.ts` — Add downloadFile
- `src/components/NotePreview.tsx` — Display content

**Validation:**
- [ ] Click downloads file
- [ ] Content displayed correctly
- [ ] UTF-8 encoding works

---

# 🍔 Phase 1 — Minimal Usable App

## H1 — Browse + Read

### H1.1 — Markdown file list

**Goal:** Clean list of markdown files only.

**Tasks:**
1. Filter list to `.md` files only
2. Recursive listing (paginated)
3. Clean UI with file names (no extension)

**Technical details:**
- Use `list_folder` with `recursive: true`
- Handle pagination via `cursor`
- Cache file list

**Validation:**
- [ ] Only `.md` files shown
- [ ] All vault files listed
- [ ] Performance acceptable

---

### H1.2 — Rendered markdown view

**Goal:** Read notes with formatted markdown.

**Tasks:**
1. Install markdown renderer (e.g., react-markdown)
2. Basic styling for markdown elements
3. Handle common Obsidian syntax

**Technical details:**
```bash
npm install react-markdown remark-gfm
```

**Validation:**
- [ ] Headers, lists, code blocks render
- [ ] GFM (tables, checkboxes) works
- [ ] Links clickable

---

## H2 — Create Note (Inbox)

### H2.1 — New note modal

**Goal:** Quick capture interface.

**Tasks:**
1. Floating action button
2. Modal with title (optional) + body
3. Auto-generate filename from title or timestamp

**Technical details:**
- Filename: `{title}.md` or `{timestamp}.md`
- Frontmatter: optional, start simple

**Validation:**
- [ ] Modal opens/closes
- [ ] Can submit with just body
- [ ] Filename generated correctly

---

### H2.2 — Upload to Inbox folder

**Goal:** Create file in Dropbox.

**Tasks:**
1. Configure Inbox path (e.g., `/Inbox`)
2. Upload file via `files/upload`
3. Confirm creation

**Technical details:**
```typescript
POST https://content.dropboxapi.com/2/files/upload
Authorization: Bearer {access_token}
Dropbox-API-Arg: {"path": "/Obsidian/MyVault/Inbox/note.md", "mode": "add"}
Content-Type: application/octet-stream

{file content}
```

**Validation:**
- [ ] File created in Dropbox
- [ ] Visible in Obsidian desktop
- [ ] Appears in web file list

---

# 🍔 Phase 2 — Edit + Save

## H3 — Edit Existing Note

### H3.1 — Raw markdown editor

**Goal:** Edit mode for notes.

**Tasks:**
1. Toggle view/edit mode
2. Textarea for markdown
3. Preview alongside (optional)

**Validation:**
- [ ] Toggle works
- [ ] Content editable
- [ ] Changes local until save

---

### H3.2 — Save with rev (conflict prevention)

**Goal:** Safe updates using Dropbox revision.

**Tasks:**
1. Track file `rev` from download
2. Use `mode: update` with `rev`
3. Handle success

**Technical details:**
```typescript
POST https://content.dropboxapi.com/2/files/upload
Dropbox-API-Arg: {
  "path": "...",
  "mode": {".tag": "update", "update": "{rev}"}
}
```

**Validation:**
- [ ] Save updates file
- [ ] `rev` sent correctly
- [ ] Obsidian sees changes

---

### H3.3 — Conflict detection

**Goal:** Handle concurrent edits.

**Tasks:**
1. Catch 409 conflict error
2. Show user-friendly message
3. Offer to reload

**Validation:**
- [ ] Conflict detected
- [ ] Clear error message
- [ ] Recovery path works

---

# 🍔 Phase 3 — Obsidian Navigation + Attachments

## H4 — Wikilinks

### H4.1 — Build title→path index

**Goal:** Map note titles to file paths.

**Tasks:**
1. Extract titles from file list
2. Build lookup map
3. Cache in memory

**Validation:**
- [ ] Index built on load
- [ ] Titles correctly extracted
- [ ] Duplicates handled

---

### H4.2 — Resolve and navigate wikilinks

**Goal:** `[[Note]]` links work.

**Tasks:**
1. Parse wikilinks in markdown
2. Resolve: same folder first, then global
3. Navigate on click

**Technical details:**
- Regex: `\[\[([^\]]+)\]\]`
- Resolution order: same folder → first global match

**Validation:**
- [ ] Wikilinks parsed
- [ ] Click navigates
- [ ] Missing links indicated

---

## H5 — Attachments

### H5.1 — Upload attachment

**Goal:** Add images/PDFs to notes.

**Tasks:**
1. File picker
2. Upload to same directory as note
3. Return path for embed

**Validation:**
- [ ] Upload succeeds
- [ ] File in correct location
- [ ] Path usable

---

### H5.2 — Insert embed syntax

**Goal:** Add `![[file]]` to note.

**Tasks:**
1. Insert at cursor position
2. Use Obsidian embed syntax
3. Save note

**Validation:**
- [ ] Syntax inserted
- [ ] Obsidian recognizes embed

---

### H5.3 — Render embeds

**Goal:** Show images/PDFs inline.

**Tasks:**
1. Parse `![[file]]` syntax
2. Resolve to Dropbox URL
3. Render image or PDF viewer

**Validation:**
- [ ] Images display
- [ ] PDFs accessible
- [ ] Performance acceptable

---

# 🍔 Phase 4 — Search

## H6 — Search

### H6.1 — Title search

**Goal:** Instant search by note title.

**Tasks:**
1. Search input
2. Filter by title (client-side)
3. Show results instantly

**Validation:**
- [ ] Fast filtering
- [ ] Results accurate
- [ ] UX smooth

---

### H6.2 — Content search

**Goal:** Search within note content.

**Tasks:**
1. Build content index (lazy)
2. Search indexed content
3. Progressive improvement

**Technical details:**
- Start with recently viewed notes
- Index on demand
- Consider Web Workers

**Validation:**
- [ ] Content searchable
- [ ] Performance acceptable
- [ ] Results ranked

---

# Appendix

## Tech Stack

| Category | Choice |
|----------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | react-router-dom (HashRouter) |
| State | React Context + useState |
| Storage | IndexedDB (tokens), localStorage (settings) |
| Markdown | react-markdown + remark-gfm |
| Testing | Vitest + Testing Library |
| Styling | CSS Modules or Tailwind (TBD) |

## Environment Variables

```env
VITE_DROPBOX_APP_KEY=your_app_key
VITE_REDIRECT_URI=https://user.github.io/DropSidian/#/callback
```

## Project Structure

```
src/
├── components/        # UI components
├── context/          # React contexts (Auth, Vault)
├── lib/              # Utilities (PKCE, Dropbox client, storage)
├── pages/            # Route pages
├── types/            # TypeScript types
├── App.tsx
└── main.tsx
```

