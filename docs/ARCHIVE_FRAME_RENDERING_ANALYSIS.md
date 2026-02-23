# Frame-by-Frame Export - Variable Analysis

## Variables Used in Animation Loop (Lines 4043-4942)

### CRITICAL REFS (Must be passed)
- `sceneRef.current` - The Three.js scene
- `cameraRef.current` - The camera (cam)
- `rendererRef.current` - The renderer (rend)
- `analyserRef.current` - Audio analyser
- `objectsRef.current` - Object pool with cubes, octas, tetras, sphere, toruses, planes
- `particleManagerRef.current` - Particle system
- `composerRef.current` - Post-processing composer (if any)
- `cameraShakesRef.current` (implied, used in loop)
- `audioTracksRef.current` - Audio tracks for automated events
- `activeAutomatedEventsRef.current` - Active automated events map
- `skyboxMeshRef.current` - Skybox mesh
- `sceneRef.current` - Scene for particle emitter additions

### STATE VARIABLES (Must be passed)
- `duration` - Video duration
- `cameraDistance` - Camera distance
- `cameraHeight` - Camera height
- `cubeColor` - Cube color (hex string)
- `octahedronColor` - Octahedron color (hex string)
- `tetrahedronColor` - Tetrahedron color (hex string)
- `sphereColor` - Sphere color (hex string)
- `showLetterbox` - Boolean
- `useLetterboxAnimation` - Boolean
- `sortedLetterboxKeyframes` - Array of letterbox keyframes
- `parameterEvents` - Array of parameter events
- `cameraShakeFrequency` - Number
- `cameraShakeIntensity` - Number
- `particleEmitterKeyframes` - Array of particle keyframes
- `sections` - Array of preset keyframes
- `presetKeyframes` - Array of preset keyframes
- `presetSpeedKeyframes` - Array of preset speed keyframes
- `isExporting` - Boolean (to check if in export mode)
- `textKeyframes` - Array of text keyframes
- `textAnimatorKeyframes` - Array of text animator keyframes
- `letterboxKeyframes` - Array of letterbox keyframes
- `environmentKeyframes` - Array of environment keyframes
- `cameraRigKeyframes` - Array of camera rig keyframes
- `cameraFXClips` - Array of camera FX clips
- `cameraFXKeyframes` - Array of camera FX keyframes
- `cameraFXAudioModulations` - Array of audio modulation rules
- `masks` - Array of masks
- `vignetteStrength` - Number
- `vignetteSoftness` - Number
- `colorSaturation` - Number
- `colorContrast` - Number
- `colorGamma` - Number
- `colorTintR, colorTintG, colorTintB` - Color tint values
- `bassColor, midsColor, highsColor` - Color values
- `showSongName` - Boolean
- `customSongName` - String
- `textColor` - Color hex string
- `textWireframe` - Boolean
- `textOpacity` - Number
- `selectedPresetFont` - String
- `fontRef.current` - Font object

### CALCULATED VALUES (Derived in animation loop)
- `activeCameraDistance = cameraDistance`
- `activeCameraHeight = cameraHeight`
- `activeCameraRotation = 0` (always 0)
- `shakeX, shakeY, shakeZ` - Calculated from cameraShakes
- `eventShakeX, eventShakeY, eventShakeZ` - Calculated from parameter events
- `blend` - Transition blend value (0-1)
- `f` (frequencies) - From analyser: { bass, mids, highs }
- `t` - Current time in animation (from el)
- `type` - Current preset type (from getCurrentPreset)
- `presetSpeed` - Speed multiplier (from getCurrentPresetSpeed)
- `elScaled` - Elapsed time scaled by preset speed

### HELPER FUNCTIONS (Must be passed or extracted)
- `getCurrentPreset(t)` - Get current preset at time t
- `getCurrentPresetSpeed(t)` - Get speed multiplier at time t
- `getFreq(data)` - Extract frequency bands from audio data
- `solveOrbit({...})` - Solver function
- And all other preset solver functions (solveExplosion, solveChill, etc.)

### CONSTANTS (From component scope)
- `DEFAULT_FREQUENCY_VALUES` - Default audio values
- `KEYFRAME_ONLY_ROTATION_SPEED` - Rotation speed constant
- `FULL_OPACITY` - 1.0
- `TRANSITION_SPEED` - Fade speed value

## What renderSingleFrame Needs to Do:

```typescript
renderSingleFrame(
  frameTime: number,  // Time in seconds
  frequencies: { bass: number; mids: number; highs: number },
  animationContext: {
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    composer: EffectComposer | null,
    objects: ObjectPool,
    particleManager: ParticleManager | null,
    analyser: AnalyserNode | null,
    audioTracks: AudioTrack[],
    activeAutomatedEvents: Map<string, number>,
    skyboxMesh: THREE.Mesh | null
  },
  stateContext: {
    duration: number,
    camera: { distance: number; height: number; rotation: number },
    colors: {
      cube: string,
      octahedron: string,
      tetrahedron: string,
      sphere: string,
      bass: string,
      mids: string,
      highs: string
    },
    showLetterbox: boolean,
    useLetterboxAnimation: boolean,
    letterboxKeyframes: LetterboxKeyframe[],
    parameterEvents: ParameterEvent[],
    cameraShakes: CameraShake[],
    textKeyframes: TextKeyframe[],
    textAnimatorKeyframes: TextAnimatorKeyframe[],
    letterboxKeyframes: LetterboxKeyframe[],
    environmentKeyframes: EnvironmentKeyframe[],
    cameraRigKeyframes: CameraRigKeyframe[],
    cameraFXClips: CameraFXClip[],
    cameraFXKeyframes: CameraFXKeyframe[],
    masks: Mask[],
    // ... plus all other state
  },
  refContext: {
    refs: {
      prevAnimRef,
      transitionRef,
      activeEmitterIds,
      activeAutomatedEvents,
      cameraShakes,
      // ... plus all other refs
    }
  }
)
```

## Implementation Strategy:

1. **Pass entire animation context** as a single parameter object instead of individual parameters
2. **Extract helper functions** (getCurrentPreset, getCurrentPresetSpeed) so they're reusable
3. **Keep same logic** but make it frame-by-frame instead of continuous
4. **Return blob** of rendered frame instead of rendering to screen
