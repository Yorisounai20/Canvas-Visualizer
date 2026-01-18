# Timeline Overlay Fix

## Issue
The timeline header was blocking the bottom portion of the canvas, making it difficult to see the full rendered output.

## Root Cause
The layout had two overlapping absolutely-positioned elements:
1. **Main canvas container** (`<main>`) - positioned with `absolute inset-0` (covering full viewport)
2. **Timeline footer** - positioned with `absolute bottom-0` with height 450px

Both elements were in the same stacking context, causing overlap.

## Initial Solution (Incorrect)
First attempt used `paddingBottom` on the main container:
```tsx
<main className="absolute inset-0" style={{ paddingBottom: effectiveTimelineHeight }}>
```

**Why it didn't work:** The canvas child element uses `h-full` (height: 100%), which makes it fill the entire container INCLUDING the padding area. This caused the canvas to still extend into the timeline area.

## Correct Solution
Changed to use `bottom` offset instead of `paddingBottom`:

```tsx
// src/visualizer/LayoutShell.tsx
<main 
  className="absolute inset-x-0 top-0 overflow-hidden flex flex-col"
  style={{ bottom: effectiveTimelineHeight }}
>
  {children}
</main>
```

This approach:
- Uses `inset-x-0 top-0` to position left, right, and top edges
- Uses `bottom: effectiveTimelineHeight` to set the bottom edge above the timeline
- The container now has an explicit height that excludes the timeline area
- Child elements with `h-full` now fill only the available space above the timeline

The `effectiveTimelineHeight` is either:
- `${timelineHeight}px` (default: 450px) in normal mode
- `calc(100vh - 4rem)` when timeline is maximized

## Impact
- ✅ Canvas no longer blocked by timeline
- ✅ Full canvas visible at all times
- ✅ Container adjusts dynamically when timeline is resized or maximized
- ✅ Child elements with `h-full` now work correctly
- ✅ No change to timeline functionality

## Before vs After

### Before (Issue)
```
┌─────────────────────────────────────┐
│         Top Bar                     │
├─────────────────────────────────────┤
│                                     │
│         Canvas Area                 │
│                                     │
│    ▼▼▼ Timeline overlays here ▼▼▼  │ ← Problem: Timeline blocks canvas
├═════════════════════════════════════┤
│ Timeline Header (Ruler)             │ ← Sticky header at z-20
│  Track 1                            │
│  Track 2                            │
└─────────────────────────────────────┘
```

### After (Fixed)
```
┌─────────────────────────────────────┐
│         Top Bar                     │
├─────────────────────────────────────┤
│                                     │
│         Canvas Area                 │
│     (bottom offset applied)         │
│                                     │ ← Canvas ends before timeline
├─────────────────────────────────────┤
│ Timeline Header (Ruler)             │ ← Timeline starts here
│  Track 1                            │
│  Track 2                            │
└─────────────────────────────────────┘
```

## Technical Details

### File Changed
- `src/visualizer/LayoutShell.tsx` (4 lines)

### Changes Made
1. Changed `absolute inset-0` to `absolute inset-x-0 top-0`
2. Changed `paddingBottom` to `bottom` in inline styles
3. Updated comment to reflect "bottom offset" instead of "bottom padding"

### Change Type
- Layout adjustment (non-breaking)
- No functionality changes
- Dynamic offset based on timeline height

### Related Components
- Main canvas container
- Timeline footer
- Timeline header (ruler)

## Verification
- ✅ Build successful
- ✅ No TypeScript errors
- ✅ Timeline resizing works correctly
- ✅ Timeline maximize/restore works correctly
- ✅ Canvas always fully visible without overlap

## Key Learnings

### Why `paddingBottom` didn't work:
When you use `padding` on a container, and a child has `height: 100%` (or `h-full` in Tailwind), the child expands to fill the entire content box, which INCLUDES the padding. So:
```
Container with paddingBottom: 450px
  └─ Child with h-full
     └─ Height = 100% of container = full height + padding area
```

### Why `bottom` offset works:
When you use the `bottom` property with absolute positioning, you're defining the actual boundaries of the element. The element's size is determined by the space between `top` and `bottom`. So:
```
Container with top: 0, bottom: 450px
  └─ Available height = viewport height - 450px
  └─ Child with h-full
     └─ Height = 100% of available height (already excludes timeline)
```

---

**Commits:** 
- 1c2dcc2 - Initial attempt (paddingBottom)
- 8fa378e - Correct fix (bottom offset)

**Date:** 2026-01-18
