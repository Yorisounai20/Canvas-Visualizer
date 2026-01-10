# Enhanced Easing Functions

## Overview

Canvas Visualizer now supports **30+ professional easing functions** for smooth, expressive animations on camera keyframes and other animated properties.

## Features

### Comprehensive Easing Library

- **30+ easing functions** organized into 12 categories
- **Real-time preview** with descriptions in UI
- **Backwards compatible** with existing projects
- **Industry-standard** implementations following established easing equations

### Categories

1. **Basic** - Linear (constant speed)
2. **Legacy** - Original cubic easing (easeIn, easeOut, easeInOut) 
3. **Sine** - Smooth and gentle curves
4. **Quadratic** - Subtle acceleration/deceleration
5. **Cubic** - Moderate acceleration/deceleration
6. **Quartic** - Strong acceleration/deceleration
7. **Quintic** - Very strong acceleration/deceleration
8. **Exponential** - Dramatic acceleration/deceleration
9. **Circular** - Smooth circular motion curves
10. **Back** - Overshoot and settle (pulls back before moving forward)
11. **Elastic** - Spring-like oscillation with bounce
12. **Bounce** - Bouncing ball physics

## Usage

### Camera Keyframes

1. Open Editor Mode in Canvas Visualizer
2. Navigate to the **📷 Camera** tab in the Timeline
3. Add camera keyframes by clicking "Add at Current Time" or clicking on the timeline
4. Click on a keyframe to edit its properties
5. Select an easing function from the categorized dropdown
6. The description below the dropdown shows what the easing does

### Supported Keyframe Types

- **Camera Keyframes** - Distance, height, rotation
- **Camera Rig Keyframes** - Position and rotation of camera rigs
- **Mask Reveal Keyframes** - Mask animations
- **Camera FX Keyframes** - Camera effects parameters

## Easing Functions Reference

### Sine Easings (Smooth and Gentle)
- `sineIn` - Gentle acceleration
- `sineOut` - Gentle deceleration  
- `sineInOut` - Smooth sine curve

### Quadratic Easings (Subtle)
- `quadIn` - Subtle acceleration
- `quadOut` - Subtle deceleration
- `quadInOut` - Subtle S-curve

### Cubic Easings (Moderate)
- `cubicIn` - Moderate acceleration
- `cubicOut` - Moderate deceleration
- `cubicInOut` - Moderate S-curve

### Quartic Easings (Strong)
- `quartIn` - Strong acceleration
- `quartOut` - Strong deceleration
- `quartInOut` - Strong S-curve

### Quintic Easings (Very Strong)
- `quintIn` - Very strong acceleration
- `quintOut` - Very strong deceleration
- `quintInOut` - Very strong S-curve

### Exponential Easings (Dramatic)
- `expoIn` - Dramatic acceleration
- `expoOut` - Dramatic deceleration
- `expoInOut` - Dramatic S-curve

### Circular Easings (Smooth Curves)
- `circIn` - Circular acceleration
- `circOut` - Circular deceleration
- `circInOut` - Circular S-curve

### Back Easings (Overshoot)
- `backIn` - Pull back then accelerate
- `backOut` - Overshoot then settle
- `backInOut` - Pull back and overshoot

### Elastic Easings (Spring-like)
- `elasticIn` - Elastic wind-up
- `elasticOut` - Elastic overshoot (most popular)
- `elasticInOut` - Elastic both ends

### Bounce Easings (Bouncing Ball)
- `bounceIn` - Bouncing start
- `bounceOut` - Bouncing end (most popular)
- `bounceInOut` - Bounce both ends

## Examples

### Smooth Camera Movement
Use `sineInOut` for gentle, smooth camera transitions that feel natural and cinematic.

### Dramatic Reveal
Use `expoOut` for camera movements that start fast and dramatically slow down at the end.

### Playful Animations
Use `bounceOut` or `elasticOut` for fun, energetic camera movements that overshoot and settle.

### Professional Look
Use `cubicInOut` (or legacy `easeInOut`) for balanced, professional animations.

## Implementation Details

### TypeScript Integration

All easing functions are strongly typed:

```typescript
type EasingFunction = 
  | 'linear'
  | 'easeIn' | 'easeOut' | 'easeInOut'  // Legacy
  | 'sineIn' | 'sineOut' | 'sineInOut'
  | 'quadIn' | 'quadOut' | 'quadInOut'
  // ... and 21 more options
```

### Keyframe Interpolation

Easing functions are applied during keyframe interpolation:

1. Calculate linear progress between two keyframes
2. Apply the selected easing function to the progress value
3. Interpolate the keyframe values using the eased progress

### Performance

All easing functions are optimized for real-time rendering:
- Pure mathematical functions with no external dependencies
- O(1) time complexity
- No memory allocations during animation

## Backwards Compatibility

Existing projects continue to work without changes:
- Legacy easing names (`easeIn`, `easeOut`, `easeInOut`) still work
- Default easing is `linear` if not specified
- All existing keyframes maintain their behavior

## Future Enhancements

Planned improvements for easing functions:
- Visual easing curve preview in UI
- Custom Bezier curve editor
- Easing presets for common animation scenarios
- Copy/paste easing settings between keyframes
