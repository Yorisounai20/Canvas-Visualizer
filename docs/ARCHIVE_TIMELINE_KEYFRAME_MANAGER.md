# Timeline Keyframe Manager Implementation

## Overview
The Timeline Keyframe Manager is a comprehensive system for managing animation keyframes in the Canvas Visualizer application. It provides an After Effects-style timeline interface with multiple tabs for organizing different types of keyframes.

## Features Implemented

### 1. Timeline UI Structure
- **Multi-tab Interface**: Organized tabs for different keyframe types
  - Sections: Animation section management
  - Presets: Preset animation keyframes
  - Camera: Camera position/rotation keyframes
  - Text: Text visibility keyframes
  - Environment: Environment effect keyframes
  - Camera FX: Camera effects clips

### 2. Zoom Controls
- **Zoom In/Out**: Buttons to zoom timeline from 0.25x to 4.0x
- **Reset Button**: Quickly return to 100% zoom
- **Dynamic Width**: Timeline width automatically adjusts based on zoom level
- **Formula**: `PIXELS_PER_SECOND = 40 * zoomLevel`

### 3. Keyframe Dragging
All keyframe types support drag-to-move functionality:
- **Preset Keyframes**: Cyan markers - drag to reposition, maintains duration
- **Text Keyframes**: Green/Red markers - drag to change timing
- **Environment Keyframes**: Green circular markers - drag to adjust timing
- **Visual Feedback**: Cursor changes to `grab`/`grabbing` during interaction

### 4. Keyframe CRUD Operations

#### Create (Add)
- Click timeline background to add keyframe at that time
- "Add at Current Time" button adds keyframe at playhead position
- Each keyframe type has dedicated add functionality

#### Read (View)
- Keyframe markers displayed on timeline at their time position
- Hover tooltips show keyframe details (time, type, parameters)
- Color-coded for easy identification

#### Update (Edit)
- Right-click context menu for edit options
- Modal dialogs for detailed parameter editing
- Support for easing function selection (camera keyframes)
- Preset selection, intensity adjustment, color overrides

#### Delete
- Context menu delete option
- Visual confirmation via tooltip
- Minimum keyframe count enforcement (where applicable)

#### Move (New)
- Drag keyframes horizontally to change timing
- Smooth cursor feedback
- Automatic re-sorting after move
- Maintains keyframe relationships (duration for preset keyframes)

## Technical Implementation

### State Management

```typescript
// Zoom state
const [zoomLevel, setZoomLevel] = useState(1.0);

// Keyframe drag state
const [keyframeDragState, setKeyframeDragState] = useState<{
  type: 'preset' | 'text' | 'environment' | null;
  keyframeId: number | null;
  startX: number;
  initialTime: number;
}>({ type: null, keyframeId: null, startX: 0, initialTime: 0 });
```

### Move Handlers

#### Preset Keyframes
```typescript
const handleMovePresetKeyframe = (id: number, newTime: number) => {
  setPresetKeyframes(presetKeyframes.map(kf => {
    if (kf.id === id) {
      const duration = kf.endTime - kf.time;
      return { 
        ...kf, 
        time: newTime,
        endTime: newTime + duration  // Maintain duration
      };
    }
    return kf;
  }).sort((a, b) => a.time - b.time));
};
```

#### Environment Keyframes
```typescript
const handleMoveEnvironmentKeyframe = (id: number, newTime: number) => {
  setEnvironmentKeyframes(environmentKeyframes.map(kf => 
    kf.id === id ? { ...kf, time: newTime } : kf
  ).sort((a, b) => a.time - b.time));
};
```

#### Text Keyframes
```typescript
const handleMoveTextKeyframe = (id: number, newTime: number) => {
  setTextKeyframes(textKeyframes.map(kf => 
    kf.id === id ? { ...kf, time: newTime } : kf
  ).sort((a, b) => a.time - b.time));
};
```

### Drag Handler

```typescript
useEffect(() => {
  if (!keyframeDragState.type || keyframeDragState.keyframeId === null) return;

  const handleMouseMove = (e: MouseEvent) => {
    if (!timelineRef.current || keyframeDragState.keyframeId === null) return;
    
    const deltaX = e.clientX - keyframeDragState.startX;
    const deltaTime = pixelsToTime(deltaX);
    const newTime = Math.max(0, Math.min(duration, keyframeDragState.initialTime + deltaTime));

    // Dispatch to appropriate handler based on type
    if (keyframeDragState.type === 'preset' && onMovePresetKeyframe) {
      onMovePresetKeyframe(keyframeDragState.keyframeId, newTime);
    } 
    // ... similar for other types
  };

  // Mouse event listeners
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
}, [keyframeDragState, duration, ...handlers]);
```

## Component Interface

### Timeline Props
```typescript
interface TimelineProps {
  // Existing props...
  
  // New move handlers
  onMovePresetKeyframe?: (id: number, newTime: number) => void;
  onMoveTextKeyframe?: (id: number, newTime: number) => void;
  onMoveEnvironmentKeyframe?: (id: number, newTime: number) => void;
}
```

## User Interaction

### Zoom Controls
1. Click **-** button to zoom out (minimum 25%)
2. Click **+** button to zoom in (maximum 400%)
3. Click **Reset** to return to 100%
4. Current zoom percentage displayed between buttons

### Keyframe Dragging
1. Hover over keyframe marker - cursor changes to grab hand
2. Click and hold on keyframe marker
3. Drag left/right to new position
4. Release mouse to finalize position
5. Keyframe automatically snaps to grid (if enabled)

### Context Menu
1. Right-click on keyframe marker
2. Select "Edit" to open parameter dialog
3. Select "Delete" to remove keyframe
4. Dialog shows current values and allows editing

## Future Enhancements

### Planned Features
- [ ] Keyframe duplication (Ctrl+Drag)
- [ ] Multi-select keyframes (Shift+Click)
- [ ] Bulk operations (move/delete multiple)
- [ ] Snap-to-grid option
- [ ] Undo/Redo support
- [ ] Keyframe clipboard (copy/paste)
- [ ] Zoom-to-fit function
- [ ] Timeline minimap/overview
- [ ] Vertical track scrolling
- [ ] Keyframe grouping/folders
- [ ] Easing curve preview visualization
- [ ] Timeline scrubbing audio preview

### Technical Debt
- Wire Timeline component into main visualizer layout (currently using simple slider)
- Implement full text keyframe rendering system
- Add keyboard shortcuts for common operations
- Optimize rendering for timelines with 100+ keyframes
- Add accessibility features (screen reader support)

## Testing Checklist

### Manual Testing
- [x] Zoom controls work correctly
- [x] Zoom level display updates
- [x] Timeline width adjusts with zoom
- [x] Preset keyframes can be dragged
- [x] Text keyframes can be dragged
- [x] Environment keyframes can be dragged
- [x] Keyframes stay within timeline bounds
- [x] Keyframes sort correctly after move
- [ ] Multiple keyframes can be moved in sequence
- [ ] Rapid zooming doesn't cause errors
- [ ] Dragging at timeline edges behaves correctly

### Integration Testing
- [ ] Load project with existing keyframes
- [ ] Save project with moved keyframes
- [ ] Export video with keyframe animations
- [ ] Undo/redo keyframe moves (when implemented)

## Performance Considerations

### Optimizations
- **Memoization**: Consider useMemo for expensive calculations
- **Virtualization**: For timelines with many keyframes (>100)
- **Debouncing**: Throttle drag updates to reduce re-renders
- **RAF**: Use requestAnimationFrame for smooth animations

### Current Limitations
- Timeline recalculates width on every zoom change
- Keyframe array is re-sorted on every move
- No virtualization - all keyframes always rendered
- Mouse events attach/detach on every drag operation

## Code Organization

### File Structure
```
src/
├── components/
│   └── Timeline/
│       ├── Timeline.tsx          # Main timeline component
│       └── WaveformVisualizer.tsx # Audio waveform display
├── types/
│   └── index.ts                  # TypeScript definitions
└── visualizer-software.tsx       # Main visualizer with handlers
```

### Key Functions
- `timeToPixels(time)` - Convert time to pixel position
- `pixelsToTime(pixels)` - Convert pixel position to time
- `handleKeyframeMouseDown()` - Initiate keyframe drag
- `handleMouseMove()` - Update keyframe during drag
- `handleMouseUp()` - Finalize keyframe position

## Conclusion

The Timeline Keyframe Manager provides a robust foundation for animation keyframing in Canvas Visualizer. The zoom and drag features significantly improve the user experience for precise timeline editing. Future enhancements will focus on productivity features like multi-select, duplication, and undo/redo support.
