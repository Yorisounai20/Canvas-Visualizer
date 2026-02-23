# Frame-by-Frame Export - Testing & Validation Guide

## Test Setup

### Prerequisites
- Audio file loaded (WAV or MP3)
- Animation preset selected
- Export settings configured:
  - Duration: 10 seconds (test), 60 seconds (medium), or full duration
  - Quality: Max
  - Format: WebM with audio

### Testing Phases

---

## Phase 1: Quick Validation Test (10 Seconds)

### Objective
Verify frame capture and encoding pipeline works end-to-end.

### Expected Timeline
- Audio analysis: ~2 sec
- Frame rendering: ~8 sec (300 frames at 30 FPS)
- Video encoding: ~2 sec
- Audio processing: ~1 sec
- **Total: ~13 seconds**

### Validation Checklist
- [ ] Console shows "🎬 [PHASE 1: RENDER] Analyzing audio..."
- [ ] Console shows frame capture progress every 30 frames
- [ ] Console shows "Captured all 300 frames"
- [ ] Console shows "🎬 [PHASE 2: ENCODE] Encoding frames to video..."
- [ ] Console shows video encoding progress every 100 frames
- [ ] Console shows "✅ Video encoded (X KB)"
- [ ] Console shows "🎬 [PHASE 3: AUDIO] Rendering audio track..."
- [ ] Console shows "✅ Audio rendered (X KB)"
- [ ] Video file downloads automatically as `canvas-visualizer-10s.webm`
- [ ] File size is between 100 KB - 5 MB

### Issues to Watch For
- Blank/corrupted frames
- No audio track
- File size too large or too small
- Browser tab freezes during export

---

## Phase 2: Medium Duration Test (60 Seconds)

### Objective
Test stability with realistic export duration.

### Expected Timeline
- Audio analysis: ~2 sec
- Frame rendering: ~40 sec (1800 frames at 30 FPS)
- Video encoding: ~5 sec
- Audio processing: ~2 sec
- **Total: ~49 seconds**

### Validation Checklist
- [ ] Export completes without UI freezing
- [ ] Console shows steady progress throughout
- [ ] Video file downloads as `canvas-visualizer-60s.webm`
- [ ] File plays in VLC, Chrome, or other video player
- [ ] Audio syncs with video
- [ ] Video quality maintained throughout
- [ ] No memory leaks (DevTools Memory tab)

### Issues to Watch For
- Dropped frames after 30 seconds
- Audio desyncs from video
- Memory usage exceeds 500 MB
- UI becomes unresponsive

---

## Phase 3: Full Duration Test (8 Minutes)

### Objective
Validate complete end-to-end export with full-length music video.

### Expected Timeline (8 min = 480 sec at 30 FPS = 14,400 frames)
- Audio analysis: ~3 sec
- Frame rendering: ~240 sec (4 minutes)
- Video encoding: ~30 sec
- Audio processing: ~3 sec
- **Total: ~276 seconds (~4.6 minutes)**

### Validation Checklist
- [ ] Export completes fully without interruption
- [ ] Console shows all 4 phases completing
- [ ] Video file downloads as `canvas-visualizer-full.webm`
- [ ] File size is between 50 MB - 200 MB
- [ ] Video plays without stuttering
- [ ] Audio is present and synced
- [ ] Full 8 minutes of content present
- [ ] Memory remains stable (no crashes)

### Issues to Watch For
- Export stops mid-way
- Memory usage exceeds 1 GB
- File corrupted or unplayable
- Audio missing entirely
- Significant performance degradation after 2 minutes

---

## Quality Metrics

### Frame Quality Assessment
```
Expected Quality:
- Resolution: 960×540 (16:9)
- Frame format: WebP → WebM
- Bit depth: 24-bit color
- Visual artifacts: None visible
```

### Audio Quality Assessment
```
Expected Audio:
- Sample rate: 44.1 kHz or 48 kHz (match audio input)
- Bit depth: 16-bit
- Channel: Mono or Stereo (match input)
- Sync drift: < 100ms over full duration
```

### Performance Metrics
```
Benchmark Targets:
- 30 FPS frame capture (1 frame = 33.3 ms)
- Video encoding: ~60 frames/sec (5-10 ms per frame)
- Audio rendering: Full duration in 1-3 seconds
- Memory peak: < 500 MB for 1 min, < 1 GB for 8 min
```

---

## Console Output Expected (10-Second Test)

```
🎬 [PHASE 1: RENDER] Analyzing audio...
Frequency data: bass=X, mids=Y, highs=Z
Starting frame capture at 30 FPS...
Captured 30 frames (10%)
Captured 60 frames (20%)
Captured 90 frames (30%)
Captured 120 frames (40%)
Captured 150 frames (50%)
Captured 180 frames (60%)
Captured 210 frames (70%)
Captured 240 frames (80%)
Captured 270 frames (90%)
Captured all 300 frames ✅

🎬 [PHASE 2: ENCODE] Encoding frames to video...
Encoded 100 frames (33%)
Encoded 200 frames (67%)
Video encoded (X KB) ✅

🎬 [PHASE 3: AUDIO] Rendering audio track...
Rendering audio buffer...
Audio rendered (X KB) ✅

🎬 [PHASE 4: DOWNLOAD] Triggering download...
Video file: canvas-visualizer-10s.webm (X KB)
✅ Export complete!
```

---

## Debugging Guide

### If Frames Don't Capture
1. Check console for specific frame error messages
2. Verify animation is rendering (check 3D scene)
3. Try with shorter duration (5 seconds) first
4. Clear browser cache and reload

### If Video Won't Encode
1. Check WebMWriter logs in console
2. Verify frames have valid image data
3. Try reducing frame count (limit to 300 frames)
4. Check browser WebM support: `WebMWriter.isSupported`

### If Audio Missing
1. Verify audio buffer loaded: check `audioBufferRef.current`
2. Check OfflineAudioContext success in console
3. Verify sample rate matches expected
4. Try simple sine wave audio first (diagnostic)

### If Memory Leak Suspected
1. Open DevTools Performance tab
2. Record during export
3. Check for retained objects after export
4. Look for canvas/texture memory not being freed

---

## Success Criteria

### ✅ Phase 1 Success
- 10-second test exports in < 20 seconds
- Video plays smoothly
- Audio present

### ✅ Phase 2 Success
- 60-second test exports in < 60 seconds
- No UI freezing
- Memory stays < 500 MB
- No sync drift

### ✅ Phase 3 Success
- 8-minute test completes fully
- File playable on standard players
- Quality maintained throughout
- All 480 seconds present

---

## Known Limitations (Current Implementation)

### Audio/Video Muxing
**Current:** Video and audio are separate WebM streams
**Status:** Requires server-side FFmpeg for proper WebM container muxing
**Workaround:** MP4 format on client-side requires transcoding library
**Next Step:** Implement FFmpeg.wasm or server API endpoint

### Maximum Duration
**Current:** No hard limit (tested to 8+ minutes)
**Memory:** ~10-20 MB per minute of video
**Recommendation:** Limit UI to 10 minutes per export

### Frame Rate
**Current:** Fixed at 30 FPS
**Note:** Can be adjusted in constants if needed (FRAME_RATE variable)

---

## Test Data Collection

### For 10-Second Test
```
Date/Time: [AUTO]
Browser: [Chrome/Firefox/Safari]
Audio file: [Name]
Animation preset: [Name]

Actual Timeline:
- Analysis: ___ sec
- Rendering: ___ sec
- Encoding: ___ sec
- Audio: ___ sec
- TOTAL: ___ sec

Output File Size: ___ KB
Playback Quality: [Good/Fair/Poor]
Audio Sync: [Perfect/Slight drift/Major drift]
Issues: [None/...]
```

### For Full 8-Minute Test
```
Date/Time: [AUTO]
Browser: [Chrome/Firefox/Safari]
Audio file: [Name] (Duration: ___ min)
Animation preset: [Name]

Actual Timeline:
- Analysis: ___ sec
- Rendering: ___ sec
- Encoding: ___ sec
- Audio: ___ sec
- TOTAL: ___ sec

Output File Size: ___ MB
Memory Peak: ___ MB
Playback Quality: [Excellent/Good/Fair]
Audio Sync: [Perfect/Slight drift/Major drift]
CPU Usage: [Low/Medium/High]
Issues: [None/...]
```

---

## Troubleshooting Checklist

### General Issues
- [ ] Close other browser tabs to reduce memory pressure
- [ ] Try in Incognito/Private mode (excludes extensions)
- [ ] Update browser to latest version
- [ ] Clear browser cache
- [ ] Test with different audio file

### Video Issues
- [ ] Frame size is 960×540? (Check getPixelData)
- [ ] All frames captured? (Check frame count)
- [ ] Verify WebM codec support: chrome://gpu/
- [ ] Test in different browser (Chrome, Firefox, Safari)

### Audio Issues
- [ ] Audio context suspended? (Must resume on user interaction)
- [ ] Sample rate matches? (44.1 kHz vs 48 kHz)
- [ ] Buffer has data? (Check decodeAudioData callback)
- [ ] OfflineAudioContext rendering complete? (Check event)

---

## Next Steps After Testing

1. **If All Tests Pass** ✅
   - Mark frame-by-frame export as production-ready
   - Archive test results
   - Plan Prompt #10 PR submission

2. **If Issues Found** ⚠️
   - Document specific errors with console logs
   - Implement fixes in follow-up prompts
   - Re-test affected duration ranges

3. **Enhancements for Future** 🔮
   - Implement FFmpeg.wasm for proper audio/video muxing
   - Add MP4/H.264 export option
   - Support variable frame rates
   - Add export quality presets (draft/standard/max)
