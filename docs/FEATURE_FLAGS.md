# Feature Flags Guide

## Overview

This project uses runtime feature flags to safely roll out new features and provide QA fallback options. Flags can be toggled without rebuilding the application.

## Available Flags

### `cv_use_scrollable_timeline`
**Status:** 🚧 In Development (PR B)  
**Default:** `false` (uses original timeline)  
**Description:** Enables the new scrollable per-track timeline with:
- Two-column layout (fixed left labels, scrollable right content)
- Horizontal and vertical scrolling
- Sticky time ruler
- Per-track waveforms
- Wheel zoom and pan controls

## How to Toggle Flags

### Method 1: Browser Console (Recommended for Testing)

Open your browser's developer console and use these helper functions:

```javascript
// Enable new timeline
window.enableNewTimeline()

// Disable new timeline
window.disableNewTimeline()

// View all flags
window.getFeatureFlags()
```

After toggling, **reload the page** to see changes.

### Method 2: localStorage (Manual)

```javascript
// Enable
localStorage.setItem('cv_use_scrollable_timeline', 'true')

// Disable
localStorage.setItem('cv_use_scrollable_timeline', 'false')

// Clear (use default)
localStorage.removeItem('cv_use_scrollable_timeline')
```

### Method 3: Environment Variable (Build-time)

Create a `.env` file in the project root:

```env
VITE_USE_NEW_TIMELINE=true
```

Then rebuild the application:

```bash
npm run build
```

## Priority Order

Flags are checked in this order:
1. **localStorage** (runtime toggle) - highest priority
2. **Environment variable** (build-time configuration)
3. **Default value** (defined in code) - lowest priority

## For Developers

### Adding a New Flag

1. Update `FeatureFlag` type in `src/lib/featureFlags.ts`
2. Add default value to `DEFAULT_FLAGS`
3. Add environment variable check if needed
4. Document the flag in this README

### Using Flags in Code

```typescript
import { getFeatureFlag } from '@/lib/featureFlags';

// Check flag value
if (getFeatureFlag('cv_use_scrollable_timeline')) {
  // Use new timeline
  return <TimelineV2 {...props} />;
} else {
  // Use original timeline
  return <Timeline {...props} />;
}
```

## Troubleshooting

**Flag not working after toggle?**
- Make sure to reload the page after changing a flag
- Check browser console for any errors
- Verify localStorage is working: `localStorage.getItem('cv_use_scrollable_timeline')`

**Want to reset all flags?**
```javascript
// Clear all timeline-related flags
localStorage.removeItem('cv_use_scrollable_timeline')
location.reload()
```
