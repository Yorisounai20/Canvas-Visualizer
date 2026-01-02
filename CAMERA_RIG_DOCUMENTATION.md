# Camera Rig System Documentation

## Overview

The Canvas Visualizer includes a sophisticated **camera rig system** that provides professional-grade camera animation capabilities. The camera rig allows for complex, automated camera movements that would be difficult or impossible to achieve through manual positioning alone.

This document explains how the camera rig system works, from basic concepts to advanced implementation details.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Camera Positioning Basics](#camera-positioning-basics)
3. [Camera Keyframe System](#camera-keyframe-system)
4. [Camera Rig Types](#camera-rig-types)
5. [Camera Rig Architecture](#camera-rig-architecture)
6. [Interpolation and Easing](#interpolation-and-easing)
7. [Camera Shake System](#camera-shake-system)
8. [Usage Examples](#usage-examples)
9. [Technical Implementation](#technical-implementation)

---

## Core Concepts

### What is a Camera Rig?

A **camera rig** is a virtual system that controls camera movement through automated patterns and keyframe animations. Just like real-world camera rigs used in film production (dollies, cranes, orbits), the virtual camera rig system provides:

- **Automated movement patterns** (orbit, dolly, crane)
- **Keyframe-based animation** (position and rotation over time)
- **Smooth interpolation** between keyframes
- **Professional camera control** without manual manipulation

### Basic Camera Parameters

The camera system uses three primary parameters:

1. **Distance**: How far the camera is from the scene center (5-50 units)
2. **Height**: Vertical offset of the camera (-10 to +10 units)
3. **Rotation**: Horizontal angle around the scene (0-360 degrees)

These parameters can be controlled:
- **Globally** through UI sliders
- **Via keyframes** with smooth interpolation
- **Through camera rigs** with automated patterns

---

## Camera Positioning Basics

### Default Camera Behavior

By default, each animation preset controls its own camera positioning. For example:

```javascript
// Orbital Dance preset
const rotationSpeed = cameraAutoRotate ? el*0.2 : 0;
const r = activeCameraDistance - f.bass * 5;
cam.position.set(
  Math.cos(rotationSpeed + activeCameraRotation)*r + shakeX, 
  10 + activeCameraHeight + shakeY, 
  Math.sin(rotationSpeed + activeCameraRotation)*r + shakeZ
);
cam.lookAt(0,0,0);
```

Each preset calculates the camera position based on:
- **Active camera distance/height/rotation** values
- **Audio frequency data** (bass, mids, highs) for reactive movement
- **Camera shake offsets** for impact effects
- **Elapsed time** for animated motion

### Audio-Reactive Camera

The camera responds to audio frequencies:

```javascript
// Distance reacts to bass
const r = activeCameraDistance - f.bass * 5;

// In Explosion preset - camera pulls back with bass
cam.position.set(0 + shakeX, activeCameraHeight + shakeY, activeCameraDistance - f.bass*10 + shakeZ);
```

This creates dynamic camera movement that synchronizes with the music.

---

## Camera Keyframe System

### What are Camera Keyframes?

**Camera keyframes** define specific camera positions at specific times. The system automatically interpolates between keyframes to create smooth camera animations.

### Keyframe Structure

Each camera keyframe contains:

```typescript
{
  time: number,           // Time in seconds when this keyframe is active
  distance: number,       // Camera distance (5-50)
  height: number,         // Camera height offset (-10 to +10)
  rotation: number,       // Camera rotation angle (0-360 degrees)
  easing: string          // Interpolation easing function
}
```

### Easing Functions

The system supports four easing types for smooth transitions:

1. **Linear** - Constant speed from start to finish
   ```javascript
   return t;
   ```

2. **Ease In** - Slow start, fast finish (cubic)
   ```javascript
   return t * t * t;
   ```

3. **Ease Out** - Fast start, slow finish (cubic)
   ```javascript
   return 1 - Math.pow(1 - t, 3);
   ```

4. **Ease In-Out** - Slow start and finish, fast middle (cubic)
   ```javascript
   return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
   ```

### Keyframe Interpolation Algorithm

The interpolation system works as follows:

```javascript
const interpolateCameraKeyframes = (keyframes, currentTime) => {
  // 1. Sort keyframes by time
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);
  
  // 2. Find the two keyframes to interpolate between
  let prevKeyframe = sortedKeyframes[0];
  let nextKeyframe = sortedKeyframes[sortedKeyframes.length - 1];
  
  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    if (currentTime >= sortedKeyframes[i].time && currentTime <= sortedKeyframes[i + 1].time) {
      prevKeyframe = sortedKeyframes[i];
      nextKeyframe = sortedKeyframes[i + 1];
      break;
    }
  }
  
  // 3. Calculate linear progress (0 to 1)
  const timeDiff = nextKeyframe.time - prevKeyframe.time;
  const linearProgress = timeDiff > 0 ? (currentTime - prevKeyframe.time) / timeDiff : 0;
  
  // 4. Apply easing function to the progress
  const easedProgress = applyEasing(linearProgress, prevKeyframe.easing);
  
  // 5. Interpolate each parameter
  return {
    distance: prevKeyframe.distance + (nextKeyframe.distance - prevKeyframe.distance) * easedProgress,
    height: prevKeyframe.height + (nextKeyframe.height - prevKeyframe.height) * easedProgress,
    rotation: prevKeyframe.rotation + (nextKeyframe.rotation - prevKeyframe.rotation) * easedProgress
  };
};
```

### Boundary Behavior

- **Before first keyframe**: Camera holds at first keyframe values
- **Between keyframes**: Smooth interpolation based on easing
- **After last keyframe**: Camera holds at last keyframe values

---

## Camera Rig Types

The system supports four types of camera rigs, each with unique movement patterns:

### 1. Orbit Rig

Continuously rotates the camera around the scene center.

**Parameters:**
- `orbitRadius`: Distance from center (default: 15)
- `orbitSpeed`: Rotation speed (default: 0.5)
- `orbitAxis`: Rotation axis ('x', 'y', or 'z')

**Calculation:**
```javascript
const orbitAngle = time * orbitSpeed;
if (orbitAxis === 'y') {
  position.x = Math.cos(orbitAngle) * orbitRadius;
  position.z = Math.sin(orbitAngle) * orbitRadius;
}
```

**Use Cases:**
- Circular camera movements around a subject
- Revealing 3D objects from all angles
- Creating dynamic, rotating perspectives

### 2. Dolly Rig

Moves the camera along a straight axis over time.

**Parameters:**
- `dollySpeed`: Movement speed (default: 1.0)
- `dollyAxis`: Movement axis ('x', 'y', or 'z')

**Calculation:**
```javascript
const dollyDistance = time * dollySpeed;
if (dollyAxis === 'z') {
  position.z += dollyDistance;
}
```

**Use Cases:**
- Smooth forward/backward camera movements (Z-axis)
- Lateral tracking shots (X-axis)
- Vertical rises or descents (Y-axis)

### 3. Crane Rig

Simulates a crane camera with height and tilt control.

**Parameters:**
- `craneHeight`: Fixed vertical position (default: 10)
- `craneTilt`: Camera tilt angle (default: 0)

**Calculation:**
```javascript
position.y = craneHeight;
rotation.x = craneTilt;
```

**Use Cases:**
- High-angle overview shots
- Dramatic sweeping movements
- Establishing shots from above

### 4. Custom Rig

User-defined rig with manual position/rotation control.

**Parameters:**
- `position`: {x, y, z} coordinates
- `rotation`: {x, y, z} euler angles
- `trackingTarget`: Optional object to follow
- `trackingOffset`: Offset from target
- `trackingSmooth`: Smoothing factor (0-1)

**Use Cases:**
- Completely custom camera paths
- Object tracking with offset
- Unique animation requirements

---

## Camera Rig Architecture

### Null Object System

Each camera rig creates a **null object** in the scene:

```javascript
const nullObject = new THREE.Object3D();
nullObject.name = rigName;
scene.add(nullObject);
cameraRigNullObjectsRef.current.set(rigId, nullObject);
```

The null object serves as:
- **Position reference** for the rig
- **Rotation pivot** for camera orientation
- **Transform parent** for the camera

### Camera Parenting

The camera is virtually "parented" to the null object:

```javascript
// Calculate rig position in world space
const rigWorldPos = new THREE.Vector3();
rigNullObject.getWorldPosition(rigWorldPos);

// Apply camera offset (distance from rig)
const rigCameraOffset = new THREE.Vector3(0, 0, activeCameraDistance);
rigCameraOffset.applyEuler(rigNullObject.rotation);

// Position camera relative to rig
cam.position.copy(rigWorldPos.add(rigCameraOffset));
cam.lookAt(rigWorldPos);
```

This creates a hierarchical transform system where:
1. Rig null object determines base position/rotation
2. Camera offset is applied relative to the rig
3. Camera always looks at the rig center

---

## Camera Rig Keyframes

### Rig Keyframe Structure

Camera rigs can have their own keyframes that animate the rig itself:

```typescript
{
  id: string,              // Unique keyframe ID
  time: number,            // Time in seconds
  rigId: string,           // Which rig this keyframe belongs to
  position: {x, y, z},     // Rig position at this time
  rotation: {x, y, z},     // Rig rotation at this time
  duration: number,        // Time to transition to next keyframe (default: 1.0)
  easing: string,          // Interpolation easing ('linear', 'easeIn', 'easeOut', 'easeInOut')
  preset: string           // Optional: trigger preset change at this keyframe
}
```

### Rig Keyframe Interpolation

Rig keyframes are interpolated similarly to camera keyframes:

```javascript
// Find current and next keyframes
const currentKfIndex = sortedRigKeyframes.findIndex(kf => kf.time > time) - 1;
const currentKf = sortedRigKeyframes[currentKfIndex];
const nextKf = sortedRigKeyframes[currentKfIndex + 1];

// Calculate interpolation progress
const timeIntoAnim = time - currentKf.time;
const progress = Math.min(timeIntoAnim / currentKf.duration, 1);

// Apply easing
const easedProgress = applyEasing(progress, currentKf.easing);

// Interpolate position and rotation
rigPosition.x = currentKf.position.x + (nextKf.position.x - currentKf.position.x) * easedProgress;
rigRotation.x = currentKf.rotation.x + (nextKf.rotation.x - currentKf.rotation.x) * easedProgress;
// ... (same for y and z)
```

### Combining Rig Motion with Keyframes

The final rig transform is:
1. **Base position/rotation** from rig settings
2. **+Keyframe animation** (if keyframes exist)
3. **+Automated rig motion** (orbit/dolly/crane pattern)

Example for orbit rig with keyframes:
```javascript
// Start with keyframe position
let rigPosition = interpolatedFromKeyframes;

// Apply orbit motion on top
const orbitAngle = time * orbitSpeed;
rigPosition.x = Math.cos(orbitAngle) * orbitRadius;
rigPosition.z = Math.sin(orbitAngle) * orbitRadius;
```

---

## Interpolation and Easing

### Why Interpolation Matters

Without interpolation, camera movements would be:
- **Jerky** - instant jumps between positions
- **Unnatural** - no acceleration or deceleration
- **Jarring** - visually uncomfortable to watch

Interpolation creates smooth transitions by calculating intermediate values between keyframes.

### Linear vs. Eased Interpolation

**Linear Interpolation:**
```
Progress: 0% -----> 25% -----> 50% -----> 75% -----> 100%
Speed:    ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
          Constant speed throughout
```

**Ease In Interpolation:**
```
Progress: 0% -> 25% ----> 50% -------> 75% -----------> 100%
Speed:    ▁▁▃▃▅▅▇▇████████████████████████████
          Slow start, accelerates to fast finish
```

**Ease Out Interpolation:**
```
Progress: 0% -----------> 25% -------> 50% ----> 75% -> 100%
Speed:    ████████████████████████▇▇▅▅▃▃▁▁
          Fast start, decelerates to slow finish
```

**Ease In-Out Interpolation:**
```
Progress: 0% ---> 25% --------> 50% --------> 75% ---> 100%
Speed:    ▁▁▅▅█████████████████████████▅▅▁▁
          Slow start, fast middle, slow finish
```

### Mathematical Easing Functions

**Ease In (Cubic):**
```
f(t) = t³
```
- At t=0: f(0) = 0 (start slow)
- At t=0.5: f(0.5) = 0.125 (still slow)
- At t=1: f(1) = 1 (end fast)

**Ease Out (Cubic):**
```
f(t) = 1 - (1-t)³
```
- At t=0: f(0) = 0 (start fast)
- At t=0.5: f(0.5) = 0.875 (still fast)
- At t=1: f(1) = 1 (end slow)

**Ease In-Out (Cubic):**
```
f(t) = t < 0.5 ? 4t³ : 1 - (-2t+2)³/2
```
- Slow acceleration at start
- Fast in the middle
- Slow deceleration at end

---

## Camera Shake System

### Shake Event Structure

Camera shake adds procedural motion for impact effects:

```typescript
{
  time: number,          // When the shake starts
  intensity: number,     // Shake strength (0-10+)
  duration: number       // How long the shake lasts (seconds)
}
```

### Shake Calculation

```javascript
for (const shake of cameraShakes) {
  const timeSinceShake = currentTime - shake.time;
  
  if (timeSinceShake >= 0 && timeSinceShake < shake.duration) {
    // Calculate decay (shake weakens over time)
    const progress = timeSinceShake / shake.duration;
    const decay = 1 - progress; // Linear decay
    
    // Oscillating motion with high frequency
    const frequency = 50;
    const amplitude = shake.intensity * decay;
    
    // Apply shake to each axis
    shakeX += Math.sin(timeSinceShake * frequency) * amplitude * 0.1;
    shakeY += Math.cos(timeSinceShake * frequency * 1.3) * amplitude * 0.1;
    shakeZ += Math.sin(timeSinceShake * frequency * 0.7) * amplitude * 0.05;
  }
}

// Add shake offsets to camera position
cam.position.set(baseX + shakeX, baseY + shakeY, baseZ + shakeZ);
```

### Shake Characteristics

- **Frequency**: 50Hz creates rapid oscillation
- **Decay**: Linear fade from full intensity to zero
- **Multi-axis**: Different frequencies for natural movement
- **Amplitude scaling**: Z-axis shake is reduced (0.05 vs 0.1) for comfort

### Multiple Simultaneous Shakes

The system accumulates multiple shake events:
```javascript
shakeX += shake1.contribution;
shakeX += shake2.contribution;
shakeX += shake3.contribution;
// Final shakeX is sum of all active shakes
```

---

## Usage Examples

### Example 1: Simple Camera Keyframe Animation

Create a camera that starts close, pulls back, then returns:

```javascript
cameraKeyframes = [
  { time: 0, distance: 10, height: 0, rotation: 0, easing: 'linear' },
  { time: 5, distance: 30, height: 5, rotation: 90, easing: 'easeOut' },
  { time: 10, distance: 10, height: 0, rotation: 180, easing: 'easeIn' }
];
```

Timeline:
- **0-5s**: Camera pulls back from 10→30, rises to height 5, rotates to 90°
- **5-10s**: Camera returns to 10, lowers to height 0, rotates to 180°

### Example 2: Orbit Rig with Auto-Rotate

Create a continuously orbiting camera:

```javascript
// Create orbit rig
const rig = {
  type: 'orbit',
  orbitRadius: 20,
  orbitSpeed: 0.3,
  orbitAxis: 'y',
  enabled: true
};

// Camera will orbit in a circle, completing one rotation every ~21 seconds
// (2π radians / 0.3 speed ≈ 20.9 seconds)
```

### Example 3: Dolly Shot with Keyframes

Create a forward dolly that also rises:

```javascript
// Create dolly rig
const rig = {
  type: 'dolly',
  dollySpeed: 2.0,
  dollyAxis: 'z',
  position: { x: 0, y: 0, z: 0 },
  enabled: true
};

// Add keyframes to animate height
rigKeyframes = [
  { 
    time: 0, 
    rigId: rig.id,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    duration: 1.0,
    easing: 'linear'
  },
  { 
    time: 5, 
    rigId: rig.id,
    position: { x: 0, y: 10, z: 0 },
    rotation: { x: -0.2, y: 0, z: 0 },
    duration: 1.0,
    easing: 'easeOut'
  }
];

// Result: Camera moves forward on Z-axis at 2 units/sec
// While rising from y=0 to y=10 with downward tilt
```

### Example 4: Camera Shake on Beat Drop

Add impact shakes synchronized to music:

```javascript
cameraShakes = [
  { time: 30.5, intensity: 8, duration: 0.3 },  // First bass drop
  { time: 32.0, intensity: 6, duration: 0.2 },  // Follow-up hit
  { time: 45.0, intensity: 10, duration: 0.5 }, // Major drop
];

// Shakes trigger at specific times, creating impact effects
```

---

## Technical Implementation

### State Management

Camera rig state is managed through React hooks:

```javascript
// Global camera controls
const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE);
const [cameraHeight, setCameraHeight] = useState(DEFAULT_CAMERA_HEIGHT);
const [cameraRotation, setCameraRotation] = useState(DEFAULT_CAMERA_ROTATION);
const [cameraAutoRotate, setCameraAutoRotate] = useState(DEFAULT_CAMERA_AUTO_ROTATE);

// Keyframe system
const [cameraKeyframes, setCameraKeyframes] = useState([]);

// Camera rigs
const [cameraRigs, setCameraRigs] = useState([]);
const [cameraRigKeyframes, setCameraRigKeyframes] = useState([]);
const [activeCameraRigId, setActiveCameraRigId] = useState(null);

// Null objects (stored in ref, not state)
const cameraRigNullObjectsRef = useRef(new Map());
```

### Render Loop Integration

The camera system is integrated into the main animation loop:

```javascript
useEffect(() => {
  const anim = () => {
    // 1. Get current time
    const t = currentTime;
    
    // 2. Interpolate camera keyframes
    const interpolated = interpolateCameraKeyframes(cameraKeyframes, t);
    const activeCameraDistance = interpolated.distance;
    const activeCameraHeight = interpolated.height;
    const activeCameraRotation = interpolated.rotation;
    
    // 3. Calculate shake offsets
    let shakeX = 0, shakeY = 0, shakeZ = 0;
    cameraShakes.forEach(shake => {
      // ... shake calculation
    });
    
    // 4. Apply preset-specific camera positioning
    if (preset === 'orbit') {
      const r = activeCameraDistance - f.bass * 5;
      cam.position.set(
        Math.cos(rotationSpeed + activeCameraRotation) * r + shakeX,
        10 + activeCameraHeight + shakeY,
        Math.sin(rotationSpeed + activeCameraRotation) * r + shakeZ
      );
      cam.lookAt(0, 0, 0);
    }
    // ... other presets
    
    // 5. If camera rig is active, override preset positioning
    if (activeCameraRigId) {
      const activeRig = cameraRigs.find(r => r.id === activeCameraRigId);
      // ... apply rig transform to camera
    }
    
    // 6. Render scene
    renderer.render(scene, cam);
  };
  
  anim();
}, [/* dependencies */]);
```

### Performance Considerations

**Optimization Strategies:**

1. **Keyframe sorting**: Sort once, reuse sorted array
   ```javascript
   const sortedKeyframes = useMemo(() => 
     [...cameraKeyframes].sort((a, b) => a.time - b.time),
     [cameraKeyframes]
   );
   ```

2. **Early exits**: Skip inactive rigs/shakes
   ```javascript
   if (!activeRig.enabled) return;
   if (timeSinceShake < 0 || timeSinceShake > shake.duration) continue;
   ```

3. **Ref storage**: Keep Three.js objects in refs, not state
   ```javascript
   const cameraRef = useRef(null);  // ✓ Correct
   const [camera, setCamera] = useState(null);  // ✗ Wrong - triggers re-renders
   ```

4. **Memoized calculations**: Cache expensive computations
   ```javascript
   const rigWorldPosition = useMemo(() => {
     const pos = new THREE.Vector3();
     nullObject.getWorldPosition(pos);
     return pos;
   }, [nullObject, rigPosition]);
   ```

---

## Summary

The camera rig system provides:

✅ **Keyframe-based animation** with smooth interpolation  
✅ **Four rig types** (orbit, dolly, crane, custom)  
✅ **Easing functions** for natural motion  
✅ **Camera shake** for impact effects  
✅ **Null object hierarchy** for transform composition  
✅ **Audio-reactive movement** integrated with presets  
✅ **Professional camera control** for music videos  

The system combines automated patterns, keyframe animation, and procedural effects to create dynamic, professional-quality camera movements synchronized to audio.

---

**Version:** 2.2  
**Last Updated:** January 2, 2026  
**Related Files:**
- `src/visualizer-software.tsx` - Main implementation
- `src/types/index.ts` - Type definitions
- `README.md` - Project overview
