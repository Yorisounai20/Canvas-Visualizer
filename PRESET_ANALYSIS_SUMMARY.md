# Preset Analysis Summary - Quick Reference

## The Critical Discovery

**NO .animate() METHODS EXIST IN THE CODEBASE!**

## The 4 Questions - Answered

### 1. How is preset TYPE determined?

```typescript
const type = getCurrentPreset(t);  // Line 4694
```
- Returns a **STRING** like `'orbit'`, `'explosion'`, `'chill'`
- NOT an object, NOT a class instance

### 2. What happens AFTER getting preset type?

```typescript
const presetSpeed = getCurrentPresetSpeed(t);
const elScaled = el * presetSpeed;

// Transition handling
if (type !== prevAnimRef.current) {
  transitionRef.current = 0;  // Fade in
}
const blend = transitionRef.current;
```

### 3. How are objects updated?

**Uses if/else statements with THREE patterns:**

```typescript
if (type === 'empty') {
  // Pattern 1: Direct hiding
  obj.sphere.position.set(0, -1000, 0);
  
} else if (type === 'orbit') {
  // Pattern 2: Solver function
  solveOrbit({ time, audio, pool, blend, camera, ... });
  
} else if (type === 'explosion') {
  // Pattern 3: Inline manipulation
  obj.cubes.forEach((c, i) => {
    c.position.set(...);
    c.rotation.x += ...;
  });
}
```

### 4. .animate() or direct manipulation?

**100% DIRECT MANIPULATION - NO .animate() CALLS!**

## Why renderSingleFrame Failed

```typescript
// ❌ WRONG CODE (what we had):
preset.animate(obj, f, elScaled);
// TypeError: fd.animate is not a function

// Why it failed:
// 1. `type` is a STRING, not an object
// 2. No preset objects exist
// 3. No .animate() methods exist
// 4. Can't call methods on strings!
```

## How Animation Loop ACTUALLY Works

```typescript
// Main loop structure:
const type = getCurrentPreset(t);  // Returns string

if (type === 'empty') {
  cam.position.set(...);
  obj.sphere.position.set(0, -1000, 0);  // Hide
  obj.cubes.forEach(c => c.position.set(0, -1000, 0));
  
} else if (type === 'orbit') {
  solveOrbit({  // Call imported function
    time: elScaled,
    audio: { bass: f.bass, mids: f.mids, highs: f.highs },
    pool: obj,
    blend,
    camera: cam,
    // ... all parameters
  });
  
} else if (type === 'explosion') {
  cam.position.set(0, activeCameraHeight, activeCameraDistance - f.bass*10);
  obj.sphere.position.set(0, 0, 0);
  obj.sphere.scale.set(1.5+f.bass+f.mids*0.5, ...);
  
  obj.cubes.forEach((c, i) => {
    const rad = 15 + f.bass * 10;
    const a = (i / obj.cubes.length) * Math.PI * 2;
    c.position.set(Math.cos(a+el)*rad, Math.sin(a+el)*rad, ...);
    c.rotation.x += 0.05 + f.bass * 0.1;
    c.scale.set(2 + f.bass * 1.5, ...);
    c.material.opacity = (0.6 + f.bass * 0.4) * blend;
  });
  
  obj.octas.forEach((o, i) => {
    // Direct manipulation...
  });
}
// ... 27 total presets
```

## The Fix for renderSingleFrame

**Must copy the EXACT if/else structure:**

```typescript
const renderSingleFrame = (frameNumber, time, frequencies) => {
  // Setup
  const scene = sceneRef.current;
  const cam = cameraRef.current;
  const rend = rendererRef.current;
  const obj = objectsRef.current;
  
  // Time simulation
  startTimeRef.current = Date.now() - (time * 1000);
  const el = time;
  const t = time % duration;
  
  // Get preset info
  const type = getCurrentPreset(t);
  const presetSpeed = getCurrentPresetSpeed(t);
  const elScaled = el * presetSpeed;
  const f = frequencies;
  
  // Transitions
  if (prevAnimRef.current !== type) {
    transitionRef.current = 0;
    prevAnimRef.current = type;
  }
  const blend = transitionRef.current;
  
  // ✅ COPY THE EXACT IF/ELSE CHAIN FROM ANIMATION LOOP
  if (type === 'empty') {
    // Copy lines 4998-5027
  } else if (type === 'orbit') {
    // Copy lines 5028-5063
    solveOrbit({ ... });
  } else if (type === 'explosion') {
    // Copy lines 5064-5123
  } else if (type === 'chill') {
    // Copy lines 5124-5178
  }
  // ... continue for all 27 presets
  
  // Render
  composerRef.current?.render() || rend.render(scene, cam);
};
```

## Key Takeaways

1. **Presets = Strings** (`'orbit'`, `'explosion'`, etc.)
2. **No Objects** (no `OrbitPreset` class)
3. **No Methods** (no `.animate()` function)
4. **If/Else Logic** (not switch, not loops)
5. **Direct Manipulation** (Three.js properties)
6. **One Solver** (only `solveOrbit()` is external)

## Full Documentation

See `ANIMATION_LOOP_PRESET_STRUCTURE.md` for:
- Complete code examples
- All 27 presets listed
- Line-by-line breakdown
- Detailed explanations
- Fix template

## Bottom Line

**The animation loop doesn't use .animate() - it uses direct if/else branching with inline Three.js code.**

**renderSingleFrame must do the same!**
