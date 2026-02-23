# Animation Loop Preset Structure Analysis

## Purpose

This document explains exactly how presets are handled in the **original animation loop** (lines 4631-9500 in `src/visualizer-software.tsx`), answering the critical question: **"Why does `preset.animate()` cause an error?"**

---

## The 4 Critical Questions

### 1. How is the preset TYPE determined?

**Location:** Line 4694

```typescript
const type = getCurrentPreset(t);  // Use keyframe-based preset switching with exact time
```

**What it returns:**
- A **string identifier** like:
  - `'empty'`
  - `'orbit'`
  - `'explosion'`
  - `'chill'`
  - `'wave'`
  - `'spiral'`
  - `'pulse'`
  - `'vortex'`
  - `'seiryu'`
  - And many more...

**How it works:**
- `getCurrentPreset(t)` looks at the `presetKeyframes` array
- Finds which keyframe is active at time `t`
- Returns the preset name as a string
- NOT an object, NOT a class instance - just a string!

---

### 2. What happens AFTER getting the preset type?

**Location:** Lines 4695-4996

```typescript
// Line 4695: Get speed multiplier for current preset
const presetSpeed = getCurrentPresetSpeed(t);

// Line 4696: Apply speed multiplier to animations
const elScaled = el * presetSpeed;

// Lines 4985-4996: Handle transitions between presets
if (prevAnimRef.current === null) {
  // First animation - no fade in, start at full opacity
  prevAnimRef.current = type;
  transitionRef.current = FULL_OPACITY;
} else if (type !== prevAnimRef.current) {
  // Transitioning to a new preset - fade in from 0
  transitionRef.current = 0;
  prevAnimRef.current = type;
}
if (transitionRef.current < FULL_OPACITY) {
  transitionRef.current = Math.min(FULL_OPACITY, transitionRef.current + TRANSITION_SPEED);
}
const blend = transitionRef.current;  // Used to fade in/out objects
```

**Summary:**
1. Calculate time-scaled animation value (`elScaled = el * presetSpeed`)
2. Detect preset changes
3. Manage transition opacity (`blend` value from 0 to 1)
4. Use `blend` to fade objects in/out during transitions

---

### 3. How are objects actually updated for each preset?

**CRITICAL: The animation loop uses `if/else` statements, NOT method calls!**

**Location:** Lines 4998-9400+

The loop uses **THREE patterns** for updating objects:

#### Pattern 1: Direct Hiding (empty preset)

**Lines 4998-5027:**

```typescript
if (type === 'empty') {
  // Empty preset - hide all shapes, only show camera position
  cam.position.set(0 + shakeX, activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
  cam.lookAt(0, 0, 0);
  
  // Hide sphere
  obj.sphere.position.set(0, -1000, 0);
  obj.sphere.scale.set(0.001, 0.001, 0.001);
  obj.sphere.material.opacity = 0;
  
  // Hide all cubes
  obj.cubes.forEach((c) => {
    c.position.set(0, -1000, 0);
    c.scale.set(0.001, 0.001, 0.001);
    c.material.opacity = 0;
  });
  
  // Hide all octahedrons
  obj.octas.slice(0, 30).forEach((o) => {
    o.position.set(0, -1000, 0);
    o.scale.set(0.001, 0.001, 0.001);
    o.material.opacity = 0;
  });
  
  // Hide all tetrahedrons
  obj.tetras.forEach((t) => {
    t.position.set(0, -1000, 0);
    t.scale.set(0.001, 0.001, 0.001);
    t.material.opacity = 0;
  });
}
```

#### Pattern 2: Solver Function Call (orbit preset)

**Lines 5028-5063:**

```typescript
else if (type === 'orbit') {
  // PR 4: Solver pattern - extracted to orbitSolver.ts
  solveOrbit({
    time: elScaled,
    audio: { bass: f.bass, mids: f.mids, highs: f.highs },
    poses: new Map(), // Empty for now
    pool: {
      cubes: obj.cubes,
      octahedrons: obj.octas,
      tetrahedrons: obj.tetras,
      toruses: obj.toruses,
      planes: obj.planes,
      sphere: obj.sphere
    },
    blend,
    camera: cam,
    rotationSpeed: KEYFRAME_ONLY_ROTATION_SPEED,
    cameraDistance: activeCameraDistance,
    cameraHeight: activeCameraHeight,
    cameraRotation: activeCameraRotation,
    shake: { x: shakeX, y: shakeY, z: shakeZ },
    colors: {
      cube: cubeColor,
      octahedron: octahedronColor,
      tetrahedron: tetrahedronColor,
      sphere: sphereColor
    }
  });
  
  // Hide unused toruses and planes
  for (let i = 0; i < obj.toruses.length; i++) {
    obj.toruses[i].position.set(0, -1000, 0);
    obj.toruses[i].scale.set(0.001, 0.001, 0.001);
    obj.toruses[i].material.opacity = 0;
  }
  for (let i = 0; i < obj.planes.length; i++) {
    obj.planes[i].position.set(0, -1000, 0);
    obj.planes[i].scale.set(0.001, 0.001, 0.001);
    obj.planes[i].material.opacity = 0;
  }
}
```

**Key point:** The `solveOrbit()` function is imported from a separate file and called directly.

#### Pattern 3: Inline Direct Manipulation (all other presets)

**Lines 5064-5123 (explosion preset example):**

```typescript
else if (type === 'explosion') {
  // Set camera position
  cam.position.set(0 + shakeX, activeCameraHeight + shakeY, activeCameraDistance - f.bass*10 + shakeZ);
  cam.lookAt(0, 0, 0);
  
  // Update sphere
  obj.sphere.position.set(0, 0, 0);
  const ss = 1.5 + f.bass + f.mids * 0.5;
  obj.sphere.scale.set(ss, ss, ss);
  obj.sphere.rotation.x += 0.005;
  obj.sphere.rotation.y += 0.01;
  obj.sphere.rotation.z = 0;
  obj.sphere.material.opacity = (0.4 + f.bass * 0.4) * blend;
  obj.sphere.material.color.setStyle(sphereColor);
  obj.sphere.material.wireframe = true;
  
  // Update cubes
  obj.cubes.forEach((c, i) => {
    const rad = 15 + f.bass * 10;
    const a = (i / obj.cubes.length) * Math.PI * 2;
    c.position.set(Math.cos(a + el) * rad, Math.sin(a + el) * rad, Math.cos(el * 2 + i) * 5);
    c.rotation.x += 0.05 + f.bass * 0.1;
    c.rotation.y += 0.05 + f.bass * 0.1;
    const s = 2 + f.bass * 1.5;
    c.scale.set(s, s, s);
    c.rotation.z = 0;
    c.material.opacity = (0.6 + f.bass * 0.4) * blend;
    c.material.color.setStyle(cubeColor);
    c.material.wireframe = true;
  });
  
  // Update octahedrons
  obj.octas.forEach((o, i) => {
    const radius = 10 + i * 0.5 + f.mids * 8;
    const angle = el + i;
    o.position.x = Math.cos(angle) * radius;
    o.position.y = Math.sin(angle) * radius;
    o.position.z = 0;
    o.rotation.x += 0.1 + f.mids * 0.05;
    o.rotation.y += 0.1 + f.mids * 0.03;
    o.rotation.z = 0;
    const s = 1.2 + f.mids * 0.8;
    o.scale.set(s, s, s);
    o.material.opacity = (0.4 + f.mids * 0.5) * blend;
    o.material.color.setStyle(octahedronColor);
    o.material.wireframe = true;
  });
  
  // Update tetrahedrons
  obj.tetras.forEach((tr, i) => {
    const sp = 0.5 + i * 0.1;
    const rad = 3 + f.highs * 5;
    tr.position.set(
      Math.cos(el * sp + i) * rad,
      Math.sin(el * sp * 1.3 + i) * rad,
      Math.sin(el * sp * 0.7 + i) * rad
    );
    tr.rotation.x += 0.03 + f.highs * 0.1;
    tr.rotation.y += 0.02 + f.highs * 0.08;
    tr.rotation.z = 0;
    const s = 0.5 + f.highs * 0.5;
    tr.scale.set(s, s, s);
    tr.material.opacity = (0.4 + f.highs * 0.6) * blend;
    tr.material.color.setStyle(tetrahedronColor);
    tr.material.wireframe = true;
  });
  
  // Hide unused toruses and planes
  for (let i = 0; i < obj.toruses.length; i++) {
    obj.toruses[i].position.set(0, -1000, 0);
    obj.toruses[i].scale.set(0.001, 0.001, 0.001);
    obj.toruses[i].material.opacity = 0;
  }
  for (let i = 0; i < obj.planes.length; i++) {
    obj.planes[i].position.set(0, -1000, 0);
    obj.planes[i].scale.set(0.001, 0.001, 0.001);
    obj.planes[i].material.opacity = 0;
  }
}
```

**Lines 5124-5178 (chill preset example):**

```typescript
else if (type === 'chill') {
  cam.position.set(0 + shakeX, 5 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
  cam.lookAt(0, 0, 0);
  
  obj.cubes.forEach((c, i) => {
    const a = (i / obj.cubes.length) * Math.PI * 2;
    const rad = 6 + Math.sin(el * 0.5 + i) * 1;
    c.position.set(Math.cos(a + el * 0.3) * rad, Math.sin(el * 0.4 + i) * 1.5, Math.sin(a + el * 0.3) * rad);
    c.rotation.x += 0.005;
    c.rotation.y += 0.005;
    const s = 0.8 + f.bass * 0.4;
    c.scale.set(s, s, s);
    c.material.opacity = (0.4 + f.bass * 0.3) * blend;
    c.material.color.setStyle(cubeColor);
  });
  
  obj.octas.forEach((o, i) => {
    o.rotation.x += 0.008 + f.mids * 0.05;
    o.rotation.y += 0.005 + f.mids * 0.03;
    o.position.y = Math.sin(el * 0.6 + i * 0.3) * 2 + f.mids * 2;
    const s = 0.8 + f.mids * 0.3;
    o.scale.set(s, s, s);
    o.material.opacity = (0.3 + f.mids * 0.3) * blend;
    o.material.color.setStyle(octahedronColor);
  });
  
  obj.tetras.forEach((t, i) => {
    const ringAngle = (i / obj.tetras.length) * Math.PI * 2;
    const ringRadius = 10 + Math.sin(el * 0.3 + i) * 2;
    // ... more inline manipulation
  });
}
```

---

### 4. Is there a .animate() call or is it direct object manipulation?

**ANSWER: 100% DIRECT OBJECT MANIPULATION - NO .animate() CALLS EXIST!**

**Evidence:**

1. **Presets are strings, not objects:**
   ```typescript
   const type = getCurrentPreset(t);  // Returns: "orbit", "explosion", etc.
   // NOT: const preset = getPresetObject(t);
   ```

2. **No preset objects with .animate() methods:**
   - There are NO classes like `OrbitPreset`, `ExplosionPreset`
   - There are NO preset objects with `.animate()` methods
   - Presets are just string identifiers

3. **Animation logic is in the if/else chain:**
   ```typescript
   if (type === 'empty') { /* ... */ }
   else if (type === 'orbit') { solveOrbit(...); }
   else if (type === 'explosion') { /* ... */ }
   else if (type === 'chill') { /* ... */ }
   // etc...
   ```

4. **Direct Three.js property manipulation:**
   - `obj.sphere.position.set(x, y, z)`
   - `obj.cubes[i].rotation.x += value`
   - `obj.octas[i].scale.set(s, s, s)`
   - `obj.tetras[i].material.opacity = value`

---

## Complete Preset List

Based on the animation loop, here are all the presets:

1. **empty** - Hides all objects
2. **orbit** - Uses `solveOrbit()` function
3. **explosion** - Particles explode outward
4. **chill** - Relaxed floating animation
5. **wave** - Wave path formation
6. **spiral** - Spiral formation
7. **pulse** - Pulsing grid
8. **vortex** - Tornado effect
9. **seiryu** - Dragon formation
10. **hammerhead** - Shark formation
11. **cosmic** - Cosmic space effect
12. **cityscape** - City buildings
13. **oceanwaves** - Ocean wave simulation
14. **forest** - Forest environment
15. **portals** - Portal effects
16. **discoball** - Disco ball
17. **windturbines** - Wind turbine rotation
18. **clockwork** - Clockwork gears
19. **neontunnel** - Neon tunnel
20. **atommodel** - Atomic model
21. **carousel** - Carousel rotation
22. **solarsystem** - Solar system orbit
23. **datastream** - Data streaming
24. **ferriswheel** - Ferris wheel rotation
25. **tornadovortex** - Tornado vortex
26. **stadium** - Stadium lights
27. **kaleidoscope2** - Kaleidoscope pattern

**Each preset follows the same pattern:**
```typescript
else if (type === 'presetName') {
  // Camera positioning
  cam.position.set(...);
  cam.lookAt(...);
  
  // Update objects (cubes, octas, tetras, sphere)
  obj.cubes.forEach((c, i) => { /* ... */ });
  obj.octas.forEach((o, i) => { /* ... */ });
  obj.tetras.forEach((t, i) => { /* ... */ });
  
  // Hide unused objects
  obj.toruses.forEach((tor) => { tor.position.set(0, -1000, 0); });
}
```

---

## Why `renderSingleFrame` Failed

**The Problem:**

```typescript
// ❌ WRONG - This code was in renderSingleFrame:
const preset = getPreset(type);  // Assumed this returns an object
preset.animate(obj, f, elScaled);  // ❌ TypeError: fd.animate is not a function
```

**Why it failed:**
1. There are NO preset objects with `.animate()` methods
2. `type` is just a string like `"orbit"` or `"explosion"`
3. The animation logic is in the main loop's `if/else` chain
4. You can't call `.animate()` on a string!

**The Fix:**

```typescript
// ✅ CORRECT - Copy the exact if/else structure:
if (type === 'empty') {
  // Hide all objects (copy lines 4998-5027)
  cam.position.set(0, activeCameraHeight, activeCameraDistance);
  obj.sphere.position.set(0, -1000, 0);
  // ... etc
} else if (type === 'orbit') {
  // Call solver function (copy lines 5028-5063)
  solveOrbit({
    time: elScaled,
    audio: { bass: f.bass, mids: f.mids, highs: f.highs },
    pool: { cubes: obj.cubes, octahedrons: obj.octas, ... },
    blend, camera: cam,
    // ... all parameters
  });
} else if (type === 'explosion') {
  // Direct manipulation (copy lines 5064-5123)
  cam.position.set(0, activeCameraHeight, activeCameraDistance - f.bass*10);
  obj.sphere.position.set(0, 0, 0);
  obj.cubes.forEach((c, i) => {
    // ... copy exact code
  });
}
// ... continue for all presets
```

---

## Code Structure Summary

```typescript
// Main animation loop (lines 4631-9500)
const anim = () => {
  requestAnimationFrame(anim);
  
  // 1. Get frequency data
  const f = getFreq(data);
  
  // 2. Calculate time
  const el = (Date.now() - startTimeRef.current) * 0.001;
  const t = el % duration;
  
  // 3. Get preset type (STRING!)
  const type = getCurrentPreset(t);
  
  // 4. Get preset speed
  const presetSpeed = getCurrentPresetSpeed(t);
  const elScaled = el * presetSpeed;
  
  // 5. Handle transitions
  if (type !== prevAnimRef.current) {
    transitionRef.current = 0;
    prevAnimRef.current = type;
  }
  const blend = transitionRef.current;
  
  // 6. Update objects based on type (IF/ELSE - NOT .animate())
  if (type === 'empty') {
    // Direct hiding
  } else if (type === 'orbit') {
    solveOrbit({ ... });  // Solver function
  } else if (type === 'explosion') {
    // Direct manipulation
  } else if (type === 'chill') {
    // Direct manipulation
  }
  // ... 27 total presets
  
  // 7. Render
  composer.render() || renderer.render(scene, camera);
};
```

---

## How to Fix `renderSingleFrame`

**Required changes:**

1. **Remove all `.animate()` calls**
2. **Copy the exact `if/else` structure from the animation loop**
3. **For each preset:**
   - Copy the exact code from the animation loop
   - Use the same camera positioning
   - Use the same object manipulations
   - Use the same blend value
   - Use the same colors
4. **Call `solveOrbit()` for the orbit preset** (don't inline it)
5. **Ensure all parameters match:**
   - Use `elScaled` for time
   - Use `f.bass`, `f.mids`, `f.highs` for audio
   - Use `blend` for opacity
   - Use state colors (cubeColor, octahedronColor, etc.)

**Template:**

```typescript
const renderSingleFrame = (frameNumber: number, time: number, frequencies: { bass, mids, highs, all }) => {
  const scene = sceneRef.current;
  const cam = cameraRef.current;
  const rend = rendererRef.current;
  const obj = objectsRef.current;
  
  // Simulate time
  startTimeRef.current = Date.now() - (time * 1000);
  const el = time;
  const t = time % duration;
  
  // Get preset and speed
  const type = getCurrentPreset(t);
  const presetSpeed = getCurrentPresetSpeed(t);
  const elScaled = el * presetSpeed;
  
  // Frequency data
  const f = frequencies;
  
  // Handle transitions
  if (prevAnimRef.current !== type) {
    transitionRef.current = 0;
    prevAnimRef.current = type;
  }
  const blend = transitionRef.current;
  
  // COPY EXACT IF/ELSE FROM ANIMATION LOOP
  if (type === 'empty') {
    // Copy lines 4998-5027
  } else if (type === 'orbit') {
    // Copy lines 5028-5063
    solveOrbit({ ... });
  } else if (type === 'explosion') {
    // Copy lines 5064-5123
  }
  // ... etc for all presets
  
  // Render
  composerRef.current?.render() || rend.render(scene, cam);
};
```

---

## Conclusion

**The animation loop does NOT use `.animate()` methods.**

Instead, it uses:
1. **String preset identifiers** (`'orbit'`, `'explosion'`, etc.)
2. **Direct if/else branching** to handle each preset
3. **Inline Three.js object manipulation** or **solver function calls**
4. **No preset objects, no .animate() methods**

**To fix `renderSingleFrame`:**
- Copy the exact `if/else` structure
- Use the same inline code for each preset
- Call `solveOrbit()` for the orbit preset
- Match all parameters exactly

**This is why the error occurred - there are NO .animate() methods to call!**
