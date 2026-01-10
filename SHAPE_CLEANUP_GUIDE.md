# Shape Cleanup Guide for Preset Development

## Overview

When adding new presets to Canvas Visualizer, it's crucial to properly hide unused shapes to prevent "shape bleeding" between presets.

## The Problem

Shape bleeding occurs when switching from a preset that uses certain shapes (torus, plane, etc.) to a preset that doesn't use those shapes. The unused shapes remain visible at their last positions with no animation logic, causing visual artifacts.

## The Solution

Every preset must explicitly hide all shapes it doesn't use. This is done at the end of each preset's rendering code.

## Implementation Guide

### For Presets WITHOUT Toruses or Planes

Add this code at the end of your preset (before the next `} else if (type === '...')`):

```javascript
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
```

### For Presets WITH Toruses or Planes

Use the pattern already established in presets like `portals`, `discoball`, etc.:

```javascript
// Use only the toruses you need
for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
  // Your torus animation code
}
// Hide the rest
for (let i = req.toruses; i < obj.toruses.length; i++) {
  obj.toruses[i].position.set(0, -1000, 0); 
  obj.toruses[i].scale.set(0.001, 0.001, 0.001); 
  obj.toruses[i].material.opacity = 0;
}

// Same pattern for planes
for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
  // Your plane animation code
}
for (let i = req.planes; i < obj.planes.length; i++) {
  obj.planes[i].position.set(0, -1000, 0); 
  obj.planes[i].scale.set(0.001, 0.001, 0.001); 
  obj.planes[i].material.opacity = 0;
}
```

## Shape Allocation

Update `PRESET_SHAPE_REQUIREMENTS` in `visualizer-software.tsx` to specify how many of each shape your preset uses:

```javascript
myNewPreset: { cubes: 8, octas: 30, tetras: 20, toruses: 15, planes: 10 }
```

This helps with performance optimization and ensures proper shape allocation.

## Cleanup Checklist for New Presets

- [ ] Added entry to `PRESET_SHAPE_REQUIREMENTS`
- [ ] Specified correct counts for cubes, octas, tetras, toruses, planes
- [ ] Added cleanup code for unused toruses (if not using all)
- [ ] Added cleanup code for unused planes (if not using all)
- [ ] Added cleanup code for unused tetras (if applicable)
- [ ] Added cleanup code for sphere (if not using it)
- [ ] Tested switching TO your preset from other presets
- [ ] Tested switching FROM your preset to other presets
- [ ] Verified no shape bleeding occurs

## Common Pitfalls

1. **Forgetting to hide ALL unused shapes**: Even if you only use 5 toruses out of 25, you must hide the other 20.
2. **Not updating PRESET_SHAPE_REQUIREMENTS**: This causes performance issues and incorrect shape allocation.
3. **Only testing in isolation**: Always test transitions between your new preset and existing ones.
4. **Assuming shapes auto-hide**: Shapes persist between preset switches unless explicitly hidden.

## Examples

### Good: Proper cleanup in 'orbit' preset
```javascript
// ... animation code for cubes, octas, tetras, sphere ...

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
```

### Bad: Missing cleanup
```javascript
// ... animation code for cubes, octas, tetras, sphere ...
// MISSING: toruses and planes cleanup!
```

This will cause shape bleeding when switching from presets that use toruses/planes.

## Testing Your Preset

1. Load your preset in the visualizer
2. Switch to a preset with toruses/planes (e.g., 'portals', 'discoball')
3. Switch back to your preset - verify no leftover shapes
4. Switch to other presets - verify no shape bleeding
5. Test at different points in the audio timeline

## Reference

See commits:
- `31d393d`: Initial cleanup for orbit, explosion, chill, wave, spiral, pulse, vortex, seiryu, hammerhead, tunnel
- `8c275ed`: Cleanup for remaining older presets

All presets now follow this pattern to ensure clean transitions.
