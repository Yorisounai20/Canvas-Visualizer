# Camera Rig Quick Reference

## Quick Start

### Basic Camera Control

```javascript
// Global camera parameters
cameraDistance: 5-50      // How far from center
cameraHeight: -10 to +10  // Vertical offset
cameraRotation: 0-360     // Horizontal angle
cameraAutoRotate: boolean // Auto-orbit toggle
```

### Create a Camera Keyframe

```javascript
const keyframe = {
  time: 5.0,           // 5 seconds into the song
  distance: 20,
  height: 5,
  rotation: 90,
  easing: 'easeInOut'  // 'linear', 'easeIn', 'easeOut', 'easeInOut'
};
```

### Create an Orbit Rig

```javascript
const orbitRig = {
  id: 'rig-orbit-1',
  type: 'orbit',
  enabled: true,
  orbitRadius: 20,     // Circle radius
  orbitSpeed: 0.5,     // Revolutions per second (approximately)
  orbitAxis: 'y',      // 'x', 'y', or 'z'
};
```

### Create a Dolly Rig

```javascript
const dollyRig = {
  id: 'rig-dolly-1',
  type: 'dolly',
  enabled: true,
  dollySpeed: 2.0,     // Units per second
  dollyAxis: 'z',      // 'x', 'y', or 'z'
};
```

### Create a Crane Rig

```javascript
const craneRig = {
  id: 'rig-crane-1',
  type: 'crane',
  enabled: true,
  craneHeight: 15,     // Fixed height
  craneTilt: -0.3,     // Downward tilt (radians)
};
```

### Add Camera Shake

```javascript
const shake = {
  time: 30.5,          // When to trigger (seconds)
  intensity: 8,        // Shake strength (0-10+)
  duration: 0.3,       // How long it lasts (seconds)
};
```

---

## Common Patterns

### Pattern 1: Cinematic Intro

Pull back and rise while rotating:

```javascript
[
  { time: 0, distance: 10, height: 0, rotation: 0, easing: 'easeOut' },
  { time: 8, distance: 35, height: 8, rotation: 90, easing: 'easeInOut' }
]
```

### Pattern 2: Build-Up Zoom

Slowly zoom in during verse, fast zoom during drop:

```javascript
[
  { time: 0, distance: 40, height: 5, rotation: 0, easing: 'linear' },
  { time: 20, distance: 30, height: 3, rotation: 45, easing: 'linear' },
  { time: 28, distance: 15, height: 0, rotation: 90, easing: 'easeIn' },  // Fast zoom
]
```

### Pattern 3: Orbit with Height Changes

Continuous orbit with rising/falling motion:

```javascript
// Orbit rig for rotation
const rig = {
  type: 'orbit',
  orbitRadius: 25,
  orbitSpeed: 0.2,
  orbitAxis: 'y'
};

// Keyframes for height changes
const rigKeyframes = [
  { time: 0, rigId: rig.id, position: {x: 0, y: 0, z: 0}, easing: 'linear' },
  { time: 10, rigId: rig.id, position: {x: 0, y: 15, z: 0}, easing: 'easeInOut' },
  { time: 20, rigId: rig.id, position: {x: 0, y: 0, z: 0}, easing: 'easeInOut' }
];
```

### Pattern 4: Impact Shakes on Beat

```javascript
const beatTimes = [15.2, 15.8, 16.4, 17.0];  // Bass hits
const shakes = beatTimes.map(t => ({
  time: t,
  intensity: 6,
  duration: 0.2
}));
```

---

## Easing Cheat Sheet

| Easing | Start | Middle | End | Best For |
|--------|-------|--------|-----|----------|
| `linear` | ▬▬▬ | ▬▬▬ | ▬▬▬ | Mechanical movements |
| `easeIn` | ▁▁▁ | ▅▅▅ | ███ | Gravity, acceleration |
| `easeOut` | ███ | ▅▅▅ | ▁▁▁ | Deceleration, landing |
| `easeInOut` | ▁▁▁ | ███ | ▁▁▁ | Natural, organic motion |

---

## Camera Rig Type Comparison

| Type | Motion | Parameters | Use Case |
|------|--------|------------|----------|
| **Orbit** | Circular | radius, speed, axis | 360° views, reveals |
| **Dolly** | Linear | speed, axis | Tracking, fly-throughs |
| **Crane** | Fixed height + tilt | height, tilt | Overhead shots |
| **Custom** | Manual | position, rotation | Unique paths |

---

## Coordinate System

```
        Y (up)
        |
        |
        |
        +-------- X (right)
       /
      /
     Z (forward, toward camera)
```

**Default camera position:** `(0, 0, 15)`  
**Default look-at:** `(0, 0, 0)` (scene center)

---

## Timing Tips

### Music Timing Reference

```
1 bar (4/4) = ~2 seconds @ 120 BPM
1 beat = ~0.5 seconds @ 120 BPM

Common timings:
- Intro: 0-16 seconds
- Verse: 16-48 seconds
- Chorus: 48-80 seconds
- Drop: 80-90 seconds (sharp transition)
```

### Keyframe Spacing

**Too close** (< 1 second apart):  
❌ Jerky, uncomfortable motion

**Good spacing** (2-5 seconds):  
✅ Smooth, cinematic transitions

**Too far** (> 10 seconds):  
⚠️ Long static periods, consider more keyframes

---

## Debugging Tips

### Check Camera Position

```javascript
console.log('Camera:', cam.position.x, cam.position.y, cam.position.z);
```

### Verify Keyframe Order

```javascript
const sorted = [...cameraKeyframes].sort((a, b) => a.time - b.time);
console.log('Keyframes:', sorted.map(k => k.time));
// Should be ascending: [0, 5, 10, 15, ...]
```

### Test Easing Visually

Create test keyframes with extreme values:

```javascript
[
  { time: 0, distance: 10, easing: 'linear' },
  { time: 5, distance: 50, easing: 'linear' },    // Linear
  { time: 10, distance: 10, easing: 'easeIn' },   // Ease In
  { time: 15, distance: 50, easing: 'easeOut' },  // Ease Out
  { time: 20, distance: 10, easing: 'easeInOut' } // Ease In-Out
]
```

### Disable Auto-Rotate

If testing manual camera control:

```javascript
cameraAutoRotate = false;  // Disable preset auto-rotation
```

---

## Performance Notes

### Good Practices ✅

- Keep keyframes under 50 total
- Limit active rigs to 1-2 simultaneously
- Use refs for Three.js objects, not state
- Sort keyframes once, cache result

### Bad Practices ❌

- Creating keyframes every frame
- Storing camera in component state
- Deeply nested rig hierarchies
- Excessive shake events (>10 active)

---

## Common Issues

### Issue: Camera not moving

**Check:**
1. Is `activeCameraRigId` set correctly?
2. Is the rig `enabled: true`?
3. Are keyframes sorted by time?
4. Is `isPlaying` true?

### Issue: Jerky motion

**Fix:**
- Use `easeInOut` instead of `linear`
- Space keyframes further apart (3-5 seconds)
- Reduce shake intensity

### Issue: Camera too fast/slow

**Adjust:**
- **Too fast**: Increase keyframe spacing, use `easeOut`
- **Too slow**: Decrease spacing, use `easeIn`
- **Rig too fast**: Reduce `orbitSpeed` or `dollySpeed`

---

## API Reference

### Functions

```typescript
createCameraRig(type: 'orbit' | 'dolly' | 'crane' | 'custom'): CameraRig
updateCameraRig(id: string, updates: Partial<CameraRig>): void
deleteCameraRig(id: string): void
createCameraRigKeyframe(rigId: string, time: number): CameraRigKeyframe
deleteCameraRigKeyframe(id: string): void
interpolateCameraKeyframes(keyframes: CameraKeyframe[], time: number): InterpolatedValues
applyEasing(t: number, easing: string): number
```

### Type Definitions

```typescript
interface CameraKeyframe {
  time: number;
  distance: number;
  height: number;
  rotation: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

interface CameraRig {
  id: string;
  type: 'orbit' | 'dolly' | 'crane' | 'custom';
  enabled: boolean;
  position: Vector3;
  rotation: Vector3;
  // Type-specific properties
  orbitRadius?: number;
  orbitSpeed?: number;
  dollySpeed?: number;
  craneHeight?: number;
  craneTilt?: number;
}

interface CameraShake {
  time: number;
  intensity: number;
  duration: number;
}
```

---

## Examples Repository

For complete working examples, see:
- [CAMERA_RIG_DOCUMENTATION.md](../CAMERA_RIG_DOCUMENTATION.md) - Full documentation
- `src/visualizer-software.tsx` - Implementation
- `examples/` - Example configurations (if available)

---

**Last Updated:** January 2, 2026
