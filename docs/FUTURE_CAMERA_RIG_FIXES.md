# Prompt: Camera Rig System UI Fixes - Complete Implementation

## Overview
Fix the Camera Rig Tab UI to make keyframe editing fully functional and intuitive. The system has working code but the UI is broken/incomplete.

## Issue #1: Easing Type Button Not Working (CRITICAL)

**Problem:**
- Timeline shows easing type buttons for camera rig keyframes (linear, easeIn, easeOut, easeInOut)
- Clicking buttons only highlights them visually
- No actual state change occurs
- Inspector dropdown doesn't update to match
- Selected easing type is not persisted to the keyframe data

**Location:**
- Timeline keyframe editing UI (in TimelineV2.tsx or similar)
- Inspector/CameraRigTab dropdown

**Requirements:**
1. Clicking an easing button must:
   - Update the selected keyframe's easing property
   - Update the Inspector dropdown to show selected value
   - Persist change to cameraRigKeyframes state
   - Show visual confirmation (button stays highlighted in active color)

2. Inspector dropdown must:
   - Show the currently selected easing type
   - Sync with timeline button clicks
   - Update keyframe when changed
   - Update timeline button state

3. Both must stay in sync:
   - Change timeline button → dropdown updates
   - Change dropdown → timeline button updates
   - Both show same easing value at all times

**Reference:**
- Check how preset keyframe easing works (they have working easing controls)
- Mirror that implementation for camera rig keyframes
- Look for `easing` property on `CameraRigKeyframe` type
- Check `cameraRigKeyframes` state management

---

## Issue #2: Keyframe Duration/Timing UI Redesign (IMPORTANT)

**Problem:**
- Current "Duration" field is unclear (users confuse it with keyframe length)
- "Time to transition to next keyframe" is not intuitive
- UI doesn't visually represent the concept

**Requirements:**
1. Rename and clarify the concept:
   - Change label from "Duration" to "Transition Duration" or "Hold Time"
   - Add helper text: "Time from this keyframe to the next"
   - Consider renaming property if needed for clarity

2. Make UI more intuitive:
   - Show visual timeline representation (two boxes with arrow between)
   - Display: "At 5:00s → move to next keyframe over 1.5s"
   - Add small diagram showing the interpolation curve
   - Maybe show easing preview alongside

3. Sync with timeline visual:
   - When user edits this value, show real-time update on timeline
   - Show the duration visually as a bar under the keyframe

---

## Issue #3: Missing Camera Rig Keyframe Position/Height/Rotation Controls (CRITICAL)

**Problem:**
- Code references position: {x, y, z}, rotation: {x, y, z} properties
- UI doesn't show controls for these properties
- Can't edit camera rig position/rotation per keyframe
- Shot presets can't work without these controls

**Location:**
- CameraRigTab.tsx edit panel (when selectedRig is active)
- Should show keyframe-specific controls (not just rig-level controls)

**Requirements:**
1. Create new "Keyframe Properties" section in edit panel:
```
Position (at this keyframe):
  X: [slider] -10 to 10
  Y: [slider] -10 to 10
  Z: [slider] -10 to 10

Rotation (at this keyframe):
  X: [slider] -180 to 180
  Y: [slider] -180 to 180
  Z: [slider] -180 to 180
```

2. Only show this section when:
   - A rig is selected AND
   - A keyframe within that rig is selected

3. These values must:
   - Pull from the selected `CameraRigKeyframe` object
   - Update on change
   - Persist to `cameraRigKeyframes` state
   - Reflect changes in real-time (if possible)

---

## Issue #4: CameraRigTab Organization Redesign (IMPORTANT)

**Problem:**
- Tab is cramped with too many features at once
- Users can't find what they need
- Advanced features mixed with basic controls
- No clear workflow or hierarchy

**Requirements:**

1. **Reorganize into sections** (use collapsible panels):
   - ✓ Camera Rig Guide (collapsible, currently exists)
   - ✓ Quick Actions (create rig types) (currently exists)
   - ✓ Rig Timeline (list of rigs) (currently exists)
   - → Edit Selected Rig (NEW: reorganize)
     - Basic Properties (name, start/end time, type)
     - Keyframe List (NEW: show keyframes for selected rig)
     - Selected Keyframe Editor (NEW: show when keyframe selected)
       - Time
       - Transition Duration
       - Position (X, Y, Z)
       - Rotation (X, Y, Z)
       - Easing Type
   - → Advanced Controls (collapsible, currently expanded)
     - Path Visualization
     - Rig Transitions
     - Framing Controls
     - Camera FX
     - Shot Presets (currently exists)

2. **Create Keyframe List UI**:
   - Show all keyframes for the selected rig
   - Allow clicking to select a keyframe
   - Show: time, duration, easing type
   - Show: position (x,y,z), rotation (x,y,z) as compact summary
   - Add/remove buttons
   - Visual indicator of which keyframe is selected

3. **Create Selected Keyframe Editor**:
   - Only visible when a keyframe is selected
   - Show all properties with full controls
   - Mirror the "Edit Selected Rig" pattern
   - Should feel like editing a specific moment in time

4. **Polish & UX**:
   - Use consistent styling (bg-gray-700 panels, cyan-400 headers)
   - Group related controls together
   - Add helpful tooltips/descriptions
   - Use collapsible sections to reduce cognitive load
   - Consider icons for quick visual scanning
   - Can use small modals (similar to settings/export modal) if necessary for comprehensive UI

---

## Implementation Strategy

1. **Phase 1: Fix easing button functionality**
   - Make timeline easing buttons actually change state
   - Sync with inspector dropdown
   - Test both directions of sync

2. **Phase 2: Improve duration/timing UI**
   - Rename labels for clarity
   - Add helper text and visual aids
   - Consider showing timeline representation

3. **Phase 3: Restore position/rotation controls**
   - Add controls to keyframe editor section
   - Wire them to CameraRigKeyframe state
   - Test with timeline updates

4. **Phase 4: Reorganize CameraRigTab structure**
   - Create new component structure
   - Implement keyframe list UI
   - Implement selected keyframe editor
   - Ensure all features still accessible

---

## Testing Checklist

After each phase:
- ✓ Create new rig → appears in timeline
- ✓ Select rig → edit panel shows its properties
- ✓ Click to select keyframe → keyframe editor appears
- ✓ Edit keyframe easing → timeline button updates
- ✓ Edit keyframe easing → inspector dropdown updates
- ✓ Edit keyframe position → value persists
- ✓ Edit keyframe rotation → value persists
- ✓ Edit transition duration → reflects in timeline
- ✓ All controls have helpful labels/tooltips
- ✓ No orphaned or unused code remains

---

## Code References to Investigate

- `src/types/index.ts` - CameraRigKeyframe interface
- `src/components/Timeline/TimelineV2.tsx` - Timeline keyframe rendering
- `src/components/Inspector/CameraRigTab.tsx` - Inspector UI
- How preset keyframes do easing (use as reference)
- How timeline renders keyframe buttons
- State management for cameraRigKeyframes

---

## Priority

1. **Critical**: Easing button functionality (Issue #1)
2. **Critical**: Position/rotation controls (Issue #3)
3. **Important**: Duration UI clarity (Issue #2)
4. **Important**: Tab reorganization (Issue #4)

All issues work together to make the camera rig keyframe system usable and less tedious.

---

## Attached Resources

Files provided in attachment:
- `CAMERA_RIG_DOCUMENTATION.md` - Feature documentation
- `CameraRigTab.tsx` - Inspector tab component
- `CameraTab.tsx` - Camera controls component
- `types/index.ts` - Type definitions
