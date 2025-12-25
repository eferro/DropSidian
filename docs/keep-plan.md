# PRD — Configurable Inbox Folder + Keep-like Inbox UX (Obsidian Vault on Dropbox)

## 0) Context / Current Goal
You already have:
- A frontend-only app deployed to **GitHub Pages**
- **Dropbox OAuth PKCE** integration working
- Ability to access a vault folder in Dropbox (vault root already selectable)

Now you want:
1) The user can select a **subdirectory inside the vault** to act as **Inbox**
2) The app works like **Google Keep** for that Inbox:
   - Show Inbox notes as **cards** (grid)
   - Fast note creation (title optional)
   - Open note in a modal
   - Edit + manual save (markdown raw + preview)
   - All new notes are stored in Inbox

This PRD defines this feature and provides an incremental delivery plan.

---

## 1) Product Objective
Deliver a Keep-like experience focused on **capture-first** and **quick browsing** of Inbox notes, while keeping:
- vault integrity (Obsidian-compatible markdown)
- Dropbox as storage
- frontend-only architecture (GitHub Pages)
- iterative delivery in tiny validated increments

---

## 2) Scope
### In scope
- Select Inbox folder (subdirectory within vault)
- Persist Inbox configuration (client-side)
- List inbox notes (markdown files)
- Keep-like cards grid UI
- Create new notes (saved into Inbox folder)
- Open / read note
- Edit / save note (manual, safe update using Dropbox rev)
- Minimal conflict handling (message)

### Out of scope (for this feature)
- Full vault explorer/navigation
- Attachments (images/PDFs) — later feature
- Labels/tags
- Pin/Archive/Trash
- Collaboration
- Rich editor / WYSIWYG
- Advanced search/filtering

---

## 3) UX Reference (Google Keep)
This feature intentionally imitates Keep’s core UX:
- Always-visible entrypoint for capture: “Take a note…”
- Notes are displayed as **cards** with preview
- Click opens note in a **modal/dialog**
- Close action typically saves
- Minimal navigation (stay on the same screen)

We implement only the minimal subset needed for:
- browse Inbox quickly
- capture new notes quickly

---

## 4) Requirements

### FR1 — Inbox folder configuration
**As a user**, I can select a folder inside the vault to be my Inbox so that new notes are created there and listed from there.

**Details**
- Setup required if inboxPath is missing
- Stored locally (e.g. localStorage or IndexedDB)
- Must be changeable via Settings

**Acceptance**
- I can select Inbox folder
- Refresh preserves it
- I can change it later

---

### FR2 — List Inbox notes
**As a user**, I can see notes stored inside the Inbox folder in a Keep-like view.

**Details**
- List `.md` files in inboxPath (non-recursive)
- Sort: `server_modified DESC` (latest first)
- Show cards grid

**Acceptance**
- I see all inbox notes
- Order matches last modified time
- List updates after creating a note

---

### FR3 — Create new note (capture-first)
**As a user**, I can create a new note quickly (title optional). The note is stored in Inbox.

**Details**
- Composer always visible
- Collapsed state: “Take a note…”
- Expanded state:
  - title (optional)
  - body
  - create/close/cancel
- Save rules:
  - If both title and body empty → discard
  - Otherwise create file in inboxPath
- File naming:
  - Prefer sanitized title (if exists)
  - Else derive from first words of body
  - Fallback: `Untitled`
  - Handle duplicates: add suffix ` (2)`, ` (3)` etc.

**Acceptance**
- I can create note without title
- Note file appears in Dropbox Inbox folder
- Note appears immediately as a card in UI
- Obsidian desktop sees it

---

### FR4 — Open and read note
**As a user**, I can open an Inbox note and read it quickly.

**Details**
- Clicking a card opens modal
- View mode renders markdown (basic)
- Frontmatter is preserved as-is (shown either raw or hidden behind a toggle)

**Acceptance**
- Modal opens quickly
- Content loads correctly
- Markdown rendering is correct enough for reading

---

### FR5 — Edit and save note
**As a user**, I can edit a note and save it manually.

**Details**
- Modal has Edit → Save flow
- Editor: raw markdown textarea/editor
- Save uses `rev` update mode to avoid overwriting remote edits
- On conflict:
  - show minimal warning
  - user can reload note (defer merge UI)

**Acceptance**
- Edits are saved to Dropbox
- Obsidian desktop shows changes
- Conflicts show an understandable error

---

## 5) UI Specification (MVP)

### Layout
- Top bar:
  - app title
  - settings icon (Inbox selection)
- Main:
  - Composer (capture UI)
  - Notes grid (cards)

### Composer
**Collapsed**
- single clickable row: “Take a note…”

**Expanded**
- title input (optional)
- body textarea
- actions:
  - `Close` → saves if not empty
  - `Cancel` → discards
  - `Create` → saves explicitly (optional)
- Keep-like behavior: `Close = Save`

### Notes Grid
- cards in responsive grid
- card shows:
  - title if present OR first line of body
  - preview snippet (truncate lines)
  - optional last modified timestamp

### Note Modal
- default: view mode (markdown render)
- actions:
  - `Edit`
  - `Save` (only in edit mode)
  - `Close`
- edit mode:
  - markdown editor
  - manual Save

---

## 6) Dropbox API + Data Model

### Required metadata per note
- path_display/path_lower
- name
- server_modified
- id (optional)
- rev (for saving)

### Calls
- List:
  - `files/list_folder` (path = inboxPath)
- Read:
  - `files/download` (path)
- Create:
  - `files/upload` (mode = add)
- Update:
  - `files/upload` (mode = update, with rev)

### Sorting
- Use `server_modified` descending.

---

## 7) Edge Cases
- Empty note in composer → discard
- Duplicate file names → add suffix
- Illegal filesystem chars → sanitize filename
- Large Inbox:
  - MVP: load first N (e.g. 100) + “Load more” later
- Conflicts:
  - MVP: show error with “Reload remote” option

---

## 8) Observability (MVP)
Track client-side events (console or lightweight):
- inbox_config_set
- inbox_list_loaded (count, ms)
- note_created
- note_opened
- note_saved
- save_conflict

(If you already have analytics hooks, wire these; otherwise log.)

---

# 9) Iterative Delivery Plan (Tiny Slices + Validation)

## Slice A — Inbox config (walking skeleton for this feature)
**A1. Settings UI: Select Inbox folder**
- A1.1 Add Settings button
- A1.2 Folder picker (Dropbox picker or manual path MVP)
- A1.3 Persist inboxPath
- Validate:
  - After selection, show current Inbox path on screen
  - Refresh keeps it

**A2. Change Inbox folder**
- A2.1 Allow re-select from Settings
- Validate:
  - Switching folder updates stored value

**Deploy after A1 and A2.**

---

## Slice B — List Inbox notes (metadata only)
**B1. Implement listInboxNotes(inboxPath)**
- B1.1 Call list_folder
- B1.2 Filter `.md`
- B1.3 Sort by server_modified desc
- Validate:
  - count shown + first N items

**B2. Render as basic list**
- Validate:
  - visible names, correct ordering

**B3. Render as cards grid**
- Validate:
  - grid layout matches Keep-ish UX

**Deploy after B3.**

---

## Slice C — Create new note (capture-first)
**C1. Composer UI (collapsed → expanded)**
- Validate:
  - can type title/body

**C2. Hardcode note creation**
- C2.1 Save to `inboxPath/test.md` (temporary)
- Validate:
  - file appears in Dropbox

**C3. Filename generation**
- C3.1 sanitize title/body
- C3.2 duplicate resolution suffix
- Validate:
  - predictable filenames and no collisions

**C4. Optimistic update**
- C4.1 after save refresh list
- Validate:
  - new card shows at top

**Deploy after C4.**

---

## Slice D — Open + read note (modal)
**D1. Click card → modal UI**
- Validate:
  - modal open/close

**D2. Download content**
- Validate:
  - raw text displayed

**D3. Render markdown**
- Validate:
  - basic markdown rendered correctly

**Deploy after D3.**

---

## Slice E — Edit + Save (manual)
**E1. Edit mode toggle**
- Validate:
  - can edit locally

**E2. Save with rev update**
- Validate:
  - saved changes visible in Obsidian desktop

**E3. Conflict message**
- Validate:
  - conflict shows clear message + reload action

**Deploy after E3.**

---

## Definition of Done (Feature)
- Inbox folder can be selected and persists
- Inbox notes show as cards sorted by last modified
- User can create new notes (title optional) stored in Inbox
- User can open, read, edit, and save notes
- Every slice is deployable to GitHub Pages
- Obsidian desktop stays consistent

---

## 10) Next micro-step
✅ **A1 — Add Settings UI to select and persist inboxPath**

Why: it unlocks everything else and is the smallest testable slice.
