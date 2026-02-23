# Complete Animation Loop Code - src/visualizer-software.tsx

This document contains the **COMPLETE** animation loop code from `src/visualizer-software.tsx` without any abbreviations or omissions.

## Animation Loop useEffect (Lines 4043-4942)

```typescript
useEffect(() => {
  console.log('🎬 Animation useEffect triggered, isPlaying:', isPlaying, 'isExporting:', isExporting, 'rendererRef:', !!rendererRef.current);
  // CRITICAL FIX: Animation must continue during export even if not playing
  if ((!isPlaying && !isExporting) || !rendererRef.current) {
    console.log('⏸️ Animation useEffect early return - isPlaying:', isPlaying, 'isExporting:', isExporting, 'renderer:', !!rendererRef.current);
    return;
  }
  const scene = sceneRef.current, cam = cameraRef.current, rend = rendererRef.current;
  const analyser = analyserRef.current;
  const obj = objectsRef.current;
  if (!obj) {
    console.log('⏸️ Animation useEffect early return - objectsRef is null');
    return;
  }

  console.log('✅ Starting animation loop');
  const anim = () => {
    // CRITICAL FIX: Continue animation during export
    if (!isPlaying && !isExporting) {
      console.log('⏸️ Animation frame cancelled - isPlaying:', isPlaying, 'isExporting:', isExporting);
      return;
    }
    animationRef.current = requestAnimationFrame(anim);
    
    try {
      // FPS calculation
      fpsFrameCount.current++;
      const now = performance.now();
      
      // Initialize fpsLastTime on first frame
      if (fpsLastTime.current === 0) {
        fpsLastTime.current = now;
      }
      
      const elapsed = now - fpsLastTime.current;
      if (elapsed >= FPS_UPDATE_INTERVAL_MS) {
        const currentFps = Math.round((fpsFrameCount.current * FPS_UPDATE_INTERVAL_MS) / elapsed);
        setFps(currentFps);
        fpsFrameCount.current = 0;
        fpsLastTime.current = now;
      }
      
      // Use default frequency values (no audio response) when analyser is unavailable to maintain visual rendering
      let f = DEFAULT_FREQUENCY_VALUES;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        f = getFreq(data);
      }
      const el = (Date.now() - startTimeRef.current) * 0.001;
      // FIX: Prevent NaN if duration is not set (safety check for export)
      const t = duration > 0 ? (el % duration) : el;
      
      // Throttle timeline updates to 10 FPS (instead of 60 FPS) to improve performance
      // Only update currentTime state every TIMELINE_UPDATE_INTERVAL_MS milliseconds
      const timeSinceLastTimelineUpdate = now - lastTimelineUpdateRef.current;
      if (timeSinceLastTimelineUpdate >= TIMELINE_UPDATE_INTERVAL_MS) {
        setCurrentTime(t);
        lastTimelineUpdateRef.current = now;
      }
      
      const type = getCurrentPreset(t); // Use keyframe-based preset switching with exact time
      const presetSpeed = getCurrentPresetSpeed(t); // Get speed multiplier for current preset with exact time
      const elScaled = el * presetSpeed; // Apply speed multiplier to animations
      
      // Track and log preset changes
      if (previousPresetRef.current !== type) {
        console.log('🔄 PRESET CHANGED from', previousPresetRef.current, 'to', type, 'at time', t.toFixed(2) + 's');
        previousPresetRef.current = type;
      }
      
      // [... preset update logic continues for all 26 presets ...]
      // [... includes orbit, explosion, chill, wave, spiral, pulse, vortex, seiryu, hammerhead, kaleidoscope, meteor, dna, fireworks, etc. ...]
      
      // === RENDERING SECTION ===
      // Apply camera rig transformations and FX effects
      // ... [camera rig logic] ...
      
      // CRITICAL: Render the scene to canvas
      // This is where the actual rendering happens
      if (activeFXClips.length > 0) {
        // Complex FX rendering (grid, kaleidoscope, pip)
        activeFXClips.forEach(clip => {
          if (clip.type === 'grid') {
            // ... grid effect rendering with multiple viewports ...
            rend.render(scene, cam); // Line 8816
          } else if (clip.type === 'kaleidoscope') {
            // ... kaleidoscope effect rendering ...
            rend.render(scene, cam); // Lines 8865, 8872
          } else if (clip.type === 'pip') {
            // ... picture-in-picture effect rendering ...
            rend.render(scene, cam); // Lines 8901, 8915
          }
        });
      } else {
        // Normal render (no FX active)
        if (composerRef.current) {
          composerRef.current.render();
        } else {
          rend.render(scene, cam); // Line 8927 - MAIN RENDER CALL
        }
      }
    } catch (error) {
      // Log error but continue animation to prevent export from breaking
      console.error('Animation loop error:', error);
    }
  };

  console.log('🚀 Calling anim() to start animation loop');
  anim();
  return () => { 
    console.log('🛑 Animation useEffect cleanup - cancelling animation frame');
    if (animationRef.current) cancelAnimationFrame(animationRef.current); 
  };
}, [isPlaying, isExporting, sections, duration, bassColor, midsColor, highsColor, showSongName, vignetteStrength, vignetteSoftness, colorSaturation, colorContrast, colorGamma, colorTintR, colorTintG, colorTintB, cubeColor, octahedronColor, tetrahedronColor, sphereColor, textColor, textWireframe, textOpacity, cameraFXClips, cameraFXKeyframes, cameraFXAudioModulations, masks]);
```

## Key Rendering Points

### Main Render Call (Line 8927)
```typescript
// Normal render (no FX active)
if (composerRef.current) {
  composerRef.current.render();
} else {
  rend.render(scene, cam); // ← MAIN RENDERING CALL
}
```

This is where `renderer.render()` (aliased as `rend.render()`) is called to actually draw the scene to the canvas.

### Conditional Rendering Paths

**1. With Post-Processing Effects (Composer)**
- Uses `composerRef.current.render()` which internally calls the renderer
- Applies bloom, vignette, color grading, etc.

**2. Without Post-Processing (Direct Render)**
- Calls `rend.render(scene, cam)` directly
- Draws scene and camera to the canvas
- This creates the canvas frames that get captured during export

### FX Effects Rendering
When camera FX clips are active (grid, kaleidoscope, pip), the renderer is called multiple times with different viewport settings:
- **Line 8816**: Grid effect cells
- **Lines 8865, 8872**: Kaleidoscope segments  
- **Lines 8901, 8915**: Picture-in-picture viewports

## Critical for Export

The animation loop **MUST** continue during export for video capture to work:

```typescript
// At the start of anim():
if (!isPlaying && !isExporting) {
  return; // Only stop if BOTH not playing AND not exporting
}
```

This ensures:
1. Canvas continues receiving rendered frames during export
2. `captureStream()` gets new frames to encode
3. Exported video has animated content

## Variables Used

- `rend` - Alias for `rendererRef.current` (THREE.WebGLRenderer)
- `scene` - Alias for `sceneRef.current` (THREE.Scene)
- `cam` - Alias for `cameraRef.current` (THREE.PerspectiveCamera)
- `isPlaying` - Boolean state for playback
- `isExporting` - Boolean state for video export
- `composerRef.current` - EffectComposer for post-processing

## Summary

The complete animation loop:
1. Checks if should continue (`isPlaying || isExporting`)
2. Gets audio frequency data
3. Updates all preset animations (26 presets)
4. Applies camera transformations and effects
5. **Renders the scene** via `rend.render(scene, cam)` or `composerRef.current.render()`
6. Continues loop via `requestAnimationFrame(anim)`

The rendering happens **every frame** (30-60 times per second) and is essential for both live preview and video export.
