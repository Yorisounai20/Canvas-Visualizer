# PR 3: Pose Reader API - Usage Guide

## Overview

The Pose Reader API provides read-only access to saved poses with smooth blending capabilities. This enables presets to animate toward saved workspace configurations without allocating new objects or modifying workspace state.

## API Reference

### Core Functions

#### `applyPose(pose, blend, targetObjects)`

Apply a pose snapshot to workspace objects with blending.

```typescript
import { applyPose } from '../lib/poseReader';

const pose = getPose("neutral-stance");
applyPose(pose, 0.5, workspaceObjects); // Blend 50% toward pose
```

**Parameters:**
- `pose: PoseSnapshot` - The pose snapshot to apply
- `blend: number` - Blend factor (0.0 = current state, 1.0 = full pose)
- `targetObjects: WorkspaceObject[]` - Array of objects to transform

**Returns:** `number` - Count of objects updated

---

#### `applyPoseByName(poseName, blend, targetObjects)`

Apply a pose by name with automatic lookup.

```typescript
import { applyPoseByName } from '../lib/poseReader';

// Blend 75% toward "attack" pose
const count = applyPoseByName("attack", 0.75, workspaceObjects);
if (count === -1) {
  console.error("Pose not found");
}
```

**Returns:** `number` - Count of objects updated, or -1 if pose not found

---

#### `transitionBetweenPoses(fromPose, toPose, blend, targetObjects)`

Smoothly transition between two saved poses.

```typescript
import { transitionBetweenPoses } from '../lib/poseReader';

// Animate from "idle" to "run" over time
const progress = (currentTime - startTime) / duration;
transitionBetweenPoses("idle", "run", progress, workspaceObjects);
```

---

#### `poseExists(poseName)`

Check if a pose is available.

```typescript
import { poseExists } from '../lib/poseReader';

if (poseExists("hammerhead-neutral")) {
  // Safe to apply
}
```

---

## Usage Examples

### Example 1: Breathing Animation

```typescript
// In a preset solver function
function solveCreature({ time, audio, workspaceObjects }) {
  const breatheCycle = Math.sin(time * 2) * 0.5 + 0.5; // 0 to 1
  
  // Blend between rest and expanded poses
  transitionBetweenPoses(
    "creature-rest",
    "creature-expanded",
    breatheCycle,
    workspaceObjects
  );
}
```

### Example 2: Audio-Reactive Pose

```typescript
// React to bass frequencies
function solveAudioReactive({ audio, workspaceObjects }) {
  const bassIntensity = audio.bass / 255; // 0 to 1
  
  // More bass = more of the "pumped" pose
  applyPoseByName("pumped", bassIntensity, workspaceObjects);
}
```

### Example 3: State Machine

```typescript
// Preset with multiple states
function solveStateMachine({ time, workspaceObjects }) {
  const state = getCurrentState(time);
  
  switch (state) {
    case "idle":
      applyPoseByName("idle", 1.0, workspaceObjects);
      break;
    case "attack":
      applyPoseByName("attack", 1.0, workspaceObjects);
      break;
    case "transition":
      const progress = getTransitionProgress(time);
      transitionBetweenPoses("idle", "attack", progress, workspaceObjects);
      break;
  }
}
```

### Example 4: Pose Blending with Groups (PR 2 Integration)

```typescript
import { getObjectsByGroup } from '../lib/objectGroups';
import { applyPose, getPose } from '../lib/poseReader';

// Apply different poses to different groups
function solveLayeredAnimation({ time, workspaceObjects }) {
  // Head moves on one cycle
  const headObjects = getObjectsByGroup(workspaceObjects, "head");
  const headPose = getPose("head-tilt");
  if (headPose) {
    applyPose(headPose, Math.sin(time) * 0.5 + 0.5, headObjects);
  }
  
  // Body moves on a different cycle
  const bodyObjects = getObjectsByGroup(workspaceObjects, "body");
  const bodyPose = getPose("body-sway");
  if (bodyPose) {
    applyPose(bodyPose, Math.sin(time * 0.5) * 0.5 + 0.5, bodyObjects);
  }
}
```

---

## Key Principles

### ✅ Read-Only
The API **reads** poses but **never writes back** to PoseStore. Object transforms are modified in-place for performance, but this is intentional motion, not structure editing.

### ✅ Zero Allocation
No new objects are created. The API operates on existing workspace objects only.

### ✅ Smooth Blending
All transforms use linear interpolation for smooth transitions:
- Position: Component-wise lerp
- Rotation: Component-wise lerp
- Scale: Component-wise lerp
- Opacity: Linear lerp

### ✅ Safety
- Missing poses return -1 (error case)
- Missing objects are skipped silently
- Blend values are clamped to [0, 1]
- Invisible objects are skipped

---

## Performance Notes

- **Blend Factor Clamping:** Alpha is clamped to [0, 1] for safety
- **Object Lookup:** Uses `Map` for O(1) lookups by object ID
- **Visibility Check:** Skips invisible objects automatically
- **In-Place Updates:** Transforms are modified directly (no copying)

---

## Integration with PR 4 (Solver Separation)

When refactoring presets in PR 4, replace:

**Before:**
```typescript
// Hardcoded animation
cube[0].position.x = Math.sin(time) * 5;
```

**After:**
```typescript
// Pose-driven animation
const blend = Math.sin(time) * 0.5 + 0.5;
applyPoseByName("hammerhead-swim", blend, workspaceObjects);
```

This enables:
- Visual authoring in Workspace mode (create pose)
- Preset adds motion (blend over time)
- Clean separation: structure vs. motion

---

## Testing

To test the pose reader API:

1. Create objects in Workspace mode
2. Assign groups/roles (PR 2)
3. Save a pose (PR 1)
4. In a preset, use `applyPoseByName()` to animate
5. Adjust blend factor to see smooth transitions

---

## Next: PR 4

With poses (PR 1), groups (PR 2), and pose reader (PR 3) complete, PR 4 will refactor existing presets to use this new system, replacing hardcoded indices with semantic queries and pose-driven motion.
