# Canvas Visualizer - Implementation Roadmap

## Overview

This roadmap outlines the phased implementation of the unified Canvas Visualizer workspace, which replaces the two existing modes (VisualizerEditor and visualizer-software) with a comprehensive, preset-driven animation system.

## Goals

1. **Unify Interfaces**: Combine the two existing modes into a single, consistent workspace
2. **Data-Driven Design**: Use JSON presets to define animations, automations, and effects
3. **Maintainability**: Clean separation of concerns between UI, render logic, and preset system
4. **Reversibility**: Keep original files archived and support feature flag toggle for safety

## Principles

- **Small PRs**: Each PR should be <300 LOC where possible and complete a vertical slice
- **Preserve Behavior**: Keep existing functionality as fallback until parity is validated
- **Clear Ownership**: Each task should have clear files to change and acceptance criteria
- **Incremental Progress**: Build features iteratively with each PR adding value

## Feature Flag

The system supports two-layer feature flagging:

1. **Build-time**: `VITE_USE_UNIFIED_VISUALIZER=true` environment variable
2. **Runtime**: `localStorage.setItem('unifiedVisualizer', 'true')` override

Toggle commands:
```javascript
// Enable unified mode
localStorage.setItem('unifiedVisualizer', 'true');
location.reload();

// Disable (use legacy)
localStorage.setItem('unifiedVisualizer', 'false');
location.reload();

// Remove override (use env default)
localStorage.removeItem('unifiedVisualizer');
location.reload();
```

## Implementation Phases

### Phase 1: Foundation ✅ (COMPLETE)

**Goal**: Establish the basic structure with archived originals and skeleton components

**Tasks**:
- [x] Archive original files to `src/archived/` via `git mv`
- [x] Create type definitions (`src/types/presets.ts`)
- [x] Create PresetManager skeleton (`src/presets/PresetManager.ts`)
- [x] Create example preset (`src/presets/hammerhead.json`)
- [x] Create implementation stub (`src/presets/implementations/hammerhead-setup.ts`)
- [x] Create UI component skeletons (TopBar, LeftToolbox, CanvasPane, TimelinePane, InspectorPane)
- [x] Create CanvasVisualizer root component
- [x] Modify main.tsx for feature flag support
- [x] Add documentation (CANVAS_VISUALIZER_README.md, IMPLEMENTATION_ROADMAP.md)

**Acceptance**:
- With flag off: App runs in legacy mode unchanged
- With flag on: CanvasVisualizer mounts with skeleton UI
- No console errors in either mode
- TypeScript compiles without errors

**Testing**:
```bash
# Run typecheck
npm run typecheck

# Test legacy mode
localStorage.removeItem('unifiedVisualizer')
# Load app, verify old UI

# Test unified mode
localStorage.setItem('unifiedVisualizer', 'true')
# Load app, verify new UI skeleton
```

### Phase 2: Three.js Scene Setup 🚧 (NEXT)

**Goal**: Initialize Three.js scene with shapes in CanvasPane

**Tasks**:
- [ ] Set up Three.js scene, camera, renderer in CanvasPane
- [ ] Create shape arrays (cubes, octahedrons, tetrahedrons, sphere)
- [ ] Initialize particle emitters (basic)
- [ ] Pass modulesRoot via onReady callback
- [ ] Implement basic render loop

**Files to Modify**:
- `src/ui/CanvasPane.tsx`: Add Three.js initialization
- Create `src/lib/sceneSetup.ts`: Helper functions for scene creation

**Acceptance**:
- CanvasPane renders black canvas with some visible shapes
- modulesRoot is populated with shape arrays
- Render loop runs at ~60 FPS
- No memory leaks on unmount

**Testing**:
```javascript
// In browser console after mounting
console.log(window.DEBUG_modulesRoot); // Should show arrays with shapes
```

### Phase 3: Camera Integration

**Goal**: Wire PresetManager camera values to Three.js camera

**Tasks**:
- [ ] Register camera setters in CanvasVisualizer
- [ ] Apply camera.distance, camera.height, camera.rotation from preset
- [ ] Add camera interpolation for smooth transitions
- [ ] Implement fallback to legacy camera logic if no preset loaded

**Files to Modify**:
- `src/CanvasVisualizer.tsx`: Register camera setters
- `src/ui/CanvasPane.tsx`: Apply camera values from PresetManager

**Acceptance**:
- Loading hammerhead preset moves camera according to automations
- Camera rotates smoothly over 30 seconds
- Scrubbing timeline updates camera position immediately

### Phase 4: Audio Analysis

**Goal**: Add audio loading and frequency analysis

**Tasks**:
- [ ] Add audio file upload to UI
- [ ] Create Web Audio API context and analyser
- [ ] Extract frequency bands (bass, mids, highs)
- [ ] Pass audio snapshot to PresetManager.evaluate()

**Files to Modify**:
- `src/ui/LeftToolbox.tsx`: Add audio file upload
- `src/ui/CanvasPane.tsx`: Add audio context and analysis
- Create `src/lib/audioAnalysis.ts`: Helper functions

**Acceptance**:
- User can load an audio file
- Frequency bands are calculated each frame
- Audio-reactive parameters modulate with music
- No audio distortion or playback issues

### Phase 5: Shape Animations

**Goal**: Implement hammerhead preset shape animations

**Tasks**:
- [ ] Wire hammerhead-setup setters to actual scene objects
- [ ] Implement tail wave animation (sine wave on octahedrons)
- [ ] Implement forward movement with looping
- [ ] Implement head scale modulation
- [ ] Add defensive checks for missing objects

**Files to Modify**:
- `src/presets/implementations/hammerhead-setup.ts`: Complete implementation

**Acceptance**:
- Tail segments wave side-to-side realistically
- Shapes move forward and loop seamlessly
- Head scales with mids frequency band
- No crashes if scene structure is unexpected

### Phase 6: Particle Effects

**Goal**: Implement particle burst events

**Tasks**:
- [ ] Create or integrate particle system
- [ ] Register particleBurst action in hammerhead-setup
- [ ] Trigger bursts at event times
- [ ] Apply color and count from event args

**Files to Modify**:
- `src/presets/implementations/hammerhead-setup.ts`: Complete particleBurst action
- `src/lib/particleSystem.ts`: Ensure ParticleEmitter has burst() method

**Acceptance**:
- Particle bursts fire at times 5, 10, 15, 20, 25 seconds
- Each burst has correct count and color
- Particles fade out over time
- Performance remains stable (>30 FPS)

### Phase 7: Timeline UI

**Goal**: Build interactive timeline with playback controls

**Tasks**:
- [ ] Implement timeline ruler with time markers
- [ ] Add scrubbing support (click/drag to seek)
- [ ] Connect play/pause/stop buttons
- [ ] Show current time indicator
- [ ] Display automation lanes (basic)

**Files to Modify**:
- `src/ui/TimelinePane.tsx`: Complete implementation
- Create `src/lib/timelineUtils.ts`: Helper functions

**Acceptance**:
- User can click timeline to seek
- Play button starts playback from current time
- Pause button stops playback
- Time indicator updates smoothly

### Phase 8: Preset Library UI

**Goal**: Add UI to load preset JSON files

**Tasks**:
- [ ] List available presets in LeftToolbox
- [ ] Add file upload for custom presets
- [ ] Load preset into PresetManager on selection
- [ ] Show active preset name in UI

**Files to Modify**:
- `src/ui/LeftToolbox.tsx`: Add preset loading logic
- `src/CanvasVisualizer.tsx`: Handle preset loading events

**Acceptance**:
- Clicking "Hammerhead Shark" loads hammerhead.json
- User can upload and load custom preset JSON
- Active preset name is displayed
- Loading new preset resets timeline to t=0

### Phase 9: Inspector Controls

**Goal**: Build inspector panel with live parameter editing

**Tasks**:
- [ ] Display camera controls with live sliders
- [ ] Show preset parameters
- [ ] Allow manual parameter overrides
- [ ] Update scene in real-time as user adjusts values

**Files to Modify**:
- `src/ui/InspectorPane.tsx`: Complete implementation

**Acceptance**:
- Camera sliders update camera in real-time
- Preset parameters are editable
- Changes are applied immediately to scene
- Overrides are cleared when preset reloads

### Phase 10: Export Functionality

**Goal**: Enable video export of preset playback

**Tasks**:
- [ ] Add export controls to TopBar
- [ ] Implement frame-by-frame rendering
- [ ] Use MediaRecorder API or canvas capture
- [ ] Export as MP4 or WebM video

**Files to Modify**:
- `src/ui/TopBar.tsx`: Add export button
- Create `src/lib/videoExport.ts`: Export logic
- `src/ui/CanvasPane.tsx`: Support frame-by-frame mode

**Acceptance**:
- User can export preset as video
- Video matches preview exactly
- Export includes audio track
- Progress indicator shows export status

### Phase 11: Polish & Optimization

**Goal**: Performance improvements and user experience enhancements

**Tasks**:
- [ ] Add keyboard shortcuts
- [ ] Improve loading states and feedback
- [ ] Optimize render loop (reduce allocations)
- [ ] Add error handling and user-friendly messages
- [ ] Seeded RNG for deterministic animations

**Files to Modify**:
- All components (minor improvements)
- `src/presets/PresetManager.ts`: Add seeded RNG

**Acceptance**:
- No visible lag during playback
- Clear error messages if preset is invalid
- Keyboard shortcuts work as expected
- Exports are deterministic (same input = same output)

## Task Ownership Format

Each task in the roadmap follows this structure:

```markdown
### Task ID: [Brief Description]

**Goal**: One-sentence summary

**Files to Change**:
- path/to/file.ts: What to change

**Acceptance Criteria**:
- Specific, testable outcome 1
- Specific, testable outcome 2

**Testing Steps**:
1. Step-by-step manual test
2. Expected result

**Dependencies**: [None | Task IDs this depends on]
```

## Success Criteria

The implementation is complete when:

1. ✅ All features from VisualizerEditor and visualizer-software are available in CanvasVisualizer
2. ✅ At least 3 presets are fully functional (hammerhead + 2 others)
3. ✅ Export produces deterministic, frame-accurate video
4. ✅ Performance is acceptable (>30 FPS during recording, >60 FPS during preview)
5. ✅ Feature flag toggle works reliably
6. ✅ No TypeScript errors or console warnings

## Rollback Plan

If critical issues are discovered:

1. Set `localStorage.setItem('unifiedVisualizer', 'false')` to use legacy mode
2. Or restore original files: `git mv src/archived/*.backup src/`
3. Or revert the entire PR branch

Original files remain in `src/archived/` until full deprecation is confirmed.

## Developer Notes

### Conventions

- **Setters**: `(value: any, ctx: PresetContext) => void` - Mutate Three.js objects directly
- **Actions**: `(args: any, ctx: PresetContext) => void` - One-time operations
- **Automations**: Interpolate between keyframes with easing functions
- **Audio Reactive**: Modulate parameters based on frequency bands

### Code Style

- Use TypeScript for all new code
- Use functional React components with hooks
- Store Three.js objects in refs, not state
- Avoid allocations in render loop (hot path)
- Clean up resources in useEffect cleanup functions

### Testing Checklist

Before merging any PR:

- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Both modes work (legacy and unified)
- [ ] No console errors in either mode
- [ ] Manual test of changed functionality passes

## Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [React Hooks](https://react.dev/reference/react)

## Contact

For questions or to claim a task, open an issue or PR on the GitHub repository.

---

**Last Updated**: 2026-01-11  
**Status**: Phase 1 Complete, Phase 2 Next
