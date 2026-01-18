# Timeline Overlay Fix

## Issue
The timeline header was blocking the bottom portion of the canvas, making it difficult to see the full rendered output.

## Root Cause
The layout structure had a subtle but critical issue:

```tsx
<div className="cv-layout flex flex-col h-screen">     // Root: screen height
  <header className="flex-shrink-0">...</header>       // Top bar: fixed height
  
  <div className="flex-1 relative">                    // Middle: takes remaining space
    <main className="absolute inset-0">...</main>      // Canvas: fills middle container
  </div>
  
  <footer className="absolute bottom-0">...</footer>   // Timeline: overlays bottom
</div>
```

**The Problem:**
1. The timeline `<footer>` is absolutely positioned at the bottom of the root container
2. The `flex-1` middle container expands to fill all available space (screen - header)
3. The canvas fills the middle container with `absolute inset-0`
4. The footer overlays the bottom of the middle container, blocking the canvas

## Solution Journey

### Attempt 1: `paddingBottom` on main (Failed)
```tsx
<main 
  className="absolute inset-0"
  style={{ paddingBottom: effectiveTimelineHeight }}
>
```

**Why it failed:** Child elements with `h-full` (height: 100%) expand to fill the entire content box INCLUDING the padding area. The canvas still extended into the timeline area.

### Attempt 2: `bottom` offset on main (Failed)
```tsx
<main 
  className="absolute inset-x-0 top-0"
  style={{ bottom: effectiveTimelineHeight }}
>
```

**Why it failed:** The `bottom` offset was relative to the flex-1 container, which didn't account for the footer. The flex-1 container still extended to full height, and the footer overlaid it from the root level.

### Attempt 3: `marginBottom` on flex-1 container (Success ✅)
```tsx
// src/visualizer/LayoutShell.tsx
<div 
  className="flex-1 relative overflow-hidden min-h-0"
  style={{ marginBottom: effectiveTimelineHeight }}
>
  <main className="absolute inset-0 overflow-hidden flex flex-col">
    {children}
  </main>
</div>
```

**Why this works:**
1. The `marginBottom` is applied to the flex-1 container itself
2. This reduces the container's size within the flex layout
3. The container now occupies: `screen height - header height - timeline height`
4. The main element with `absolute inset-0` fills this reduced container
5. The footer's absolute positioning places it in the margin space
6. Canvas children with `h-full` now correctly fill only the visible area

## Visual Explanation

### Before (All Attempts Failed)
```
┌─────────────────────────────────────┐
│         Top Bar (fixed)             │
├─────────────────────────────────────┤
│                                     │
│      flex-1 Container               │
│      (extends full height)          │
│                                     │
│         Canvas fills here           │
│                                     │
│    ▼▼▼ Footer overlays here ▼▼▼    │ ← Timeline blocks canvas
├═════════════════════════════════════┤
│ Timeline (absolute, z-20)           │
│  - Resize handle                    │
│  - Tracks                           │
└─────────────────────────────────────┘
```

### After (marginBottom Fix)
```
┌─────────────────────────────────────┐
│         Top Bar (fixed)             │
├─────────────────────────────────────┤
│                                     │
│      flex-1 Container               │
│      (reduced by margin)            │
│                                     │
│         Canvas fills here           │
│                                     │ ← Canvas ends here
├─────────────────────────────────────┤ ← Margin space begins
│ Timeline (absolute, in margin)      │
│  - Resize handle                    │
│  - Tracks                           │
└─────────────────────────────────────┘
```

## Technical Details

### File Changed
- `src/visualizer/LayoutShell.tsx` (5 lines)

### Changes Made
1. Added `style={{ marginBottom: effectiveTimelineHeight }}` to flex-1 container
2. Reverted main element to `className="absolute inset-0"` (removed bottom offset)
3. Updated comment to reflect the simpler approach

### Dynamic Behavior
The `effectiveTimelineHeight` is:
- `${timelineHeight}px` (default: 450px) in normal mode
- `calc(100vh - 4rem)` when timeline is maximized

The margin automatically adjusts when:
- Timeline is manually resized (300-800px range)
- Timeline is maximized (⬆ Maximize button)
- Timeline is restored (⬇ Restore button)

## Key Learnings

### CSS Layout Hierarchy
When dealing with overlapping absolutely positioned elements:
1. **Identify the positioning context:** Determine which element is the container for each absolutely positioned element
2. **Consider flex layout interactions:** Flex children don't automatically account for sibling absolute elements
3. **Use margins on flex children:** Margins affect the flex layout algorithm, reserving space that absolute siblings can use

### Why Each Approach Failed/Succeeded

| Approach | Applied To | Why It Failed/Succeeded |
|----------|-----------|-------------------------|
| `paddingBottom` | main (child) | ❌ Child `h-full` elements include padding in their height calculation |
| `bottom` offset | main (child) | ❌ Offset relative to parent, parent doesn't account for footer overlay |
| `marginBottom` | flex-1 (parent) | ✅ Margin reduces flex item size, creates space for footer |

### The Winning Pattern
When you have an absolutely positioned overlay (footer) that should not overlap content:
1. Apply margin to the **flex container** that would be overlapped
2. The margin creates reserved space in the flex layout
3. The absolute element naturally fits in the reserved space
4. Content within the flex container remains properly bounded

## Verification
- ✅ Build successful
- ✅ No TypeScript errors
- ✅ Timeline resizing works correctly
- ✅ Timeline maximize/restore works correctly
- ✅ Canvas fully visible without overlap
- ✅ All child elements with `h-full` work correctly

---

**Commits:**
- 1c2dcc2 - Attempt 1: paddingBottom (failed)
- 8fa378e - Attempt 2: bottom offset (failed)
- 599bbbf - Attempt 3: marginBottom (success)

**Date:** 2026-01-18
