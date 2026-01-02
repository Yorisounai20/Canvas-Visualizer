# Camera Rig System - Visual Guide

## Camera Position Calculation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CAMERA RIG SYSTEM                            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
            ┌───────▼────────┐          ┌────────▼─────────┐
            │  GLOBAL PARAMS │          │  CAMERA KEYFRAMES │
            │                │          │                   │
            │  - Distance    │          │  - time: 5.0      │
            │  - Height      │          │  - distance: 20   │
            │  - Rotation    │          │  - height: 5      │
            │  - AutoRotate  │          │  - rotation: 90   │
            └───────┬────────┘          │  - easing: ...    │
                    │                   └────────┬──────────┘
                    │                            │
                    │         ┌──────────────────┴─────────┐
                    │         │  INTERPOLATION ENGINE      │
                    │         │  - Sort by time            │
                    │         │  - Find prev/next          │
                    │         │  - Apply easing            │
                    │         │  - Calculate values        │
                    │         └──────────┬─────────────────┘
                    │                    │
                    └──────────┬─────────┘
                               │
                     ┌─────────▼──────────┐
                     │ ACTIVE CAMERA VALS │
                     │  activeCameraDistance
                     │  activeCameraHeight
                     │  activeCameraRotation
                     └─────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
    ┌───────▼────────┐ ┌──────▼─────────┐ ┌─────▼──────────┐
    │ PRESET CAMERA  │ │  CAMERA SHAKE  │ │  CAMERA RIG    │
    │                │ │                │ │                │
    │ Per-preset     │ │ - Oscillation  │ │ - Orbit motion │
    │ positioning    │ │ - Decay        │ │ - Dolly motion │
    │ logic          │ │ - Frequency    │ │ - Crane motion │
    │                │ │                │ │ - Custom path  │
    └───────┬────────┘ └──────┬─────────┘ └─────┬──────────┘
            │                  │                  │
            └──────────────────┴──────────────────┘
                               │
                     ┌─────────▼──────────┐
                     │  FINAL CAMERA POS  │
                     │   cam.position.set(│
                     │     x + shakeX,    │
                     │     y + shakeY,    │
                     │     z + shakeZ)    │
                     └────────────────────┘
```

## Camera Rig Types Hierarchy

```
                    ┌──────────────────┐
                    │   CAMERA RIG     │
                    │   Base Object    │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐       ┌────▼─────┐       ┌────▼─────┐
    │  ORBIT   │       │  DOLLY   │       │  CRANE   │
    │          │       │          │       │          │
    │ radius   │       │ speed    │       │ height   │
    │ speed    │       │ axis     │       │ tilt     │
    │ axis     │       │          │       │          │
    └──────────┘       └──────────┘       └──────────┘
         │                   │                   │
    ┌────▼─────┐       ┌────▼─────┐       ┌────▼─────┐
    │ Circular │       │ Linear   │       │ Fixed    │
    │ rotation │       │ movement │       │ height + │
    │ around   │       │ along    │       │ tilt     │
    │ center   │       │ axis     │       │          │
    └──────────┘       └──────────┘       └──────────┘
```

## Keyframe Interpolation Timeline

```
Time:     0s         5s         10s        15s        20s
          │          │          │          │          │
Keyframe: ●─────────────────────●─────────────────────●
         K1                    K2                    K3
     distance=10           distance=30           distance=10
     height=0              height=5              height=0
     
Current Time = 7.5s  (between K1 and K2)

┌─────────────────────────────────────────────────────┐
│ Interpolation Calculation:                          │
│                                                      │
│ 1. Linear progress:                                 │
│    t = (7.5 - 5.0) / (10.0 - 5.0) = 0.5            │
│                                                      │
│ 2. Apply easing (example: easeInOut):              │
│    t' = easeInOut(0.5) = 0.5  (at midpoint)        │
│                                                      │
│ 3. Interpolate distance:                            │
│    d = 10 + (30 - 10) * 0.5 = 20                   │
│                                                      │
│ 4. Interpolate height:                              │
│    h = 0 + (5 - 0) * 0.5 = 2.5                     │
│                                                      │
│ Result: distance=20, height=2.5                     │
└─────────────────────────────────────────────────────┘
```

## Easing Function Curves

```
Linear:
  1.0 ┼─────────────────────────────────────╱
      │                               ╱╱╱╱╱
  0.5 ┼───────────────────╱╱╱╱╱╱╱╱╱╱╱
      │         ╱╱╱╱╱╱╱╱╱
  0.0 ┼╱╱╱╱╱╱╱╱
      └────────────────────────────────────
      0.0                               1.0

Ease In (Cubic):
  1.0 ┼─────────────────────────────────────╱
      │                           ╱╱╱╱╱╱╱╱╱╱
  0.5 ┼────────────╱╱╱╱╱╱╱╱╱╱╱╱╱╱
      │      ╱╱╱╱╱╱
  0.0 ┼──────
      └────────────────────────────────────
      0.0                               1.0

Ease Out (Cubic):
  1.0 ┼──────╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱
      │ ╱╱╱╱╱╱
  0.5 ┼╱╱╱╱╱╱╱╱╱╱╱╱╱─────────────────────
      │                           
  0.0 ┼─────────────────────────────────────
      └────────────────────────────────────
      0.0                               1.0

Ease In-Out (Cubic):
  1.0 ┼─────────────────╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱
      │          ╱╱╱╱╱╱╱╱             
  0.5 ┼────╱╱╱╱╱╱                      
      │╱╱╱╱                            
  0.0 ┼─────────────────────────────────────
      └────────────────────────────────────
      0.0                               1.0
```

## Camera Shake Decay Pattern

```
Intensity Over Time (shake duration = 0.3s)

  10 ┼╱╲
     │╱  ╲╱╲
   8 ┼      ╲╱╲
     │         ╲╱╲
   6 ┼            ╲╱╲
     │               ╲╱╲
   4 ┼                  ╲╱╲
     │                     ╲╱╲
   2 ┼                        ╲╱╲
     │                           ╲╱╲
   0 ┼───────────────────────────────╲────
     └────────────────────────────────────
     0s                           0.3s

Legend:
 ╱╲  = High-frequency oscillation (50 Hz)
  ╲  = Linear decay envelope
```

## Null Object Transform System

```
                    ┌─────────────────────┐
                    │   SCENE ROOT        │
                    │   (0, 0, 0)         │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  NULL OBJECT (Rig)  │
                    │  Position: (10,5,0) │
                    │  Rotation: (0,45°,0)│
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │     CAMERA          │
                    │  Local Offset:      │
                    │  (0, 0, distance)   │
                    │                     │
                    │  World Position:    │
                    │  nullPos + offset   │
                    │  rotated by nullRot │
                    └─────────────────────┘

Example:
  Null at (10, 5, 0) rotated 45° on Y-axis
  Camera offset (0, 0, 15)
  
  Final camera position:
  - Apply 45° rotation to offset vector
  - Add to null position
  - Camera looks at null position
```

## Coordinate System Reference

```
                Y (Up)
                ↑
                │
                │     Z (Forward to Camera)
                │    ↗
                │  ↗
                │↗
    ────────────┼────────────→ X (Right)
              ↗ │
            ↗   │
          ↗     │
        ↗       │

Preset Camera Positions:
├─ Orbit:     Circular path on XZ plane
├─ Explosion: Fixed at (0, height, distance)
├─ Chill:     (0, 5+height, distance)
├─ Wave:      Sinusoidal path
├─ Spiral:    Rotating XZ with sine Y
├─ Pulse:     Fixed at (0, height, distance)
├─ Vortex:    (0, 15+height, distance)
└─ Seiryu:    Sin(time)*5, Y varies, Z at distance
```

## State Flow Diagram

```
┌──────────────┐
│ User Input   │ (Slider moved, keyframe added, rig enabled)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ React State  │ (setState triggers re-render)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ useEffect    │ (Dependencies changed, animation loop runs)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Animation    │ (Every frame, 60 FPS)
│ Loop         │
└──────┬───────┘
       │
       ├─→ Interpolate keyframes
       ├─→ Calculate shake
       ├─→ Apply preset logic
       ├─→ Apply rig transform
       │
       ▼
┌──────────────┐
│ Set Camera   │ cam.position.set(x, y, z)
│ Position     │ cam.lookAt(0, 0, 0)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Render       │ renderer.render(scene, camera)
│ Frame        │
└──────────────┘
```

## Priority/Override System

```
Camera position is determined in this priority order:

1. BASE VALUES
   ↓
   Global camera parameters or keyframe interpolation
   (distance, height, rotation)

2. PRESET LOGIC
   ↓
   Each preset calculates camera position
   Using active camera values + audio data

3. CAMERA SHAKE
   ↓
   Adds small offset to create impact effects
   (shakeX, shakeY, shakeZ)

4. CAMERA RIG (OVERRIDE)
   ↓
   If active rig exists, OVERRIDES preset positioning
   Applies rig-specific motion pattern

Final position = RIG_POSITION || PRESET_POSITION + SHAKE
```

---

**Navigation:**
- [← Back to Main Documentation](../CAMERA_RIG_DOCUMENTATION.md)
- [→ Quick Reference Guide](CAMERA_RIG_QUICK_REFERENCE.md)
