# Waveform Display Mode Change

## Change Summary
Updated the timeline waveform display from **mirrored** mode (displaying on both top and bottom halves) to **top-only** mode (displaying from bottom upward only).

## Visual Comparison

### Before (Mirrored Mode)
```
┌─────────────────────────────┐
│         ▲  ▲▲   ▲           │ ← Top half of waveform
│        ▲▲▲▲▲▲▲▲▲▲▲          │
│────────────────────────────│ ← Middle line
│        ▼▼▼▼▼▼▼▼▼▼▼          │
│         ▼  ▼▼   ▼           │ ← Bottom half (mirror)
└─────────────────────────────┘
```

### After (Top-Only Mode)
```
┌─────────────────────────────┐
│                             │
│         ▲  ▲▲   ▲           │ ← Waveform bars
│        ▲▲▲▲▲▲▲▲▲▲▲          │
│────────────────────────────│ ← Bottom baseline
└─────────────────────────────┘
```

## Code Changes

### WaveformVisualizer.tsx
Changed default mode from 'mirrored' to 'top-only':
```typescript
// Before
mode = 'mirrored'

// After
mode = 'top-only'
```

### TimelineV2.tsx
Explicitly set mode to 'top-only' in WaveformVisualizer component usage:
```typescript
<WaveformVisualizer
  audioBuffer={audioBuffer}
  duration={duration}
  width={timelineWidth}
  height={TRACK_HEIGHT}
  color="rgba(100, 180, 255, 0.3)"
  mode="top-only"  // ← Added explicit mode
/>
```

## Rendering Logic

The 'top-only' mode renders waveform bars from the bottom of the canvas upward:

```typescript
// Top-only mode (line 146 of WaveformVisualizer.tsx)
ctx.fillRect(x, clampedCanvasHeight - barHeight, Math.max(barWidth, 1), barHeight);
```

Where:
- `x` = horizontal position of the bar
- `clampedCanvasHeight - barHeight` = starting Y position (from bottom upward)
- `Math.max(barWidth, 1)` = width of the bar (minimum 1 pixel)
- `barHeight` = height of the bar based on audio amplitude

## Benefits of Top-Only Mode

1. **Cleaner Visual Appearance**: Shows waveform in one direction only
2. **More Space Efficient**: Uses vertical space more efficiently in the timeline
3. **Easier to Read**: Single-direction waveform is simpler to interpret
4. **Consistent with Audio Editors**: Many professional audio editors use top-only display

## Commit
- Hash: `64a0fc7`
- Message: "Change waveform display mode to top-only per user request"
