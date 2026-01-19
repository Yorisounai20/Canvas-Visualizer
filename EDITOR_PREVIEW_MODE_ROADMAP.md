# Editor/Preview Mode Feature Roadmap

## Overview
Implement a toggle system in the top bar to switch between Editor mode (showing all panels and timeline) and Preview mode (showing only the canvas for clean playback).

## Feature Requirements

### User Story
As a user creating audio visualizations, I want to toggle between Editor and Preview modes so that I can:
- **Editor Mode**: Work with full editing capabilities (panels, timeline, controls)
- **Preview Mode**: Focus on the visualization playback without UI distractions

### Success Criteria
- ✅ Two buttons in the top bar: "Editor" and "Preview"
- ✅ Editor mode shows: Toolbox panel, Inspector panel, Timeline, and Canvas
- ✅ Preview mode shows: Canvas only (full screen)
- ✅ Smooth transition between modes
- ✅ State persists during playback
- ✅ Keyboard shortcuts (optional enhancement)

## Technical Implementation Plan

### Phase 1: State Management (1-2 hours)

#### 1.1 Add View Mode State
**File:** `src/visualizer-software.tsx`

Add state to track current view mode:
```tsx
const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
```

**Why here:** Main component that orchestrates the entire visualizer layout.

#### 1.2 Create Toggle Handler
```tsx
const toggleViewMode = (mode: 'editor' | 'preview') => {
  setViewMode(mode);
  // Optional: Pause timeline interactions in preview mode
  // Optional: Log analytics event
};
```

### Phase 2: Top Bar UI (1-2 hours)

#### 2.1 Update TopBar Component
**File:** Look for top bar component (likely `src/components/TopBar.tsx` or integrated in `visualizer-software.tsx`)

Add toggle buttons next to existing controls:
```tsx
<div className="flex gap-2 items-center">
  <button
    onClick={() => toggleViewMode('editor')}
    className={`px-4 py-2 rounded transition-colors ${
      viewMode === 'editor'
        ? 'bg-cyan-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    📝 Editor
  </button>
  <button
    onClick={() => toggleViewMode('preview')}
    className={`px-4 py-2 rounded transition-colors ${
      viewMode === 'preview'
        ? 'bg-cyan-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    ▶️ Preview
  </button>
</div>
```

**Design Considerations:**
- Use consistent styling with existing UI (cyan accent color)
- Icons: 📝 (Editor), ▶️ (Preview) or use Lucide icons
- Position: After Dashboard button, before File menu

#### 2.2 Alternative: Segmented Control
For a more polished look, use a segmented control:
```tsx
<div className="inline-flex rounded-md shadow-sm" role="group">
  <button
    type="button"
    onClick={() => toggleViewMode('editor')}
    className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
      viewMode === 'editor'
        ? 'bg-cyan-600 text-white border-cyan-600'
        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
    }`}
  >
    Editor
  </button>
  <button
    type="button"
    onClick={() => toggleViewMode('preview')}
    className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
      viewMode === 'preview'
        ? 'bg-cyan-600 text-white border-cyan-600'
        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
    }`}
  >
    Preview
  </button>
</div>
```

### Phase 3: Layout Conditional Rendering (2-3 hours)

#### 3.1 Update LayoutShell Component
**File:** `src/visualizer/LayoutShell.tsx`

Pass `viewMode` prop and conditionally render panels:

```tsx
type LayoutShellProps = {
  left?: React.ReactNode;
  inspector?: React.ReactNode;
  timeline?: React.ReactNode;
  top?: React.ReactNode;
  children: React.ReactNode;
  viewMode?: 'editor' | 'preview'; // Add this prop
};

export default function LayoutShell({ 
  left, 
  inspector, 
  timeline, 
  top, 
  children,
  viewMode = 'editor' // Default to editor mode
}: LayoutShellProps) {
  // ... existing code ...

  return (
    <div className="cv-layout flex flex-col h-screen w-full bg-gray-900 overflow-hidden">
      {/* Top bar - always visible */}
      <header className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-20 relative">
        {top ?? <TopBarPlaceholder />}
      </header>

      {/* Main content area - conditional layout based on viewMode */}
      <div className={`flex-1 relative overflow-hidden min-h-0 ${
        viewMode === 'preview' ? '' : '' // No timeline in preview, so flex-1 takes full space
      }`}>
        {/* Center content - main canvas */}
        <main 
          className="absolute inset-0 overflow-hidden flex flex-col"
        >
          {children}
        </main>

        {/* Left sidebar - only in editor mode */}
        {viewMode === 'editor' && (
          <aside className="absolute left-0 top-0 h-[45vh] w-24 border-r border-gray-800 bg-gray-900/95 backdrop-blur-sm flex flex-col z-10 shadow-2xl">
            <PanelContainer name="🎨 Toolbox" defaultCollapsed={false} icon="🎨">
              {left}
            </PanelContainer>
          </aside>
        )}

        {/* Right sidebar - only in editor mode */}
        {viewMode === 'editor' && (
          <aside className="absolute right-0 top-0 h-[45vh] w-56 border-l border-gray-800 bg-gray-900/95 backdrop-blur-sm flex flex-col z-10 shadow-2xl">
            <PanelContainer name="🔍 Inspector" defaultCollapsed={false} icon="🔍">
              {inspector}
            </PanelContainer>
          </aside>
        )}
      </div>

      {/* Bottom timeline - only in editor mode */}
      {viewMode === 'editor' && (
        <footer 
          className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 shadow-2xl relative"
          style={{ height: effectiveTimelineHeight }}
        >
          {/* Resize handle */}
          <div
            ref={resizeRef}
            className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-cyan-500/50 transition-colors z-30"
            onMouseDown={handleResizeStart}
            title="Drag to resize timeline"
          />
          
          {/* Full-height toggle button */}
          <button
            onClick={toggleFullHeight}
            className="absolute top-2 right-2 z-30 px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
            title={isFullHeight ? 'Restore timeline size' : 'Maximize timeline'}
          >
            {isFullHeight ? '⬇ Restore' : '⬆ Maximize'}
          </button>

          <PanelContainer name="⏱️ Timeline" defaultCollapsed={false} icon="⏱️">
            {timeline}
          </PanelContainer>
        </footer>
      )}
    </div>
  );
}
```

#### 3.2 Update Canvas Container Styling
**File:** `src/visualizer-software.tsx`

Adjust canvas padding based on view mode:
```tsx
const canvasAreaJSX = (
  <div className={`flex items-center justify-center w-full h-full bg-gray-950 ${
    viewMode === 'preview' ? 'py-0' : 'py-4'
  }`}>
    <div className="relative">
      <div ref={containerRef} className={`rounded-lg shadow-2xl overflow-hidden ${showBorder ? 'border-2' : ''}`} style={{width:'960px',height:'540px',borderColor:borderColor}} />
      {/* ... rest of canvas content ... */}
    </div>
  </div>
);
```

**Rationale:** In preview mode, remove vertical padding to maximize canvas size.

### Phase 4: Enhancements (Optional, 2-3 hours)

#### 4.1 Keyboard Shortcuts
Add keyboard shortcut handlers:
```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ctrl/Cmd + E = Editor mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      setViewMode('editor');
    }
    // Ctrl/Cmd + P = Preview mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      setViewMode('preview');
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

#### 4.2 Smooth Transitions
Add CSS transitions for panel show/hide:
```tsx
{viewMode === 'editor' && (
  <aside 
    className="absolute left-0 top-0 h-[45vh] w-24 ... transition-transform duration-300 ease-in-out"
    style={{
      transform: viewMode === 'editor' ? 'translateX(0)' : 'translateX(-100%)'
    }}
  >
    {/* ... */}
  </aside>
)}
```

#### 4.3 Preview Mode Controls
Add minimal playback controls overlay in preview mode:
```tsx
{viewMode === 'preview' && (
  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm rounded-lg px-6 py-3 flex items-center gap-4 z-30 shadow-2xl">
    <button onClick={togglePlayback} className="text-white hover:text-cyan-400">
      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
    </button>
    <span className="text-white text-sm font-mono">
      {formatTime(currentTime)} / {formatTime(duration)}
    </span>
  </div>
)}
```

#### 4.4 Full Screen API
Add true full-screen support for preview mode:
```tsx
const enterFullScreen = () => {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }
};

const exitFullScreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }
};

// Add full-screen button in preview mode
{viewMode === 'preview' && (
  <button
    onClick={enterFullScreen}
    className="absolute top-4 right-4 z-30 p-2 bg-gray-900/90 hover:bg-gray-800 rounded-lg"
  >
    <Maximize2 size={20} className="text-white" />
  </button>
)}
```

## Files to Modify

### Primary Changes
1. **`src/visualizer-software.tsx`** (15-30 lines)
   - Add `viewMode` state
   - Add toggle handler
   - Update canvas container styling
   - Pass viewMode to LayoutShell

2. **`src/visualizer/LayoutShell.tsx`** (30-50 lines)
   - Add `viewMode` prop
   - Wrap panels in conditional rendering
   - Wrap timeline in conditional rendering

3. **Top Bar Component** (20-40 lines)
   - Add Editor/Preview toggle buttons
   - Style buttons appropriately

### Optional Changes
4. **Keyboard shortcuts** (10-20 lines)
5. **CSS transitions** (5-10 lines)
6. **Preview overlay controls** (20-30 lines)
7. **Full-screen support** (15-25 lines)

## Testing Plan

### Manual Testing

#### Test Case 1: Mode Toggle
1. Load the visualizer
2. Click "Preview" button
3. **Expected:** All panels and timeline hidden, canvas centered
4. Click "Editor" button
5. **Expected:** All panels and timeline visible again

#### Test Case 2: Playback in Both Modes
1. Load audio file
2. Start playback in Editor mode
3. Switch to Preview mode while playing
4. **Expected:** Playback continues smoothly, visualization updates
5. Switch back to Editor mode
6. **Expected:** Playback still smooth, timeline updates

#### Test Case 3: Timeline Interactions
1. In Editor mode, drag timeline playhead
2. Switch to Preview mode
3. **Expected:** Playhead position maintained
4. Switch back to Editor mode
5. **Expected:** Timeline reflects correct position

#### Test Case 4: Canvas Visibility
1. In Editor mode, verify canvas borders visible with `py-4` padding
2. Switch to Preview mode
3. **Expected:** Canvas uses full available space (no padding clipping)

#### Test Case 5: Responsive Behavior
1. Resize browser window in Editor mode
2. Switch to Preview mode
3. Resize browser window
4. **Expected:** Canvas scales appropriately in both modes

### Edge Cases

1. **Mode switch during recording:** Test that switching modes doesn't affect video recording
2. **Timeline maximized:** Test switching to Preview when timeline is maximized
3. **Panel collapsed:** Test switching modes with panels collapsed vs expanded
4. **No audio loaded:** Test mode switching before audio is loaded

## Implementation Checklist

### Phase 1: Core Functionality
- [ ] Add `viewMode` state in visualizer-software.tsx
- [ ] Create toggle handler function
- [ ] Add Editor/Preview buttons to top bar
- [ ] Style buttons with active/inactive states
- [ ] Pass `viewMode` prop to LayoutShell
- [ ] Wrap left panel in conditional render
- [ ] Wrap right panel in conditional render
- [ ] Wrap timeline footer in conditional render
- [ ] Update canvas padding based on mode
- [ ] Test basic toggle functionality

### Phase 2: Polish
- [ ] Add smooth transitions (300ms ease-in-out)
- [ ] Test with different audio files
- [ ] Test during playback
- [ ] Test during recording
- [ ] Verify canvas visibility in both modes
- [ ] Check responsive behavior

### Phase 3: Enhancements (Optional)
- [ ] Add keyboard shortcuts (Ctrl+E, Ctrl+P)
- [ ] Add minimal playback overlay in Preview
- [ ] Add full-screen button in Preview
- [ ] Add mode indicator somewhere (if not obvious)
- [ ] Add tooltips to buttons
- [ ] Add documentation to README

## Performance Considerations

### Expected Impact
- **No performance degradation:** Conditional rendering only affects layout, not rendering loop
- **Potential improvement in Preview:** Hiding panels may reduce React re-renders slightly
- **Canvas rendering unchanged:** 3D rendering loop unaffected by mode

### Optimization Notes
- Use CSS `display: none` or remove from DOM (current approach) rather than `visibility: hidden`
- Avoid re-mounting timeline component when switching back to Editor
- Keep playback state independent of view mode

## Accessibility

### Keyboard Navigation
- Ensure buttons are keyboard accessible (tab order)
- Add aria-labels to buttons
- Announce mode changes to screen readers

```tsx
<button
  onClick={() => toggleViewMode('editor')}
  aria-label="Switch to Editor mode"
  aria-pressed={viewMode === 'editor'}
  className="..."
>
  Editor
</button>
```

### Focus Management
- Maintain focus state when switching modes
- Don't lose focus on mode switch

## Documentation Updates

### README.md
Add section under "Features":
```markdown
### Editor and Preview Modes

- **Editor Mode:** Full editing interface with panels, timeline, and all controls
- **Preview Mode:** Distraction-free playback view showing only the canvas
- Toggle between modes using buttons in the top bar
- Keyboard shortcuts: `Ctrl+E` (Editor), `Ctrl+P` (Preview)
```

### User Guide
Add tips:
- "Use Preview mode for final review and presentations"
- "Editor mode allows full control over visualization parameters"
- "Preview mode automatically removes padding for maximum canvas size"

## Success Metrics

After implementation, verify:
- ✅ Toggle works instantly (< 100ms)
- ✅ No visual glitches during transition
- ✅ Playback unaffected by mode switches
- ✅ Canvas fully visible in both modes
- ✅ All panels hidden/shown correctly
- ✅ Timeline hidden/shown correctly
- ✅ No console errors
- ✅ Build passes without warnings
- ✅ Type checking passes

## Estimated Time
- **Minimum (basic functionality):** 4-6 hours
- **With polish and transitions:** 6-8 hours
- **With all enhancements:** 8-12 hours

## Dependencies
- No new dependencies required
- Uses existing React state and conditional rendering
- Compatible with current architecture

## Rollout Plan

### Phase 1: Basic Implementation
Merge basic Editor/Preview toggle with minimal styling

### Phase 2: Polish Release
Add transitions, keyboard shortcuts, better styling

### Phase 3: Enhancement Release
Add full-screen support, preview overlay controls, advanced features

## Known Limitations

1. **State Persistence:** View mode doesn't persist across page refreshes (could add localStorage later)
2. **Animation State:** Complex animations may need special handling during mode switch
3. **Performance:** Rapid toggling may cause brief layout shifts (mitigated with transitions)

## Future Enhancements

Potential features for future iterations:
1. **Presentation Mode:** Auto-loop playback in Preview
2. **Custom Layouts:** Save custom panel arrangements
3. **Multi-Monitor:** Pop out canvas to separate window
4. **Export Preset:** Export view mode with preset
5. **Mobile Preview:** Simulate mobile aspect ratios

---

## Quick Start for Implementation

1. Start with `visualizer-software.tsx` - add state
2. Update top bar - add buttons
3. Update `LayoutShell.tsx` - add conditionals
4. Test basic toggle
5. Add polish (transitions, keyboard shortcuts)
6. Write tests
7. Update documentation

Good luck! 🚀
