# Inbox Note Preview Implementation Plan

## Overview

Enhance the inbox note cards to display rendered markdown content previews, similar to Google Keep's card layout. This will allow users to see a preview of their notes (including images) directly in the grid view without opening them.

## Current State

- **InboxNotesList**: Displays cards with only:
  - Note title (filename without extension)
  - Last modified date
- Cards are currently minimal and don't show content

## Target State (Inspired by Google Keep)

- Cards should display:
  - Note title (if present in markdown)
  - Rendered markdown preview (limited height)
  - Images embedded in the note (if any)
  - Fade-out effect when content exceeds card height
  - Last modified date

## Technical Design

### 1. Data Layer Changes

**File**: `src/lib/dropbox-client.ts`

Currently `InboxNote` interface only has metadata. We need to fetch content:

```typescript
export interface InboxNote {
  name: string
  path_display: string
  path_lower: string
  id: string
  server_modified: string
  content?: string  // NEW: Add optional content field
}
```

**New function**: `listInboxNotesWithContent()`
- Fetch folder listing (current behavior)
- For each note, fetch first ~500 characters of content
- Use batch download if available, or parallel downloads
- Balance between performance and preview quality

**Alternative approach** (Recommended):
- Keep `listInboxNotes()` as-is for fast initial load
- Add lazy loading: fetch content on-demand as cards scroll into view
- Use IntersectionObserver for efficient lazy loading

### 2. Component Changes

**File**: `src/components/InboxNotesList.tsx`

#### Current Structure:
```tsx
<div className={styles.card}>
  <h3 className={styles.cardTitle}>{nameWithoutExt}</h3>
  <p className={styles.cardDate}>{formatDate(...)}</p>
</div>
```

#### New Structure:
```tsx
<div className={styles.card}>
  {hasTitle && <h3 className={styles.cardTitle}>{title}</h3>}
  <div className={styles.cardPreview}>
    <MarkdownPreview content={content} maxHeight={200} />
  </div>
  <div className={styles.cardFooter}>
    <p className={styles.cardDate}>{formatDate(...)}</p>
  </div>
</div>
```

### 3. New Component: MarkdownPreview

**File**: `src/components/MarkdownPreview.tsx`

Purpose: Render markdown in a constrained preview mode

```typescript
interface MarkdownPreviewProps {
  content: string
  maxHeight: number
  showImages?: boolean
}

function MarkdownPreview({ content, maxHeight, showImages = true }: MarkdownPreviewProps) {
  // Parse markdown to extract title (first H1)
  // Render remaining content
  // Handle images:
  //   - Convert ![[image.png]] to actual images
  //   - Fetch image URLs from Dropbox
  //   - Show with proper sizing/aspect ratio
  // Apply fade-out gradient when content exceeds maxHeight
}
```

**Key features**:
- Extract H1 as title (don't render in preview)
- Render markdown with limited formatting (h2, h3, p, ul, ol, strong, em, code)
- Handle wikilink-style images: `![[image.png]]`
- Lazy load images
- CSS: `max-height`, `overflow: hidden`, gradient fade-out

### 4. Image Handling

**Challenge**: Images in notes use `![[filename.png]]` syntax

**Solution**:
1. Parse content for image references
2. Generate Dropbox temporary links for images
3. Cache temporary links (valid for 4 hours)
4. Render `<img>` tags with proper sizing

**File**: `src/lib/image-preview.ts` (new)

```typescript
export function extractImageReferences(content: string): string[] {
  // Parse ![[image.png]] syntax
  // Return array of filenames
}

export async function getImagePreviewUrl(
  accessToken: string,
  vaultPath: string,
  filename: string
): Promise<string> {
  // Use getTemporaryLink from dropbox-client
  // Add caching layer
}
```

### 5. CSS Changes

**File**: `src/components/InboxNotesList.module.css`

```css
.card {
  /* Keep existing styles */
  display: flex;
  flex-direction: column;
  min-height: 120px;
  max-height: 300px; /* NEW: Allow cards to grow */
}

.cardTitle {
  /* Keep existing */
  margin: 0 0 0.75rem 0;
}

.cardPreview {
  flex: 1;
  overflow: hidden;
  position: relative;
  margin-bottom: 0.75rem;
  max-height: 200px;
}

.cardPreview::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--color-bg-elevated)
  );
  pointer-events: none;
}

.cardPreview img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 0.5rem 0;
}

.cardPreview h2,
.cardPreview h3 {
  font-size: 0.9rem;
  margin: 0.5rem 0;
  color: var(--color-text);
}

.cardPreview p {
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0.25rem 0;
  color: var(--color-text-muted);
}

.cardPreview ul,
.cardPreview ol {
  font-size: 0.85rem;
  margin: 0.25rem 0;
  padding-left: 1.5rem;
}

.cardPreview code {
  font-size: 0.8rem;
  background: var(--color-bg);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.cardFooter {
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.cardDate {
  /* Keep existing */
}
```

### 6. Performance Considerations

#### Lazy Loading Strategy

**Option A: Load all content upfront** (Simple)
- Pros: Immediate preview, no loading states
- Cons: Slow initial load with many notes, high bandwidth

**Option B: Lazy load content** (Recommended)
- Use IntersectionObserver
- Load content only when card is near viewport
- Show skeleton/loading state until loaded
- Pros: Fast initial render, efficient bandwidth
- Cons: More complex, need loading states

**Option C: Hybrid**
- Load first 6-9 cards immediately
- Lazy load the rest
- Best of both worlds

#### Caching Strategy

1. **Content Cache**:
   - Cache note content in component state
   - Persist in localStorage for session
   - Clear on refreshKey change

2. **Image Cache**:
   - Cache Dropbox temporary links (4hr expiry)
   - Use browser cache for actual images
   - Implement cache key: `${noteId}-${imageFilename}`

### 7. Implementation Phases

#### Phase 1: Basic Content Preview (No Images)
**Goal**: Display rendered markdown text preview

1. Modify `listInboxNotes()` to include content snippet
2. Create `MarkdownPreview` component
3. Update `InboxNotesList` to use preview
4. Add CSS for preview layout and fade-out
5. Extract title from markdown (first H1)
6. Tests for content preview rendering

**Estimated complexity**: Medium
**Test coverage needed**: 90%+

#### Phase 2: Image Support
**Goal**: Show images in preview cards

1. Create `image-preview.ts` utility
2. Parse image references from content
3. Fetch Dropbox temporary links
4. Render images in preview
5. Add lazy loading for images
6. Implement caching for image URLs
7. Tests for image extraction and rendering

**Estimated complexity**: High
**Test coverage needed**: 90%+

#### Phase 3: Performance Optimization
**Goal**: Optimize for many notes

1. Implement IntersectionObserver for lazy loading
2. Add loading skeletons
3. Implement content caching
4. Add virtualization if needed (>100 notes)
5. Performance testing

**Estimated complexity**: Medium
**Test coverage needed**: 85%+

## Testing Strategy

### Unit Tests

1. **MarkdownPreview.test.tsx**
   - Renders markdown correctly
   - Extracts title from H1
   - Limits content to maxHeight
   - Handles empty content
   - Renders images correctly
   - Handles missing images gracefully

2. **image-preview.test.ts**
   - Extracts image references correctly
   - Handles various image syntax
   - Generates correct Dropbox paths
   - Caching works correctly

3. **InboxNotesList.test.tsx** (update existing)
   - Displays content preview
   - Shows loading state
   - Lazy loads content
   - Handles notes without content

### Integration Tests

1. Full flow: Load inbox → Display previews → Click card → Open modal
2. Image loading: Note with images → Preview shows images → Click → Modal shows full images
3. Performance: Many notes → Lazy loading works → Smooth scrolling

## Migration Plan

### Backward Compatibility

- Existing `listInboxNotes()` continues to work
- Content preview is additive, not breaking
- Graceful degradation if content fetch fails

### Feature Flag (Optional)

Add setting to enable/disable previews:
```typescript
interface InboxSettings {
  showPreviews: boolean
  showImages: boolean
  previewHeight: 'small' | 'medium' | 'large'
}
```

## UX Considerations

### Loading States

1. **Initial Load**:
   - Show cards with title/date immediately
   - Add skeleton for content area
   - Fade in content when loaded

2. **Images**:
   - Show placeholder while loading
   - Fade in when ready
   - Show broken image icon on error

### Error Handling

1. **Content Fetch Fails**: Show title/date only (current behavior)
2. **Image Fetch Fails**: Hide image, show remaining content
3. **Parse Errors**: Show raw content or hide preview

### Accessibility

1. Preview content should be semantic HTML
2. Images need alt text (extract from wikilink syntax if available)
3. Maintain keyboard navigation
4. Screen reader support for preview content

## Open Questions

1. **Content Length**: How much content to fetch?
   - Option A: First 500 characters
   - Option B: First 5 lines
   - Option C: Dynamic based on card height

2. **Image Count**: Limit images per preview?
   - Suggest: Max 2-3 images per card
   - Prevents overly long cards

3. **Update Frequency**: When to refetch content?
   - On refreshKey change (current)
   - On focus/visibility change?
   - Time-based (every X minutes)?

4. **Complex Markdown**: How to handle?
   - Tables: Show simplified or skip
   - Code blocks: Show with syntax highlighting or plain
   - Nested lists: Flatten or preserve

## Security Considerations

1. **Content Sanitization**: Ensure markdown rendering is XSS-safe
2. **Image URLs**: Temporary links expire, good for security
3. **Privacy**: Don't cache sensitive content in localStorage

## Success Metrics

1. **User Experience**:
   - Users can identify notes without opening
   - Reduced clicks to find desired note
   - Faster note browsing

2. **Performance**:
   - Initial load time: < 2s for 50 notes
   - Scroll performance: 60fps
   - Image load time: < 500ms per image

3. **Technical**:
   - Test coverage: 90%+
   - No regressions in existing functionality
   - Works on mobile viewports

## References

- Google Keep: Screenshot provided
- Current implementation: `InboxNotesList.tsx`
- Markdown rendering: `MarkdownWithWikilinks.tsx`
- Image handling: `ImageEmbed.tsx`

## Next Steps

1. Review and approve this plan
2. Create detailed implementation tasks
3. Start with Phase 1 (Basic Content Preview)
4. Iterate based on feedback
