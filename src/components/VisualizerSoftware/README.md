# Visualizer Software Component Structure

This document describes the refactored component structure for the 3D music visualizer software.

## Directory Structure

```
src/components/VisualizerSoftware/
├── components/           # React UI components
│   ├── VideoExportModal.tsx
│   └── index.ts
├── hooks/               # Custom React hooks (future)
├── shaders/             # WebGL shaders
│   └── PostFXShader.ts
├── types/               # TypeScript type definitions
│   └── index.ts
└── utils/               # Utility functions
    ├── audioUtils.ts
    ├── easingUtils.ts
    ├── timeUtils.ts
    ├── constants.ts
    └── index.ts
```

## Refactoring Progress

### ✅ Completed
1. **PostFXShader** - Extracted shader to `shaders/PostFXShader.ts`
2. **VideoExportModal** - Extracted export modal to `components/VideoExportModal.tsx`
3. **Backup** - Created backup at `src/visualizer-software.tsx.backup`

### 🔄 Future Improvements
The following components can be extracted in future refactoring sessions:

#### High Priority (Large UI Sections)
- **ParameterEventModal** - Parameter events edit modal (~500 lines)
- **KeyboardShortcutsModal** - Keyboard shortcuts help modal (~150 lines)
- **AudioTracksPanel** - Audio tracks management UI
- **CameraRigPanel** - Camera rig controls and keyframes
- **TextAnimatorPanel** - Text animator controls
- **MaskPanel** - Mask controls and reveals

#### Medium Priority (Tab Sections)
- **WaveformsTab** - Waveform display and controls
- **ControlsTab** - Color and gain controls
- **CameraTab** - Camera settings and keyframes
- **EffectsTab** - Visual effects controls
- **PostFXTab** - Post-processing effects
- **PresetsTab** - Animation presets management

#### Custom Hooks
- **useAudioTracks** - Multi-track audio management
- **useThreeScene** - Three.js scene setup and rendering
- **useCameraRig** - Camera rig calculations
- **useParameterEvents** - Parameter event processing
- **useKeyboardShortcuts** - Keyboard event handling

## Benefits of Refactoring

1. **Maintainability** - Smaller, focused components are easier to understand and modify
2. **Reusability** - Extracted components can be reused in other parts of the app
3. **Testing** - Smaller components are easier to test in isolation
4. **Performance** - React can optimize re-renders better with smaller components
5. **Collaboration** - Multiple developers can work on different components simultaneously

## Migration Guide

When using the refactored components:

```typescript
// Old (inline modal)
{showExportModal && (
  <div>...</div>
)}

// New (component)
<VideoExportModal
  showExportModal={showExportModal}
  setShowExportModal={setShowExportModal}
  // ... other props
/>
```

## Size Reduction

- Original file: **8,447 lines**
- After extracting PostFXShader: **8,374 lines** (-73 lines)
- After extracting VideoExportModal: **8,302 lines** (-72 lines)
- **Total reduction so far: 145 lines (1.7%)**

Further refactoring of the remaining sections could reduce the main file to ~3,000-4,000 lines.
