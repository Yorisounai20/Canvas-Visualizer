# Export Instant Completion - Debugging Guide

## Problem

Videos are exporting instantly with no file size, indicating that no actual video data is being recorded.

## Diagnostic Logging Added

The export function now includes comprehensive logging to help identify the root cause.

## How to Debug

### Step 1: Load Audio
1. Open the visualizer
2. Load an audio file (MP3, WAV, etc.)
3. Verify the audio plays correctly

### Step 2: Open Browser Console
1. Press F12 to open Developer Tools
2. Go to the Console tab
3. Clear the console (optional)

### Step 3: Start Export
1. Click the Export button
2. Select your desired resolution and format
3. Click "Export Full Video"

### Step 4: Watch Console Logs

You should see logs like this:

```
Starting automated video export...
Audio duration: XX.XX seconds           ← Check this value!
Rendering at 1920x1080 for export
Using codec: video/webm;codecs=vp9,opus
Recording started successfully
Recorder state: recording               ← Should say "recording"
Will record for XX.XX seconds           ← Should match audio duration
Recording progress: 5.0s / 30.0s (17%)  ← Should appear every 5 seconds
Recording progress: 10.0s / 30.0s (33%)
Recording progress: 15.0s / 30.0s (50%)
...
Stopping recording - duration reached: XX.XXs
Final recorder state before stop: recording
Video blob created: XX.XX MB            ← File size should be > 0
Video exported successfully!
```

## What to Look For

### Symptom 1: Duration is 0 or very small
```
Audio duration: 0.00 seconds            ← BAD!
Export failed: Audio duration is invalid or zero
```

**Cause:** Audio buffer not loaded properly  
**Fix:** Reload the audio file

### Symptom 2: Recorder not in "recording" state
```
Recorder state: inactive                ← BAD!
```

**Cause:** MediaRecorder failed to start  
**Fix:** Check browser compatibility, try different codec

### Symptom 3: Progress jumps to 100% immediately
```
Will record for 30.00 seconds
Stopping recording - duration reached: 0.10s  ← BAD! Too fast!
```

**Cause:** Timing issue - startTimeRef or elapsed calculation wrong  
**Fix:** Need to investigate timing refs

### Symptom 4: No progress logs appear
```
Will record for 30.00 seconds
Video blob created: 0.00 MB             ← No progress logs in between
```

**Cause:** Progress interval never ran or was cleared immediately  
**Fix:** Check if setInterval is working

### Symptom 5: Empty blob
```
Video blob created: 0.00 MB             ← BAD!
Export failed: Video file is empty
```

**Cause:** No data chunks recorded (ondataavailable never fired)  
**Fix:** MediaRecorder issue - check timeslice, check stream

## Common Issues and Solutions

### Issue: Audio duration shows 0
- **Check:** Is audio actually loaded? Try playing it first
- **Check:** Is audioBufferRef.current valid?
- **Solution:** Reload the audio file

### Issue: MediaRecorder fails to start
- **Check:** Browser console for MediaRecorder errors
- **Check:** Is the codec supported? (VP9 may not work in Safari)
- **Solution:** Use WebM VP8 format instead of VP9

### Issue: Recording completes instantly
- **Check:** Is startTimeRef.current being set correctly?
- **Check:** Is the elapsed time calculation correct?
- **Solution:** May need to fix timing calculation

### Issue: Blob is empty (0 MB)
- **Check:** Is ondataavailable being called?
- **Check:** Is the stream valid (has video and audio tracks)?
- **Check:** Is recorder.start() actually starting?
- **Solution:** Verify stream setup and recorder configuration

## Report Back

When reporting the issue, please include:

1. **Browser and version** (Chrome 120, Firefox 115, etc.)
2. **All console logs** from export attempt
3. **Audio file duration** (how long is the audio?)
4. **Exported file size** (what does it say in the log?)
5. **Any errors** in console (red text)

## Technical Details

The export process:
1. Validates audio buffer and duration
2. Resizes canvas to export resolution
3. Sets up MediaRecorder with codec
4. Starts recording with 1-second timeslice
5. Plays audio through dual routing
6. Updates progress every 100ms
7. Stops when elapsed time >= duration
8. Creates blob and downloads

If any step fails, the diagnostic logs will show where.

---

**File:** EXPORT_INSTANT_DEBUG.md  
**Purpose:** Help identify why exports complete instantly with no file size  
**Created:** February 16, 2026
