# TimelineV2 Visual Guide

## Overview

TimelineV2 is the new scrollable per-track timeline that replaces the simple waveform display. It provides a professional video editor-style interface for managing keyframes and visualizing audio.

## Enabling TimelineV2

### Browser Console Method (Easiest)
```javascript
// Enable new timeline
window.enableNewTimeline()
location.reload()

// Disable new timeline
window.disableNewTimeline()
location.reload()

// Check current status
window.getFeatureFlags()
```

### localStorage Method
```javascript
// Enable
localStorage.setItem('cv_use_scrollable_timeline', 'true')
location.reload()

// Disable
localStorage.setItem('cv_use_scrollable_timeline', 'false')
location.reload()
```

### Environment Variable Method
Create `.env` file:
```
VITE_USE_NEW_TIMELINE=true
```
Then rebuild: `npm run build`

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Zoom Controls & Time Display                       │
├──────────────┬──────────────────────────────────────────────┤
│              │ ┌────────────────────────────────────────┐   │
│  Track       │ │ Sticky Time Ruler (0s, 1s, 2s, ...)   │   │
│  Labels      │ └────────────────────────────────────────┘   │
│  (Fixed      │                                              │
│   240px)     │ ╔════════════════════════════════════════╗   │
│              │ ║ Audio Track (with waveform)            ║   │
│  • Audio     │ ║                                        ║   │
│  • Presets   │ ╚════════════════════════════════════════╝   │
│  • Camera    │ ┌────────────────────────────────────────┐   │
│  • Text      │ │ Presets Track                          │   │
│              │ │                                        │   │
│              │ └────────────────────────────────────────┘   │
│              │ ┌────────────────────────────────────────┐   │
│              │ │ Camera Track                           │   │
│              │ │                                        │   │
│              │ └────────────────────────────────────────┘   │
│              │ ┌────────────────────────────────────────┐   │
│              │ │ Text Track                             │   │
│              │ │                                        │   │
│              │ └────────────────────────────────────────┘   │
│              │                                              │
│              │ <─── Scrollable horizontally & vertically ──>│
└──────────────┴──────────────────────────────────────────────┘
```

## Key Features

### 1. Two-Column Layout
- **Left Column (240px fixed)**: Track names, always visible
- **Right Column (scrollable)**: Timeline content with ruler and tracks

### 2. Sticky Time Ruler
- Stays at top of scroll area when scrolling vertically
- Shows time markers based on zoom level
- Format: `MM:SS` (e.g., `00:15`, `01:30`)

### 3. Zoom Controls
- **Slider**: 0.25x to 4.0x range
- **Reset Button**: Return to 1.0x
- **Current Zoom Display**: Shows current zoom level

### 4. Track Rows
- **Height**: 80px per track
- **Audio Track**: Shows waveform visualization
- **Other Tracks**: Grid lines for time reference
- **Background**: Dark gray with subtle borders

### 5. Playhead
- **Red vertical line** spanning all tracks
- **Circular indicator** at top
- Moves in real-time during playback

### 6. Grid Lines
- Vertical lines at each second mark
- Subtle gray color (30% opacity)
- Helps align keyframes visually

## Current Implementation Status

### ✅ Implemented (PR A + B)
- Two-column layout with fixed left labels
- Sticky time ruler
- Scrollable content area (both axes)
- Zoom controls and calculation
- Playhead visualization
- Waveform display for audio track
- Grid lines for time reference
- Click-to-seek functionality
- Feature flag system with browser helpers

### 🚧 Coming in PR C
- Wheel zoom (shift+wheel = zoom, wheel = scroll)
- Right-click pan (omni-directional)
- Marquee selection (shift+right-click)
- Left-drag keyframes
- Context menu for keyframes
- Keyboard shortcuts (arrows, Home/End, PageUp/PageDown)

### 📋 Coming in PR D
- Per-track row virtualization (for >20 tracks)
- Collapsible track rows
- Track naming and renaming
- Persistence of zoom/scroll/collapsed state

## Troubleshooting

### Timeline not appearing after enabling?
1. Check browser console for messages
2. You should see: `[Timeline] Using TimelineV2 (new scrollable)`
3. Verify localStorage: `localStorage.getItem('cv_use_scrollable_timeline')` should return `'true'`
4. Make sure you reloaded the page after enabling

### No waveform showing?
1. Load an audio file first
2. Check if audio file loaded successfully
3. Waveform only appears in the "Audio" track row

### Can't scroll?
1. Timeline width depends on audio duration
2. Short audio files may not need horizontal scrolling
3. Vertical scrolling requires more than 4 tracks (future PR)

### Want to go back to old timeline?
```javascript
window.disableNewTimeline()
location.reload()
```

## Comparison: Old vs New

### Old Timeline (Default)
- Single waveform display
- Simple slider for seeking
- No track separation
- No zoom controls
- No keyframe visualization

### New Timeline (TimelineV2)
- Multi-track layout
- Professional video editor style
- Per-track waveforms
- Zoom controls (0.25x - 4.0x)
- Grid lines and ruler
- Expandable for future features (keyframe editing, etc.)

## Developer Notes

### Code Location
- **Feature Flag**: `src/lib/featureFlags.ts`
- **TimelineV2 Component**: `src/components/Timeline/TimelineV2.tsx`
- **Integration**: `src/visualizer-software.tsx` (around line 8195)
- **Utilities**: `src/components/Timeline/utils.ts`

### Console Logging
The timeline logs its mode on load:
```
[Timeline] Using TimelineV2 (new scrollable)
[Timeline] To disable: window.disableNewTimeline()
```

### Props
TimelineV2 accepts all the same props as the original Timeline for future compatibility, but currently only uses:
- `currentTime`, `duration`, `audioBuffer`
- `showWaveform`, `onSeek`

More props will be utilized in PR C and D.
