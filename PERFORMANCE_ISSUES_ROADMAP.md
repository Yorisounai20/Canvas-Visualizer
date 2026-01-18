# Canvas Visualizer - Performance Issues Roadmap

**Date Created:** 2026-01-18  
**Created By:** @copilot  
**For:** Next development agent

## Overview

This document investigates three performance and UX issues reported in PR#75 and provides a comprehensive roadmap for fixing them.

---

## Issue #1: Timeline Lag During Playback

### Problem Description
The timeline becomes very laggy when the scene begins to play, making it difficult to interact with timeline controls during playback.

### Root Cause Analysis

**Location:** `src/visualizer-software.tsx` (lines 7900-8000)

The main animation loop in visualizer-software.tsx runs at 60 FPS during playback and performs extensive computations:

1. **Animation Loop (line 7905):** The useEffect has 26 dependencies, causing frequent re-renders
2. **Waveform Rendering (line 7908-8000):** Throttled to 30 FPS but still adds overhead
3. **Three.js Rendering:** Full scene re-render on every frame
4. **Timeline Updates:** Timeline component re-renders on every `currentTime` update

**Performance Bottlenecks:**
- Heavy dependency array triggers unnecessary effect re-runs
- Timeline re-renders on every frame (60 FPS) during playback
- Waveform canvas drawing happens independently but still adds CPU load
- No virtualization for timeline tracks (all tracks rendered even if off-screen)

### Proposed Solution

#### Priority 1: Optimize Timeline Re-renders
- **File:** `src/components/Timeline/TimelineV2.tsx`
- **Action:** Memoize timeline rendering components
- **Implementation:**
  ```typescript
  // Wrap track rendering in React.memo
  const TrackRow = React.memo(({ track, keyframes, ... }) => {
    // Track rendering logic
  }, (prev, next) => {
    // Only re-render if keyframes change or if this track is selected
    return prev.currentTime === next.currentTime && 
           prev.keyframes === next.keyframes;
  });
  ```

#### Priority 2: Throttle Timeline Updates
- **File:** `src/visualizer-software.tsx` (line 7905)
- **Action:** Add throttling to `currentTime` state updates during playback
- **Implementation:**
  ```typescript
  // Update currentTime at 10 FPS instead of 60 FPS
  const TIMELINE_UPDATE_INTERVAL = 100; // ms
  let lastTimelineUpdate = 0;
  
  if (now - lastTimelineUpdate > TIMELINE_UPDATE_INTERVAL) {
    setCurrentTime(newTime);
    lastTimelineUpdate = now;
  }
  ```

#### Priority 3: Virtual Scrolling for Timeline
- **File:** `src/components/Timeline/TimelineV2.tsx`
- **Action:** Implement virtual scrolling to only render visible tracks
- **Library:** Consider using `react-window` or custom implementation
- **Impact:** Render only 5-10 visible tracks instead of all tracks

#### Priority 4: Optimize Animation Loop Dependencies
- **File:** `src/visualizer-software.tsx` (line 7905)
- **Action:** Split animation loop into multiple effects with fewer dependencies
- **Implementation:**
  ```typescript
  // Separate effects for:
  // 1. Core animation loop (minimal dependencies)
  // 2. Color/style updates (only when colors change)
  // 3. Effect-specific updates (only when effects change)
  ```

### Testing Plan
1. Measure FPS before and after each optimization
2. Test with long audio files (5+ minutes)
3. Test with many keyframes (100+)
4. Profile with Chrome DevTools Performance tab

### Expected Impact
- Timeline FPS during playback: 30-60 FPS (currently drops to 5-15 FPS)
- Reduced CPU usage by 40-60%
- Improved responsiveness of timeline controls

---

## Issue #2: Inconsistent Waveform Display

### Problem Description
Some uploaded audio files display their waveforms while others don't.

### Root Cause Analysis

**Location:** `src/components/Inspector/AudioTab.tsx` (lines 82-106)

The waveform rendering logic uses a canvas ref callback:

```typescript
ref={(canvas) => {
  if (canvas && track.buffer) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const waveform = generateWaveformData(track.buffer, 200);
      // ... rendering logic
    }
  }
}}
```

**Potential Issues:**

1. **Race Condition:** The canvas ref callback may fire before `track.buffer` is fully loaded
2. **Missing Re-render Trigger:** When `track.buffer` updates asynchronously, the canvas doesn't re-render
3. **Error Handling:** No error handling if waveform generation fails
4. **Audio Format Issues:** Some audio formats may not decode properly into AudioBuffer

**Location:** `src/components/VisualizerSoftware/utils/audioUtils.ts` (lines 6-21)

```typescript
export const generateWaveformData = (buffer: AudioBuffer, samples = WAVEFORM_SAMPLES): number[] => {
  const rawData = buffer.getChannelData(0); // Get mono or first channel
  const blockSize = Math.floor(rawData.length / samples);
  // ...
}
```

**Additional Issues:**
- No validation of buffer validity
- No error handling for corrupted audio data
- Assumption that channel 0 exists

### Proposed Solution

#### Priority 1: Add useEffect for Waveform Rendering
- **File:** `src/components/Inspector/AudioTab.tsx`
- **Action:** Replace ref callback with useEffect
- **Implementation:**
  ```typescript
  useEffect(() => {
    if (!canvasRef.current || !track.buffer) return;
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const waveform = generateWaveformData(track.buffer, 200);
      // ... rendering logic
    } catch (error) {
      console.error('Failed to render waveform:', error);
      // Show error indicator
    }
  }, [track.buffer, track.id]);
  ```

#### Priority 2: Add Buffer Validation
- **File:** `src/components/VisualizerSoftware/utils/audioUtils.ts`
- **Action:** Validate AudioBuffer before processing
- **Implementation:**
  ```typescript
  export const generateWaveformData = (buffer: AudioBuffer, samples = WAVEFORM_SAMPLES): number[] => {
    // Validate buffer
    if (!buffer || buffer.numberOfChannels === 0 || buffer.length === 0) {
      console.warn('Invalid audio buffer');
      return new Array(samples).fill(0);
    }
    
    try {
      const rawData = buffer.getChannelData(0);
      // ... existing logic
    } catch (error) {
      console.error('Error generating waveform:', error);
      return new Array(samples).fill(0);
    }
  };
  ```

#### Priority 3: Add Loading State
- **File:** `src/components/Inspector/AudioTab.tsx`
- **Action:** Show loading indicator while waveform is being generated
- **Implementation:**
  ```typescript
  const [waveformLoading, setWaveformLoading] = useState<Set<string>>(new Set());
  
  // Show skeleton loader if waveform is not ready
  {waveformLoading.has(track.id) ? (
    <div className="bg-gray-700 rounded p-2 mb-2 h-16 animate-pulse" />
  ) : (
    <canvas ref={canvasRef} />
  )}
  ```

#### Priority 4: Debug Logging
- **Action:** Add comprehensive logging to track waveform generation
- **Implementation:**
  ```typescript
  console.log('Generating waveform:', {
    trackId: track.id,
    trackName: track.name,
    bufferExists: !!track.buffer,
    bufferLength: track.buffer?.length,
    numberOfChannels: track.buffer?.numberOfChannels,
    sampleRate: track.buffer?.sampleRate
  });
  ```

### Testing Plan
1. Test with various audio formats (MP3, WAV, OGG, FLAC, AAC)
2. Test with mono and stereo audio files
3. Test with corrupted audio files
4. Test with very short (<1s) and very long (>10min) audio files
5. Monitor browser console for errors during waveform generation

### Expected Impact
- 100% success rate for valid audio files
- Clear error messages for invalid audio files
- Loading indicators provide better UX

---

## Issue #3: Redundant Keyframe Center Drag Behavior

### Problem Description
Dragging the body (center) of a preset or any keyframe with duration lengthens it from the direction being dragged. This is redundant since users can already drag the left or right edges to adjust duration.

### Root Cause Analysis

**Location:** `src/components/Timeline/TimelineV2.tsx` (lines 1203, 950-1000)

The current implementation has a single `onMouseDown` handler on the entire keyframe rectangle:

```typescript
<div
  className="absolute..."
  onMouseDown={handleKeyframeMouseDown}  // Line 1203
>
  {/* Easing badges */}
  {/* Resize handle */}
  <div
    className="absolute right-0..."
    onMouseDown={handleResizeMouseDown}  // Line 1232
  />
</div>
```

**The Problem:**
- When user clicks the center of the keyframe, `handleKeyframeMouseDown` is triggered
- This handler moves the keyframe's start time AND adjusts its end time based on drag direction
- This creates confusing behavior where the keyframe appears to "stretch" in the drag direction

**Expected Behavior:**
- Dragging the center should MOVE the keyframe (change start time, maintain duration)
- Dragging edges should RESIZE the keyframe (change duration)
- This matches behavior of video editing software (Premiere Pro, Final Cut Pro, DaVinci Resolve)

### Proposed Solution

#### Priority 1: Separate Move and Resize Logic
- **File:** `src/components/Timeline/TimelineV2.tsx` (lines 950-1040)
- **Action:** Modify `handleKeyframeMouseDown` to only move, not resize
- **Implementation:**
  ```typescript
  const handleKeyframeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (e.button !== 0) return;
    
    const startX = e.clientX;
    const originalTime = time;
    const originalDuration = endTime ? endTime - time : 0;
    
    setIsDraggingKeyframe(true);
    setDraggedKeyframe({
      trackType,
      keyframeId: fullKeyId,
      originalTime: time,
      currentTime: time,
    });
    
    const handleMouseMove = (moveE: MouseEvent) => {
      // ... existing scroll and bounds logic ...
      
      let newTime = pixelsToTime(relativeX, pixelsPerSecond);
      newTime = Math.max(0, Math.min(duration - originalDuration, newTime));
      newTime = applySnapping(newTime);
      
      // MOVE only - maintain duration
      setDraggedKeyframe(prev => prev ? { 
        ...prev, 
        currentTime: newTime,
        // End time moves with start time to maintain duration
      } : null);
    };
    
    // ... rest of handler ...
  };
  ```

#### Priority 2: Add Visual Feedback
- **Action:** Add cursor indicators
- **Implementation:**
  ```typescript
  // On keyframe body
  className="... cursor-move ..." // Instead of cursor-grab
  
  // On resize handles
  className="... cursor-ew-resize ..." // Existing
  ```

#### Priority 3: Add Tooltip Clarification
- **Action:** Update tooltips to clarify behavior
- **Implementation:**
  ```typescript
  title="Drag to move keyframe (duration preserved). Drag edges to resize."
  ```

#### Priority 4: Update Resize Handler
- **File:** `src/components/Timeline/TimelineV2.tsx` (line 1232)
- **Action:** Ensure resize handler stops event propagation properly
- **Implementation:**
  ```typescript
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent body drag handler from firing
    e.preventDefault();
    // ... existing resize logic ...
  };
  ```

### Testing Plan
1. Test moving keyframes without changing duration
2. Test resizing keyframes from left edge
3. Test resizing keyframes from right edge
4. Test with snap-to-grid enabled
5. Test with multiple selected keyframes
6. Verify cursor changes appropriately

### Expected Impact
- Intuitive keyframe manipulation matching industry standard tools
- Reduced user frustration
- Fewer accidental duration changes

---

## Implementation Order

### Phase 1: Quick Wins (1-2 hours)
1. Issue #3 - Fix redundant drag behavior (highest user impact, easiest fix)
2. Issue #2 - Add error handling and logging for waveforms

### Phase 2: Performance Optimization (3-4 hours)
1. Issue #1 - Throttle timeline updates
2. Issue #1 - Memoize timeline components
3. Issue #2 - Convert waveform rendering to useEffect

### Phase 3: Major Refactor (5-8 hours)
1. Issue #1 - Implement virtual scrolling for timeline
2. Issue #1 - Split animation loop dependencies
3. Issue #2 - Add comprehensive audio format validation

---

## Testing Checklist

### Before Starting
- [ ] Create test branch from current PR
- [ ] Document current performance metrics (FPS, load times)
- [ ] Create test audio files of various formats and lengths

### During Development
- [ ] Run TypeScript compiler after each change
- [ ] Test in Chrome, Firefox, and Safari
- [ ] Profile with Chrome DevTools
- [ ] Check console for errors

### After Completion
- [ ] Verify all three issues are resolved
- [ ] Run full test suite (if available)
- [ ] Update documentation
- [ ] Create before/after performance comparison

---

## Additional Notes

### Files to Modify
1. `src/visualizer-software.tsx` - Main animation loop optimization
2. `src/components/Timeline/TimelineV2.tsx` - Keyframe drag behavior and timeline performance
3. `src/components/Inspector/AudioTab.tsx` - Waveform rendering reliability
4. `src/components/VisualizerSoftware/utils/audioUtils.ts` - Audio buffer validation

### Dependencies
- No new dependencies required for Phases 1-2
- Phase 3 may benefit from `react-window` for virtual scrolling (optional)

### Breaking Changes
None expected - all changes are internal optimizations and bug fixes

### Rollback Plan
- Keep commits atomic and focused on single issues
- Each phase can be reverted independently if needed
- Tag current state before starting work

---

## Success Criteria

### Issue #1: Timeline Lag
- ✅ Timeline maintains 30+ FPS during playback
- ✅ No dropped frames when interacting with timeline controls
- ✅ CPU usage reduced by 40%+ during playback

### Issue #2: Waveform Display
- ✅ All valid audio formats display waveforms
- ✅ Clear error messages for invalid audio
- ✅ Loading indicators show progress

### Issue #3: Keyframe Drag
- ✅ Center drag moves keyframe without changing duration
- ✅ Edge drag resizes keyframe
- ✅ Behavior matches industry standard tools

---

## Contact
For questions or clarifications, refer to:
- PR #75 comments
- Original issue reporter: @ShiroNairobi
- Code author: @copilot

**Last Updated:** 2026-01-18
