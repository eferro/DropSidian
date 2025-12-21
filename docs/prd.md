# PRD — DropSidian

> **DropSidian** = Dropbox + Obsidian — A frontend-only Obsidian web client backed by Dropbox

## Product Goal
A static web app (GitHub Pages) that lets a user **read quickly**, **create new notes into an Obsidian Inbox**, **edit notes**, and **attach images/PDFs**, using a **Dropbox folder as the vault storage**, with **Obsidian-compatible** links and embeds.

## Top Priority (delivery)
1) **Deploy to GitHub Pages ASAP**  
2) **Prove Dropbox integration ASAP (OAuth PKCE + one real API call + one real file read)**  
3) Then iterate in tiny, validated slices.

---

## Decisions (locked)
- Frontend-only (no backend).
- Hosting: GitHub Pages at `https://<user>.github.io/<repo>/`.
- Routing: hash routing (`/#/...`).
- Dropbox auth: OAuth 2.0 **Authorization Code + PKCE** (no client secret).
- Session: “Remember me” enabled (refresh token stored in IndexedDB).
- Vault root: user selects once (picker) and it’s persisted.
- Attachments: stored in the **same directory as the note** (Inbox applies to note creation only).
- Editor: Markdown raw + Preview.
- Save: manual.
- Frontmatter: preserved as-is.
- Wikilinks resolution: same folder → first global match.
- Search: titles + content, progressive.

---

# Iterative Delivery Plan — Hamburger Method (micro vertical slices)

Each “burger” is a **tiny vertical slice**:
- **UI** (thin top bun)
- **Logic** (patty)
- **Integration** (bottom bun)
…and must be **deployable + verifiable**.

---

# 🍔 Phase 0 — “Deploy + Dropbox proof” as early as possible

## H0.0 — Repo + GitHub Pages “Hello world”
**Goal:** confirm CI/CD and Pages work first.

### Tasks
0.0.1 Create repo + Vite React TS project  
- Validate: `npm run dev` locally shows the page.

0.0.2 Add GitHub Pages deployment (GitHub Actions)  
- Validate: push to `main` deploys to `https://<user>.github.io/<repo>/` and shows “Hello”.

0.0.3 Add hash router scaffold (even if unused yet)  
- Validate: refresh doesn’t 404.

**Definition of done:** public URL works, redeploy works, refresh works.

---

## H0.1 — Dropbox OAuth PKCE on GitHub Pages (minimal)
**Goal:** prove OAuth works *in production URL*.

### Tasks
0.1.1 Create Dropbox app (scoped to a single folder / minimal scope)  
- Validate: app created in Dropbox console.

0.1.2 Implement “Connect Dropbox” button  
- Validate: clicking redirects to Dropbox auth.

0.1.3 Implement OAuth callback route and token exchange (PKCE)  
- Validate: returns to app and shows “Connected”.

0.1.4 Call `/users/get_current_account` and display account email  
- Validate: UI displays correct email consistently.

**Definition of done:** from GitHub Pages URL, you can login, land back, and see your account info.

---

## H0.2 — Persist session (remember me) + logout
**Goal:** have a usable auth foundation before building features.

### Tasks
0.2.1 Store refresh token in IndexedDB (and access token in memory)  
- Validate: refresh token exists after login.

0.2.2 Restore session on page reload  
- Validate: reload page keeps you logged in without re-auth.

0.2.3 Implement logout (revoke token if available + clear storage)  
- Validate: logout forces re-auth.

**Definition of done:** stable session on GitHub Pages, with clean logout.

---

## H0.3 — Prove vault file access with the smallest possible read
**Goal:** verify we can touch the user’s vault *before* building UI.

### Tasks
0.3.1 “Select vault root folder” (Dropbox picker OR manual path input MVP)
- Validate: stored `vaultRootPath` is persisted and shown.

0.3.2 List folder once (`files/list_folder`, non-recursive)  
- Validate: show count + first 10 entries.

0.3.3 Download one markdown file (`files/download`) and show plain text preview  
- Validate: you see real note content.

**Definition of done:** from GitHub Pages, you can select a folder, list it, and read a real `.md`.

> At this point the integration is proven end-to-end: Deploy ✅ OAuth ✅ Session ✅ Read file ✅

---

# 🍔 Phase 1 — Minimal usable app (reading + inbox creation)

## H1 — Browse + Read (fast)
1.1 Render a simple file list (markdown only)  
- Validate: list matches vault.

1.2 Click → read markdown (rendered)  
- Validate: basic markdown displays.

---

## H2 — Create note (Inbox) — keep-like capture
2.1 “New note” modal (title optional + body)  
- Validate: you can create without a title.

2.2 Upload new file to Inbox (Inbox path placeholder config)  
- Validate: note appears in Dropbox and in Obsidian desktop.

---

# 🍔 Phase 2 — Edit + Save (safe update)
## H3 — Edit existing note
3.1 Toggle “Edit” → raw markdown editor  
- Validate: edit in UI.

3.2 Save with `rev` update  
- Validate: change appears in Obsidian desktop.

3.3 Conflict message if rev mismatch  
- Validate: you see a clear conflict warning.

---

# 🍔 Phase 3 — Obsidian navigation + attachments
## H4 — Wikilinks
4.1 Build minimal title→path index  
- Validate: index exists.

4.2 Resolve `[[Note]]` same folder → fallback global  
- Validate: click navigates.

## H5 — Attach images/PDFs
5.1 Upload attachment to same directory as note  
- Validate: file uploaded.

5.2 Insert `![[file.ext]]` into note  
- Validate: Obsidian recognizes embed.

5.3 Render image inline + PDF embed/link  
- Validate: appears in web view.

---

# 🍔 Phase 4 — Search (progressive)
## H6 — Search titles then content
6.1 Title search (instant)  
- Validate: fast results.

6.2 Content search (lazy indexed)  
- Validate: improves over time, remains usable.

---

# Validation Checklist (applies to every task)
For each task/subtask, do:
- ✅ Local dev check
- ✅ Deploy check (GitHub Pages URL)
- ✅ Happy path verified
- ✅ One failure case verified (if relevant)
- ✅ Notes in Obsidian desktop remain consistent

---

# Immediate “First Steps” (optimized for fastest GitHub Pages + Dropbox proof)

## Day 1: deploy + OAuth proof
A) H0.0.1–H0.0.3 (Pages working)  
B) H0.1.1–H0.1.4 (OAuth + show account email)

## Day 2: session + vault read proof
C) H0.2.1–H0.2.3 (remember session + logout)  
D) H0.3.1–H0.3.3 (select folder + list + download one note)

If you complete H0.3, you’ve validated the entire product’s highest risks.

---

## Open items to decide during development (not blocking Phase 0)
- Inbox folder actual name/path (we’ll inspect your vault when building H2)
- Note naming edge cases (duplicates, invalid filename chars)
