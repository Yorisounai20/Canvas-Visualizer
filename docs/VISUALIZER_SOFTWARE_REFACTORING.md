# Visualizer Software Module Refactoring

This document describes the refactoring of `visualizer-software.tsx` into a more modular structure.

## Overview

The original `visualizer-software.tsx` file was 5,224 lines long and contained all logic, types, utilities, and UI components in a single file. This refactoring extracts reusable types, utilities, and constants into a separate module structure.

## New Structure

```
src/components/VisualizerSoftware/
├── types/
│   └── index.ts          # TypeScript interfaces and constants
├── utils/
│   ├── index.ts          # Barrel export for all utilities
│   ├── timeUtils.ts      # Time formatting and parsing utilities
│   ├── easingUtils.ts    # Easing functions and camera interpolation
│   ├── constants.ts      # Animation types and other constants
│   └── audioUtils.ts     # Audio waveform generation utilities
└── (future: hooks/, ui/ directories)
```

## Extracted Modules

### Types (`types/index.ts`)
- `LogEntry` - Log message structure
- `AudioTrack` - Multi-track audio system interface
- `ParameterEvent` - Animation parameter event interface
- Camera constants (DEFAULT_CAMERA_DISTANCE, DEFAULT_CAMERA_HEIGHT, etc.)
- Performance constants (WAVEFORM_SAMPLES, WAVEFORM_THROTTLE_MS, etc.)

### Time Utilities (`utils/timeUtils.ts`)
- `formatTime(seconds)` - Convert seconds to MM:SS format
- `formatTimeInput(seconds)` - Alternate MM:SS formatter
- `parseTime(timeString)` - Parse MM:SS to seconds
- `parseTimeInput(timeString)` - Alternate parser

### Easing Utilities (`utils/easingUtils.ts`)
- `applyEasing(t, easingType)` - Apply easing functions (linear, easeIn, easeOut, easeInOut)
- `interpolateCameraKeyframes(keyframes, currentTime)` - Interpolate camera position between keyframes

### Constants (`utils/constants.ts`)
- `animationTypes` - Array of animation preset definitions with icons and labels

### Audio Utilities (`utils/audioUtils.ts`)
- `generateWaveformData(buffer, samples)` - Generate visualization data from audio buffer

## Benefits

1. **Improved Maintainability** - Related code is grouped together
2. **Better Reusability** - Utilities can be imported and used in other components
3. **Easier Testing** - Pure functions can be tested in isolation
4. **Type Safety** - Centralized type definitions prevent inconsistencies
5. **Reduced File Size** - Main component file reduced from 5,224 to 5,078 lines

## Usage

Import utilities and types in your components:

```typescript
import { 
  LogEntry, 
  AudioTrack,
  DEFAULT_CAMERA_DISTANCE 
} from './components/VisualizerSoftware/types';

import { 
  formatTime,
  applyEasing,
  animationTypes,
  generateWaveformData
} from './components/VisualizerSoftware/utils';
```

## Backup

The original unmodified file is preserved as `src/visualizer-software.tsx.backup` for reference.

## Future Improvements

Potential next steps for further modularization:
- Extract UI tab panels into separate components
- Create custom hooks for audio management
- Extract Three.js scene setup logic
- Split animation preset logic into separate files
