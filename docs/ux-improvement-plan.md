# DropSidian UX Improvement Plan

## Goal

Improve user experience by moving account info and settings to a dropdown menu in the header, freeing up space for main content.

---

## Tasks

### 1. Header with UserMenu
- [ ] Create `Header` component with logo and avatar
- [ ] Create `UserMenu` component (avatar dropdown)
  - Shows user name and email
  - "Settings" button
  - "Disconnect" button

### 2. Settings Panel
- [ ] Create `SettingsModal` component for configuration
- [ ] Move `VaultSelector` inside settings modal
- [ ] Accessible from UserMenu

### 3. Visual Improvements
- [ ] Improve `NewNoteModal` with overlay and animations
- [ ] Extract FAB button to component with better styles
- [ ] Improve landing page (connection screen)

### 4. Polish
- [ ] Smooth transitions between views
- [ ] Improved loading states

---

## Final Structure

```
┌─────────────────────────────────────────────┐
│  🔗 DropSidian                    [Avatar ▼]│  ← Header
├─────────────────────────────────────────────┤
│                                             │
│  🔍 Search notes...                         │
│                                             │
│  📂 vault                                   │
│    📁 Sources                         ›     │
│    📁 Projects                        ›     │
│    📝 Daily Note                            │
│    ...                                      │
│                                             │
│                                      [+]    │  ← FAB
└─────────────────────────────────────────────┘

Avatar dropdown:
┌──────────────────┐
│ Eduardo Ferro    │
│ email@gmail.com  │
├──────────────────┤
│ ⚙️ Settings      │
│ 🚪 Disconnect    │
└──────────────────┘
```

---

## Progress

| Date | Task | Status |
|------|------|--------|
| - | Header + UserMenu | ⏳ Pending |
| - | SettingsModal | ⏳ Pending |
| - | Visual improvements | ⏳ Pending |
| - | Final polish | ⏳ Pending |
