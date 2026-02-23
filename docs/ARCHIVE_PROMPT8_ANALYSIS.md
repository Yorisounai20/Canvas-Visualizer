# Prompt #8 Analysis - Complete Variable Inventory

## Status: Analysis Complete ✅

The animation loop (lines 4043-4942) uses approximately **80+ variables** from component scope.

## Critical Findings:

### 1. Helper Functions Already Exist (Lines 1345-1390)
- `getCurrentPreset(time?: number)` - Determines preset at given time
- `getCurrentPresetSpeed(time?: number)` - Gets preset speed multiplier
- `getFreq(data: Uint8Array)` - Extracts { bass, mids, highs } from analyser

These should be **passed to renderSingleFrame** or made available in its scope.

### 2. Preset Solvers (Extracted to separate files)
- `solveOrbit({...})` - from `lib/presets/orbit.ts` or similar
- All other preset logic is inline in the animation loop

### 3. State Variables by Category:

#### A. Essential Refs (3)
- `sceneRef`, `cameraRef`, `rendererRef`, `analyserRef`, `objectsRef`
- `composerRef`, `particleManagerRef`
- Plus many more...

#### B. State Variables (30+)
- Duration, camera settings
- Colors (cube, octahedron, tetrahedron, sphere, bass, mids, highs)
- Keyframe arrays (preset, letterbox, camera rig, text animator, etc.)
- Effects (vignette, saturation, contrast, color tint)
- Shake settings (intensity, frequency)
- Audio tracks, parameter events

#### C. Calculated Values (8)
- `activeCameraDistance, activeCameraHeight, activeCameraRotation`
- `shakeX, shakeY, shakeZ`
- `eventShakeX, eventShakeY, eventShakeZ`
- `blend`

## Best Approach for renderSingleFrame:

Create a **single context object** that wraps everything, rather than individual parameters:

```typescript
interface AnimationFrameContext {
  // Three.js objects
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer | null;
  
  // Object pool
  objects: ObjectPool;
  
  // Audio and particles
  analyser: AnalyserNode | null;
  particleManager: ParticleManager | null;
  
  // State
  duration: number;
  cameraSettings: { distance: number; height: number; rotation: number };
  colors: { cube: string; octahedron: string; tetrahedron: string; sphere: string; ... };
  effects: { vignette: number; saturation: number; ... };
  keyframes: { preset: PresetKeyframe[]; letterbox: LetterboxKeyframe[]; ... };
  
  // Refs that need to be shared
  refs: {
    prevAnimRef: React.MutableRefObject<string | null>;
    transitionRef: React.MutableRefObject<number>;
    // ... plus others
  };
  
  // Helper functions
  helpers: {
    getCurrentPreset: (time: number) => string;
    getCurrentPresetSpeed: (time: number) => number;
    getFreq: (data: Uint8Array) => FrequencyData;
  };
}
```

## Next Step: You Need to Tell Me:

Do you want me to:

**Option A:** Create the full `renderSingleFrame` function signature with all parameters documented?

**Option B:** Create a helper function that bundles all animation context into a single object first, then pass that?

**Option C:** Modify the animation loop itself to support frame-by-frame mode detection (using `isFrameByFrameModeRef`)?
