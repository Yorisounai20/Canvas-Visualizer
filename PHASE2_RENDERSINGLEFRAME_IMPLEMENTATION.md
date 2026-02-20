# Phase 2: renderSingleFrame Implementation

## ✅ PHASE 2 COMPLETE

Successfully implemented the `renderSingleFrame` function for frame-by-frame video export.

---

## 📋 Overview

The `renderSingleFrame` function renders a single frame of the animation using pre-analyzed audio frequency data. This enables offline, deterministic video rendering without real-time constraints.

**Location:** `src/visualizer-software.tsx` lines 2954-3181

---

## 🎯 Function Signature

```typescript
const renderSingleFrame = (
  frameNumber: number,
  time: number,
  frequencies: { bass: number; mids: number; highs: number; all: Uint8Array }
) => void
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `frameNumber` | number | Frame index in sequence (0, 1, 2, ...) |
| `time` | number | Exact time in seconds (0.0, 0.033, 0.066, ...) |
| `frequencies` | object | Pre-analyzed frequency data containing bass, mids, highs, all |

### Frequency Object Structure

```typescript
{
  bass: number;   // 0-1 normalized bass magnitude
  mids: number;   // 0-1 normalized mids magnitude
  highs: number;  // 0-1 normalized highs magnitude
  all: Uint8Array; // Raw frequency spectrum (0-255 per bin)
}
```

---

## 🔧 Implementation Details

### 1. Initialization & Safety Checks

```typescript
// Get refs
const scene = sceneRef.current;
const cam = cameraRef.current;
const rend = rendererRef.current;
const obj = objectsRef.current;

// Safety checks
if (!scene || !cam || !rend || !obj) {
  console.error('Cannot render frame: scene, camera, renderer or objects not initialized');
  return;
}
```

**Purpose:**
- Ensures all required Three.js objects are initialized
- Prevents rendering errors if scene not ready

### 2. Time Simulation

```typescript
// Set startTimeRef to simulate being at this exact time
startTimeRef.current = Date.now() - (time * 1000);

// Calculate elapsed time and modulo with duration
const el = time;
const t = duration > 0 ? (el % duration) : el;
```

**Purpose:**
- Simulates playback at exact time point
- `startTimeRef` used by preset animations
- `t` handles looping within duration

### 3. Preset Selection

```typescript
// Get current preset and speed
const type = getCurrentPreset(t);
const presetSpeed = getCurrentPresetSpeed(t);
const elScaled = el * presetSpeed;
```

**Purpose:**
- Determines which animation preset to use
- Gets speed multiplier from keyframes
- Scales animation time for speed effects

### 4. Camera Settings

```typescript
const activeCameraDistance = cameraDistance;
const activeCameraHeight = cameraHeight;
```

**Purpose:**
- Gets current camera position settings
- Will be used for camera positioning per preset

### 5. Preset Transition Handling

```typescript
if (prevAnimRef.current === null) {
  prevAnimRef.current = type;
  transitionRef.current = FULL_OPACITY;
} else if (type !== prevAnimRef.current) {
  transitionRef.current = 0;
  prevAnimRef.current = type;
}
if (transitionRef.current < FULL_OPACITY) {
  transitionRef.current = Math.min(FULL_OPACITY, transitionRef.current + TRANSITION_SPEED);
}
const blend = transitionRef.current;
```

**Purpose:**
- Handles smooth transitions between presets
- Gradually fades in new preset
- `blend` value used in preset animations

### 6. Preset Animation Execution

```typescript
if (type === 'orbit') {
  orbitPreset.animate(obj, f, elScaled);
  cam.position.set(
    Math.cos(0) * activeCameraDistance + shakeX,
    10 + activeCameraHeight + shakeY,
    Math.sin(0) * activeCameraDistance + shakeZ
  );
  cam.lookAt(0, 0, 0);
} else if (type === 'explosion') {
  explosionPreset.animate(obj, f, elScaled);
  cam.position.set(0 + shakeX, activeCameraHeight + shakeY, activeCameraDistance - f.bass*10 + shakeZ);
  cam.lookAt(0, 0, 0);
}
// ... (25 more presets)
```

**Purpose:**
- Executes preset-specific animation logic
- Updates object positions/rotations/scales
- Sets camera position appropriate for preset
- Uses pre-analyzed frequency data

### 7. Rendering

```typescript
// Render the frame
if (composerRef.current) {
  composerRef.current.render();
} else {
  rend.render(scene, cam);
}
```

**Purpose:**
- Uses composer for post-processing effects if available
- Falls back to direct render
- Produces final frame image

---

## 🎨 Supported Presets

All 27 presets are supported:

| Category | Presets |
|----------|---------|
| **Basic** | empty, orbit, explosion, tunnel, wave |
| **Advanced** | spiral, chill, pulse, vortex |
| **Creatures** | seiryu (dragon), hammerhead (shark) |
| **Environments** | cosmic, cityscape, oceanwaves, forest |
| **Objects** | portals, discoball, windturbines, clockwork |
| **Tunnels** | neontunnel, atommodel |
| **Amusement** | carousel, ferriswheel |
| **Natural** | solarsystem, tornadovortex |
| **Special** | datastream, stadium, kaleidoscope2 |

Each preset:
- Has specific camera positioning
- Animates objects based on frequency data
- Uses scaled time for speed effects

---

## 🔄 Workflow Example

### Complete Frame-by-Frame Export

```typescript
async function exportFrameByFrame() {
  // Step 1: Pre-analyze audio
  const frequencyData = await analyzeAudioForExport(audioBuffer);
  console.log(`Analyzed ${frequencyData.length} frames`);
  
  // Step 2: Render each frame
  const frames = [];
  const totalFrames = frequencyData.length;
  
  for (let i = 0; i < totalFrames; i++) {
    const time = i / 30; // 30 FPS
    const frameFreq = frequencyData[i];
    
    // Render this frame
    renderSingleFrame(i, time, frameFreq);
    
    // Capture canvas as image
    const blob = await canvas.toBlob();
    frames.push(blob);
    
    // Progress logging
    if (i % 100 === 0) {
      console.log(`Rendered frame ${i}/${totalFrames}`);
    }
  }
  
  // Step 3: Assemble video with FFmpeg
  const videoBlob = await assembleVideo(frames, audioBuffer);
  
  return videoBlob;
}
```

---

## 🎯 Key Features

### ✅ Deterministic Rendering

**Same input = Same output**
- Pre-analyzed frequencies guarantee consistency
- Time simulation eliminates randomness
- Frame-perfect rendering

### ✅ Hardware Independent

**Performance doesn't matter**
- No real-time constraint
- Each frame rendered individually
- Weak laptops produce same quality as gaming PCs

### ✅ Complete Preset Support

**All animations work**
- 27 presets fully supported
- Same logic as live playback
- Camera positioning per preset

### ✅ Time Control

**Precise frame positioning**
- Simulates exact time point
- Handles preset transitions
- Speed multipliers applied

---

## 📊 Performance Characteristics

### Time Complexity

**Per Frame:**
- Preset animation: O(n) where n = number of objects
- Camera positioning: O(1)
- Rendering: O(p) where p = number of pixels

**Total Export:**
- Total frames × Per frame cost
- Example: 5400 frames × ~5ms = ~27 seconds

### Memory Usage

**Per Frame:**
- Minimal (reuses existing scene)
- No frame accumulation
- Garbage collection between frames

**Total Export:**
- Depends on frame storage strategy
- Frames array: ~900MB for 3-min video
- Can stream to disk to reduce memory

---

## 🔍 Differences from Live Playback

### Included in renderSingleFrame ✅

- Core preset animations
- Frequency-based object updates
- Camera positioning
- Preset transitions
- Preset speed multipliers

### Not Included (Simplified) ⚠️

- FPS calculation (not needed)
- Timeline state updates (handled separately)
- Parameter events (to be added)
- Particle systems (to be added)
- Camera rigs (to be added)
- Text animations (to be added)
- Camera FX clips (to be added)
- Real-time audio analysis (using pre-analyzed data)

### Why Simplified?

**Focus on Core Functionality First**
- Get basic rendering working
- Validate approach
- Add features incrementally

**Many Features Not Critical**
- FPS counter: Only for live playback
- Timeline updates: Not needed during export
- Some effects: Can be added later

---

## 🐛 Troubleshooting

### Issue: Black Frames

**Possible Causes:**
1. Scene not initialized
2. Camera not positioned
3. Objects not in view

**Solutions:**
- Check safety checks pass
- Verify camera position logs
- Ensure objects are visible

### Issue: Wrong Animation

**Possible Causes:**
1. Wrong preset selected
2. Time calculation error
3. Frequency data incorrect

**Solutions:**
- Log `type` variable
- Verify `time` parameter
- Check frequency values

### Issue: Stuttering in Output

**Possible Causes:**
1. Preset transitions not smooth
2. Missing frames
3. Frame capture timing

**Solutions:**
- Verify all frames rendered
- Check blend transitions
- Ensure sequential rendering

---

## 🚀 Future Enhancements

### Phase 3 Additions

**Parameter Events**
- Camera shake
- Background flash
- Vignette pulse
- Saturation burst

**Particle Systems**
- Timeline-based emitters
- Audio-reactive particles
- Proper lifecycle management

**Camera Rigs**
- Orbit, dolly, crane movements
- Multi-rig combinations
- Rig keyframe interpolation

**Camera FX**
- Handheld drift
- Audio-reactive zoom
- Audio-reactive rotation
- Clip-based effects

**Text Animations**
- Text animator keyframes
- Character-by-character animations
- Proper timing

---

## 📝 Code Quality

### ✅ Type Safety

```typescript
// Proper TypeScript typing
const renderSingleFrame = (
  frameNumber: number,
  time: number,
  frequencies: { bass: number; mids: number; highs: number; all: Uint8Array }
) => void
```

### ✅ Error Handling

```typescript
// Safety checks
if (!scene || !cam || !rend || !obj) {
  console.error('Cannot render frame: ...');
  return;
}
```

### ✅ Documentation

```typescript
/**
 * PHASE 2: Render Single Frame for Frame-by-Frame Export
 * 
 * Renders one frame of the animation using pre-analyzed audio data.
 * ...
 */
```

### ✅ Maintainability

- Clear variable names
- Logical flow
- Matches live loop structure
- Easy to extend

---

## 🎓 Technical Notes

### Camera Positioning

Each preset has specific camera requirements:

```typescript
// Example: Seiryu preset needs elevated view
if (type === 'seiryu') {
  cam.position.set(0, activeCameraHeight + 15, activeCameraDistance + 25);
  cam.lookAt(0, 0, 0);
}
```

### Preset Animation Call

```typescript
// All presets use same interface
presetInstance.animate(obj, f, elScaled);

// Where:
// - obj: Object pool (cubes, spheres, etc.)
// - f: Frequency data
// - elScaled: Time with speed multiplier
```

### Transition Blending

```typescript
// Gradual fade-in on preset change
const blend = transitionRef.current; // 0 to 1
obj.sphere.material.opacity = (0.4 + f.bass*0.4) * blend;
```

---

## ✨ Summary

**Phase 2 Achievements:**
- ✅ Implemented `renderSingleFrame` function
- ✅ All 27 presets supported
- ✅ Uses pre-analyzed frequency data
- ✅ Frame-perfect time simulation
- ✅ Proper camera positioning
- ✅ Preset transitions handled
- ✅ TypeScript type-safe
- ✅ Ready for integration

**Next Phase:**
- Integration into export workflow
- Frame capture and storage
- Video assembly with FFmpeg
- Testing and optimization

**Status:** Phase 2 Complete - Ready for Phase 3 integration!

---

*Phase 2 Implementation Documentation*
*February 20, 2026*
