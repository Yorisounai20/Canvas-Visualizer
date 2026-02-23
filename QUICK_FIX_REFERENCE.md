# Quick Fix Reference - renderSingleFrame Bug

## ✅ FIXED: TypeError: fd.animate is not a function

### What Happened
Frame-by-frame export was broken due to calling non-existent `.animate()` methods.

### What Was Done
Rewrote `renderSingleFrame` to use exact animation loop logic (no `.animate()` calls).

### File Changed
- `src/visualizer-software.tsx` (lines 2967-3638)

### Testing
1. Load audio
2. Select "Frame-by-Frame" export mode  
3. Export 10-30 frames
4. Should work without errors now!

### Expected Console Output
```
🎬 Starting frame-by-frame export...
📊 Analyzing audio...
✅ Audio analyzed: 900 frames at 30 FPS
🎨 Starting frame rendering (900 frames)...
🎨 Rendered 0 / 900 frames (0%)
🎨 Rendered 100 / 900 frames (11%)
...
✅ Frame rendering complete!
📦 Captured 900 frames
```

### Status
🎉 **BUG FIXED - Ready to test!**

### Next
Report test results and proceed to Phase 4 (FFmpeg assembly)
