# Audio Playback Fix Documentation

## Problem Statement
When playing or exporting audio, the animations would stop after approximately 10 seconds even though the audio continued playing. The exported video files would only show 10 seconds of animation before freezing.

## Root Cause
The `AudioBufferSourceNode` in the Web Audio API automatically stops when it reaches the end of the audio buffer. However, the application had no event handlers to detect this completion and update the `isPlaying` state. This caused:

1. Audio buffer source nodes to stop automatically at the end
2. The `isPlaying` state to remain `true` 
3. The animation loop to continue running with silent audio data
4. Animations to appear frozen/stopped due to lack of audio frequency data

## Solution
Added `onended` event handlers to all audio buffer source nodes to properly clean up playback state when audio completes:

### 1. Single Track Playback (`playAudio`)
```javascript
src.onended = () => {
  if (bufferSourceRef.current === src) {
    bufferSourceRef.current = null;
    pauseTimeRef.current = 0; // Reset to beginning
    setCurrentTime(0);
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }
};
```

### 2. Multi-Track Playback (`playMultiTrackAudio`)
```javascript
// Track which sources have ended
let endedCount = 0;
const totalTracks = tracks.filter(t => t.buffer).length;

// For each track:
source.onended = () => {
  endedCount++;
  // When all tracks have ended, stop playback
  if (endedCount >= totalTracks) {
    pauseTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }
};
```

### 3. Video Export (`exportVideo`)
```javascript
src.onended = () => {
  // Give a small delay to capture final frames
  setTimeout(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (bufferSourceRef.current === src) {
      bufferSourceRef.current = null;
    }
  }, 500);
};
```

## Testing Instructions

### Manual Testing - Local Playback
1. Start the development server: `npm run dev`
2. Open http://localhost:5173
3. Navigate to Software Mode or Editor Mode
4. Upload an audio file (any format supported by Web Audio API)
5. Press Play
6. Observe that:
   - Animations play throughout the entire audio duration
   - When audio completes, playback stops automatically
   - The time resets to 0:00
   - The scene returns to the idle/paused state

### Manual Testing - Video Export
1. Upload an audio file
2. Configure export settings (resolution, format)
3. Click "Export Video"
4. Wait for export to complete
5. Play the exported video file
6. Verify that:
   - Animations run for the full audio duration
   - No freezing or stopping occurs mid-video
   - Audio and video are synchronized throughout
   - Video ends cleanly when audio ends

## Files Changed
- `src/visualizer-software.tsx`: Added `onended` handlers to audio source nodes in three locations

## Related Issues
This fix addresses the following symptoms:
- Animations stopping after ~10 seconds during playback
- Exported videos only showing 10 seconds of animation
- Scene appearing to revert to paused state while audio continues
- Dark/dimmed scene not maintaining during full playback
