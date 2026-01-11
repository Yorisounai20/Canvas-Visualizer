# Canvas Visualizer - Unified Workspace

## Overview

Canvas Visualizer is a unified workspace that replaces the two existing modes (VisualizerEditor and visualizer-software) with a comprehensive, data-driven animation system.

## Key Features

- **Preset-Based System**: JSON-driven presets define animations, automations, and audio-reactive behaviors
- **PresetManager**: Central manager for evaluating and applying preset data to the 3D scene
- **Modular UI**: Clean separation between UI components, render logic, and preset system
- **Feature Flag Toggle**: Can switch between legacy and unified modes via environment variable or localStorage

## Architecture

### Components

- **CanvasVisualizer.tsx**: Root component that orchestrates all sub-components
- **TopBar.tsx**: Mode switching (Author, Stage, Effects, Preview, Export) and primary actions
- **LeftToolbox.tsx**: Preset library, shape tools, and asset browser
- **CanvasPane.tsx**: Main 3D viewport with Three.js scene
- **TimelinePane.tsx**: Timeline, playback controls, and automation editor
- **InspectorPane.tsx**: Property inspector and parameter controls

### Preset System

- **PresetManager.ts**: Core manager class that loads, evaluates, and applies presets
- **presets.ts**: TypeScript interfaces defining the preset schema
- **hammerhead.json**: Example preset demonstrating all features
- **hammerhead-setup.ts**: Implementation stub showing how to wire presets to scene objects

## Getting Started

### Toggle Between Modes

The application supports two modes:

1. **Legacy Mode**: Original VisualizerEditor and visualizer-software
2. **Unified Mode**: New CanvasVisualizer workspace

#### Via Environment Variable (Build-time)

```bash
# Enable unified mode
VITE_USE_UNIFIED_VISUALIZER=true npm run dev

# Use legacy mode (default)
npm run dev
```

#### Via localStorage (Runtime)

```javascript
// Enable unified mode
localStorage.setItem('unifiedVisualizer', 'true');
location.reload();

// Disable unified mode (use legacy)
localStorage.setItem('unifiedVisualizer', 'false');
location.reload();

// Clear override (use environment default)
localStorage.removeItem('unifiedVisualizer');
location.reload();
```

### Using Presets

1. Load a preset JSON file (see `src/presets/hammerhead.json` for example)
2. Register setters and actions using an implementation file (see `src/presets/implementations/hammerhead-setup.ts`)
3. The PresetManager will automatically evaluate and apply the preset during the render loop

## Preset Schema

A preset JSON file contains:

```json
{
  "meta": {
    "name": "Preset Name",
    "author": "Author Name",
    "version": "1.0.0",
    "description": "Description"
  },
  "duration": 30,
  "camera": {
    "distance": 15,
    "height": 2,
    "rotation": 0,
    "fov": 75
  },
  "automations": [
    {
      "target": "camera.rotation",
      "keyframes": [
        { "time": 0, "value": 0, "easing": "linear" },
        { "time": 30, "value": 360, "easing": "linear" }
      ]
    }
  ],
  "audioReactive": [
    {
      "target": "shapes.tailWave.amplitude",
      "band": "bass",
      "amount": 0.3,
      "mode": "add"
    }
  ],
  "events": [
    {
      "time": 5.0,
      "action": "particleBurst",
      "args": { "count": 50, "color": "#00ffff" }
    }
  ],
  "params": {
    "shapes.tailSegments": 30,
    "colors.primary": "#00aaff"
  }
}
```

## Implementation Status

### ✅ Completed

- [x] Archive original files (VisualizerEditor.tsx, visualizer-software.tsx)
- [x] Type definitions (presets.ts)
- [x] PresetManager class skeleton
- [x] Example preset (hammerhead.json)
- [x] Implementation stub (hammerhead-setup.ts)
- [x] UI component skeletons (TopBar, LeftToolbox, CanvasPane, TimelinePane, InspectorPane)
- [x] CanvasVisualizer root component
- [x] Feature flag toggle in main.tsx

### 🚧 In Progress (Follow-up PRs)

- [ ] Three.js scene initialization in CanvasPane
- [ ] Shape creation and management
- [ ] Particle system integration
- [ ] Audio analysis and frequency data
- [ ] Timeline UI implementation
- [ ] Automation curve editing
- [ ] Preset library UI
- [ ] Inspector parameter controls

### 📋 Planned

- [ ] Export functionality
- [ ] Project save/load
- [ ] Additional presets
- [ ] Performance optimization
- [ ] Testing and validation

## Development

### File Structure

```
src/
├── CanvasVisualizer.tsx          # Root component
├── ui/                            # UI components
│   ├── TopBar.tsx
│   ├── LeftToolbox.tsx
│   ├── CanvasPane.tsx
│   ├── TimelinePane.tsx
│   └── InspectorPane.tsx
├── presets/                       # Preset system
│   ├── PresetManager.ts
│   ├── hammerhead.json
│   └── implementations/
│       └── hammerhead-setup.ts
├── types/
│   └── presets.ts                 # TypeScript interfaces
└── archived/                      # Original files (backup)
    ├── VisualizerEditor.tsx.backup
    └── visualizer-software.tsx.backup
```

### Contributing

When implementing follow-up features:

1. Keep changes small and focused
2. Add TypeScript types for all new code
3. Document TODOs clearly for future implementers
4. Test with the hammerhead preset
5. Ensure feature flag toggle still works

## Support

For questions or issues, refer to:
- [IMPLEMENTATION_ROADMAP.md](../IMPLEMENTATION_ROADMAP.md) - Detailed implementation plan
- [README.md](../README.md) - Main project documentation

## License

Same as the main project (see LICENSE file).
