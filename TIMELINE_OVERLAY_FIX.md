# Timeline Overlay Fix

## Issue
The timeline header was blocking the bottom portion of the canvas, making it difficult to see the full rendered output.

## Root Cause
The layout had two overlapping absolutely-positioned elements:
1. **Main canvas container** (`<main>`) - positioned with `absolute inset-0` (covering full viewport)
2. **Timeline footer** - positioned with `absolute bottom-0` with height 450px

Both elements were in the same stacking context, causing the timeline to overlay the canvas.

## Solution
Added dynamic `paddingBottom` to the main canvas container that matches the timeline height:

```tsx
// src/visualizer/LayoutShell.tsx
<main 
  className="absolute inset-0 overflow-hidden flex flex-col"
  style={{ paddingBottom: effectiveTimelineHeight }}
>
  {children}
</main>
```

The `effectiveTimelineHeight` is either:
- `${timelineHeight}px` (default: 450px) in normal mode
- `calc(100vh - 4rem)` when timeline is maximized

## Impact
- ✅ Canvas no longer blocked by timeline
- ✅ Full canvas visible at all times
- ✅ Padding adjusts dynamically when timeline is resized or maximized
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
│     (with bottom padding)           │
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

### Change Type
- Layout adjustment (non-breaking)
- No functionality changes
- Dynamic padding based on timeline height

### Related Components
- Main canvas container
- Timeline footer
- Timeline header (ruler)

## Verification
- ✅ Build successful
- ✅ No TypeScript errors
- ✅ Timeline resizing works correctly
- ✅ Timeline maximize/restore works correctly
- ✅ Canvas always visible

---

**Commit:** 1c2dcc2
**Date:** 2026-01-18
