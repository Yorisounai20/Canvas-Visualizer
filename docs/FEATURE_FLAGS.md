# Feature Flags

Canvas Visualizer uses feature flags to enable experimental or in-development features without requiring code changes or rebuilds. Feature flags are stored in `localStorage` and can be toggled at runtime via the browser console.

## Available Feature Flags

### New Scrollable Timeline (`cv_use_scrollable_timeline`)

**Status**: Experimental  
**Default**: `false` (disabled)

Enables the new TimelineV2 component with enhanced features:

- **Two-column layout**: Fixed 240px left column for track labels, scrollable right content area
- **Sticky time ruler**: Time ruler stays visible at the top while scrolling vertically
- **Per-track waveforms**: Each audio track shows its waveform visualization
- **Zoom controls**: 0.25x to 4.0x zoom levels with mouse-centered zooming
- **Click-to-seek playhead**: Click anywhere on timeline to jump to that time
- **Grid lines**: Visual time reference markers
- **Performance optimizations**: RAF-throttled dragging, debounced rendering

## How to Use

### Browser Console (Recommended)

The easiest way to toggle feature flags is through the browser console:

```javascript
// Enable new timeline
window.enableNewTimeline()
location.reload()

// Disable new timeline (revert to original)
window.disableNewTimeline()
location.reload()

// Check current status
window.getFeatureFlags()
// Returns: { newTimeline: true/false }
```

### localStorage (Manual)

You can also manually set the localStorage value:

```javascript
// Enable
localStorage.setItem('cv_use_scrollable_timeline', 'true')

// Disable
localStorage.removeItem('cv_use_scrollable_timeline')

// Check
localStorage.getItem('cv_use_scrollable_timeline')
```

### Environment Variable (Build-time)

For build-time configuration, set the environment variable:

```bash
# Enable for all users in this build
VITE_USE_NEW_TIMELINE=true npm run build

# Or in .env file
VITE_USE_NEW_TIMELINE=true
```

**Note**: Environment variables take precedence over localStorage settings.

## Feature Flag Priority

When multiple sources define a feature flag value, the priority is:

1. **Environment variable** (highest priority - build-time)
2. **localStorage** (runtime toggle)
3. **Default value** (fallback if neither is set)

## Development Workflow

### Testing New Features

1. Open browser console
2. Run `window.enableNewTimeline()`
3. Reload the page
4. Test the new timeline features
5. Report any issues

### Reverting to Stable

1. Open browser console
2. Run `window.disableNewTimeline()`
3. Reload the page
4. You're back to the original timeline

## Implementation Details

Feature flags are managed by `src/lib/featureFlags.ts`. The module exports:

- `useNewTimeline()`: Returns boolean indicating if new timeline is enabled
- `enableNewTimeline()`: Enables the new timeline
- `disableNewTimeline()`: Disables the new timeline
- `getFeatureFlagStatus()`: Returns status of all flags

The system automatically exposes helper functions to `window` object for console access.

## Backward Compatibility

All feature flags maintain full backward compatibility. When a flag is disabled:
- The original component/behavior is used
- No data is lost
- No settings are affected

This ensures a safe rollback path if issues are discovered.

## Future Feature Flags

As new experimental features are developed, they will be added to this system. Check this document for updates on available flags.

## Support

If you encounter issues with feature flags:

1. Try disabling the flag and reloading
2. Clear browser cache and localStorage
3. Check browser console for error messages
4. Report the issue with steps to reproduce
