# Complete Export Code Documentation

## Table of Contents
1. [Export Constants](#1-export-constants)
2. [Export State Variables](#2-export-state-variables)
3. [Export Refs](#3-export-refs)
4. [Main Export Function](#4-main-export-function)
5. [Export Handler Function](#5-export-handler-function)
6. [Export UI Components](#6-export-ui-components)
7. [Export Button Integration](#7-export-button-integration)

---

## 1. Export Constants

**Location:** `src/visualizer-software.tsx` (Lines 103-113)

```typescript
// Export video quality constants
const EXPORT_BITRATE_SD = 8000000;      // 8 Mbps for 960x540
const EXPORT_BITRATE_HD = 12000000;     // 12 Mbps for 1280x720
const EXPORT_BITRATE_FULLHD = 20000000; // 20 Mbps for 1920x1080
const EXPORT_BITRATE_QHD = 30000000;    // 30 Mbps for 2560x1440
const EXPORT_BITRATE_4K = 50000000;     // 50 Mbps for 3840x2160
const EXPORT_PIXELS_HD = 1280 * 720;
const EXPORT_PIXELS_FULLHD = 1920 * 1080;
const EXPORT_PIXELS_QHD = 2560 * 1440;
const EXPORT_PIXELS_4K = 3840 * 2160;
const EXPORT_TIMESLICE_MS = 1000;       // Request data every 1 second
const EXPORT_DATA_REQUEST_INTERVAL_MS = 2000; // Request data every 2 seconds
```

---

## 2. Export State Variables

**Location:** `src/visualizer-software.tsx` (Lines 358-363)

```typescript
// NEW: Video export state
const [isExporting, setIsExporting] = useState(false);
const [exportProgress, setExportProgress] = useState(0);
const [exportFormat, setExportFormat] = useState('webm-vp9'); // 'webm-vp9', 'webm-vp8', or 'mp4'
const [exportResolution, setExportResolution] = useState('960x540'); // '960x540', '1280x720', '1920x1080'
const [showExportModal, setShowExportModal] = useState(false);
```

---

## 3. Export Refs

**Location:** `src/visualizer-software.tsx` (Lines 352-353)

```typescript
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const recordedChunksRef = useRef<Blob[]>([]);
```

---

## 4. Main Export Function

**Location:** `src/visualizer-software.tsx` (Lines 2246-2557)

```typescript
// NEW: Automated video export functions
const exportVideo = async () => {
  if (!rendererRef.current || !audioContextRef.current || !audioBufferRef.current) {
    addLog('Cannot export: scene or audio not ready', 'error');
    return;
  }

  if (!audioReady) {
    addLog('Please load an audio file first', 'error');
    return;
  }

  try {
    setIsExporting(true);
    setExportProgress(0);
    addLog('Starting automated video export...', 'info');

    // Get audio duration and update state to prevent animation loop issues
    const duration = audioBufferRef.current.duration;
    setDuration(duration);
    
    // Parse export resolution
    const [exportWidth, exportHeight] = exportResolution.split('x').map(Number);
    
    // Store original canvas size
    const originalWidth = 960;
    const originalHeight = 540;
    
    // Temporarily resize renderer to export resolution
    rendererRef.current.setSize(exportWidth, exportHeight);
    if (cameraRef.current) {
      cameraRef.current.aspect = exportWidth / exportHeight;
      cameraRef.current.updateProjectionMatrix();
    }
    addLog(`Rendering at ${exportResolution} for export`, 'info');

    // FIX: Create a SEPARATE gain node to split the audio signal properly
    // This prevents the analyser connection conflict that was causing the 8-second freeze
    const exportGainNode = audioContextRef.current.createGain();
    exportGainNode.gain.value = 1.0;
    
    // Create audio destination for recording (separate from analyser)
    const audioDestination = audioContextRef.current.createMediaStreamDestination();
    
    // Connect: source → exportGain → audioDestination (for recording)
    // The analyser will be connected separately from the buffer source below
    exportGainNode.connect(audioDestination);
    
    // Set up video stream
    const canvasStream = rendererRef.current.domElement.captureStream(30);
    const audioStream = audioDestination.stream;
    
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStream.getAudioTracks()
    ]);
    
    // Determine MIME type and codec based on format
    let mimeType = 'video/webm;codecs=vp9,opus';
    let extension = 'webm';
    
    if (exportFormat === 'webm-vp8') {
      mimeType = 'video/webm;codecs=vp8,opus';
      extension = 'webm';
    } else if (exportFormat === 'webm-vp9') {
      mimeType = 'video/webm;codecs=vp9,opus';
      extension = 'webm';
    } else if (exportFormat === 'mp4') {
      // Note: MP4 export depends on browser support
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        extension = 'mp4';
      } else {
        addLog('MP4 not supported, falling back to WebM VP9', 'info');
        mimeType = 'video/webm;codecs=vp9,opus';
        extension = 'webm';
      }
    }
    
    // Verify codec support
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      addLog(`Warning: ${mimeType} may not be fully supported, trying fallback...`, 'error');
      // Try VP8 as fallback (broader support)
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Last resort: plain WebM
        mimeType = 'video/webm';
      }
      addLog(`Using fallback codec: ${mimeType}`, 'info');
    } else {
      addLog(`Using codec: ${mimeType}`, 'info');
    }
    
    // Calculate bitrate based on resolution for better quality
    const pixelCount = exportWidth * exportHeight;
    let videoBitrate = EXPORT_BITRATE_SD; // Default 8Mbps for 960x540
    if (pixelCount >= EXPORT_PIXELS_4K) {
      videoBitrate = EXPORT_BITRATE_4K; // 50Mbps for 4K
    } else if (pixelCount >= EXPORT_PIXELS_QHD) {
      videoBitrate = EXPORT_BITRATE_QHD; // 30Mbps for 1440p
    } else if (pixelCount >= EXPORT_PIXELS_FULLHD) {
      videoBitrate = EXPORT_BITRATE_FULLHD; // 20Mbps for 1080p
    } else if (pixelCount >= EXPORT_PIXELS_HD) {
      videoBitrate = EXPORT_BITRATE_HD; // 12Mbps for 720p
    }
    
    let recorder;
    try {
      recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: videoBitrate
      });
    } catch (error) {
      addLog(`Failed to create MediaRecorder with ${mimeType}, trying without codec specification`, 'error');
      // Fallback without specific codec
      try {
        recorder = new MediaRecorder(combinedStream, {
          videoBitsPerSecond: videoBitrate
        });
        addLog('MediaRecorder created with default settings', 'info');
      } catch (fallbackError) {
        addLog(`Export failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`, 'error');
        setIsExporting(false);
        setExportProgress(0);
        return;
      }
    }
    
    recordedChunksRef.current = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };
    
    recorder.onstop = () => {
      // Cleanup: disconnect the export gain node
      exportGainNode.disconnect();
      
      // Check if we have any recorded data
      if (recordedChunksRef.current.length === 0) {
        addLog('Export failed: No video data recorded', 'error');
        setIsExporting(false);
        setExportProgress(0);
        return;
      }
      
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      
      // Verify blob has data
      if (blob.size === 0) {
        addLog('Export failed: Video file is empty', 'error');
        setIsExporting(false);
        setExportProgress(0);
        return;
      }
      
      addLog(`Video blob created: ${(blob.size / 1024 / 1024).toFixed(2)} MB`, 'info');
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visualizer_${exportResolution}_${Date.now()}.${extension}`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Delay cleanup to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addLog(`Video exported successfully at ${exportResolution} as ${extension.toUpperCase()}!`, 'success');
        addLog(`File size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`, 'info');
      }, 1000);
      
      setIsExporting(false);
      setExportProgress(100);
      
      // Restore original canvas size
      if (rendererRef.current) {
        rendererRef.current.setSize(originalWidth, originalHeight);
      }
      if (cameraRef.current) {
        cameraRef.current.aspect = originalWidth / originalHeight;
        cameraRef.current.updateProjectionMatrix();
      }
      
      // FIX: Don't reset playback state - keep current position
      // This prevents camera distortion and preserves user's timeline position
      setIsPlaying(false);
    };
    
    // Add error handler for recorder
    recorder.onerror = (event: any) => {
      addLog(`MediaRecorder error: ${event.error?.message || 'Unknown error'}`, 'error');
      console.error('MediaRecorder error:', event);
      setIsExporting(false);
      setExportProgress(0);
      setIsRecording(false);
    };
    
    // Start recording with timeslice to capture data periodically
    try {
      recorder.start(EXPORT_TIMESLICE_MS);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      addLog('Recording started', 'success');
    } catch (error) {
      addLog(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setIsExporting(false);
      setExportProgress(0);
      return;
    }

    // Track progress
    const AUDIO_END_THRESHOLD = 0.1;
    const FINAL_FRAME_DELAY = 500;
    
    // FIX: Create audio source with proper routing to avoid analyser conflicts
    // Connect: bufferSource → analyser → destination (for visualization)
    //                       → exportGain → audioDestination (for recording)
    const src = audioContextRef.current.createBufferSource();
    src.buffer = audioBufferRef.current;
    
    // Connect to analyser for visualization (existing path)
    src.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
    
    // ALSO connect to export gain for recording (new separate path)
    src.connect(exportGainNode);
    
    // Add onended handler to ensure recording stops
    src.onended = () => {
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        if (bufferSourceRef.current === src) {
          bufferSourceRef.current = null;
        }
      }, FINAL_FRAME_DELAY);
    };
    
    // FIX: Reset timing BEFORE starting playback to prevent camera distortion
    pauseTimeRef.current = 0;
    setCurrentTime(0);
    startTimeRef.current = Date.now();
    
    // Start audio playback
    src.start(0, 0);
    bufferSourceRef.current = src;
    
    // FIX: Set isPlaying AFTER all setup is complete to prevent race conditions
    setIsPlaying(true);
    
    // Request data periodically to ensure consistent recording
    const dataRequestInterval = setInterval(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.requestData();
        } catch (e) {
          console.warn('Failed to request data from recorder:', e);
        }
      }
    }, EXPORT_DATA_REQUEST_INTERVAL_MS);
    
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const progress = (elapsed / duration) * 100;
      setExportProgress(Math.min(progress, 99));
      setCurrentTime(elapsed);
      
      // Stop when audio ends
      if (elapsed >= duration - AUDIO_END_THRESHOLD) {
        clearInterval(progressInterval);
        clearInterval(dataRequestInterval);
        setTimeout(() => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            if (bufferSourceRef.current) {
              bufferSourceRef.current.stop();
              bufferSourceRef.current = null;
            }
          }
        }, FINAL_FRAME_DELAY);
      }
    }, 100);

    addLog(`Exporting ${duration.toFixed(1)}s video at ${exportResolution} as ${extension.toUpperCase()}...`, 'info');
    addLog(`Video bitrate: ${(videoBitrate / 1000000).toFixed(1)} Mbps, Frame rate: 30 FPS`, 'info');

  } catch (e) {
    const error = e as Error;
    addLog(`Export error: ${error.message}`, 'error');
    console.error('Export error:', e);
    setIsExporting(false);
    setExportProgress(0);
    
    // Restore original canvas size on error
    const originalWidth = 960;
    const originalHeight = 540;
    if (rendererRef.current) {
      rendererRef.current.setSize(originalWidth, originalHeight);
    }
    if (cameraRef.current) {
      cameraRef.current.aspect = originalWidth / originalHeight;
      cameraRef.current.updateProjectionMatrix();
    }
  }
};
```

---

## 5. Export Handler Function

**Location:** `src/visualizer-software.tsx` (Lines 1040-1043)

```typescript
const handleExportAndCloseModal = () => {
  // Don't close modal - keep it open to show progress
  exportVideo();
  // Modal will stay open to display progress bar during export
};
```

---

## 6. Export UI Components

### 6.1 VideoExportModal Component

**Location:** `src/components/VisualizerSoftware/components/VideoExportModal.tsx`

```typescript
import { Video, X, Info } from 'lucide-react';
import { useState } from 'react';

interface VideoExportModalProps {
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  exportResolution: string;
  setExportResolution: (resolution: string) => void;
  exportFormat: string;
  setExportFormat: (format: string) => void;
  isExporting: boolean;
  audioReady: boolean;
  exportProgress: number;
  handleExportAndCloseModal: () => void;
}

export function VideoExportModal({
  showExportModal,
  setShowExportModal,
  exportResolution,
  setExportResolution,
  exportFormat,
  setExportFormat,
  isExporting,
  audioReady,
  exportProgress,
  handleExportAndCloseModal
}: VideoExportModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!showExportModal) return null;

  // Get estimated file size based on resolution
  const getEstimatedSize = () => {
    const [width, height] = exportResolution.split('x').map(Number);
    const pixels = width * height;
    let sizePerMin = 4; // MB per minute (medium quality estimate)
    
    if (pixels >= 3840 * 2160) {
      sizePerMin = 25; // 4K
    } else if (pixels >= 2560 * 1440) {
      sizePerMin = 15; // 1440p
    } else if (pixels >= 1920 * 1080) {
      sizePerMin = 10; // 1080p
    } else if (pixels >= 1280 * 720) {
      sizePerMin = 6; // 720p
    }
    
    return `~${sizePerMin}MB/min`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
      <div className="bg-[#2B2B2B] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
            <Video size={24} />
            {isExporting ? 'Exporting Video...' : 'Video Export'}
          </h2>
          <button
            onClick={() => setShowExportModal(false)}
            disabled={isExporting}
            className={`text-gray-400 hover:text-white transition-colors p-1 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isExporting ? 'Please wait for export to complete' : 'Close'}
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Resolution Selector */}
          <div>
            <label className="text-sm text-gray-300 block mb-2 font-semibold">Export Resolution</label>
            <select 
              value={exportResolution} 
              onChange={(e) => setExportResolution(e.target.value)}
              disabled={isExporting}
              className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 focus:outline-none">
              <option value="960x540">960×540 (SD) - Fast</option>
              <option value="1280x720">1280×720 (HD 720p) - Balanced</option>
              <option value="1920x1080">1920×1080 (Full HD 1080p) - High Quality</option>
              <option value="2560x1440">2560×1440 (QHD 1440p) - Ultra</option>
              <option value="3840x2160">3840×2160 (4K UHD) - Maximum</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Estimated size: {getEstimatedSize()}
            </p>
          </div>
          
          {/* Format Selector */}
          <div>
            <label className="text-sm text-gray-300 block mb-2 font-semibold">Output Format</label>
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value)}
              disabled={isExporting}
              className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 focus:outline-none">
              <option value="webm-vp9">WebM (VP9 + Opus) - Recommended</option>
              <option value="webm-vp8">WebM (VP8 + Opus) - Compatible</option>
              <option value="mp4">MP4 (H.264) - If Supported</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {exportFormat === 'webm-vp9' || exportFormat === 'webm-vp8'
                ? '✓ Best compression & quality ratio' 
                : '⚠ Browser support may vary'}
            </p>
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <Info size={14} />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </button>

          {showAdvanced && (
            <div className="bg-gray-800 rounded p-3 space-y-2 border border-gray-700">
              <div className="text-xs text-gray-300">
                <p className="font-semibold mb-1">Export Settings:</p>
                <ul className="space-y-1 ml-2">
                  <li>• Frame Rate: 30 FPS</li>
                  <li>• Audio: 48kHz Opus codec</li>
                  <li>• Bitrate: Auto (resolution-based)</li>
                  <li>• Captures all presets, camera movements & keyframes</li>
                </ul>
              </div>
            </div>
          )}

          {/* Export Button */}
          <button 
            onClick={handleExportAndCloseModal} 
            disabled={!audioReady || isExporting} 
            className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${!audioReady || isExporting ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white transition-colors`}>
            <Video size={20} />
            {isExporting ? 'Exporting...' : 'Export Full Video'}
          </button>

          {/* Progress Bar */}
          {isExporting && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Rendering Progress</span>
                <span className="font-mono">{exportProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300 ease-out" 
                  style={{width: `${exportProgress}%`}}>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-purple-400 text-sm animate-pulse">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-2">Rendering video...</span>
              </div>
              <p className="text-xs text-gray-400 text-center">Please keep this tab active during export</p>
              
              {/* Show completion message when at 100% */}
              {exportProgress === 100 && (
                <div className="mt-4 bg-green-900/20 border border-green-700/30 rounded p-3">
                  <p className="text-sm text-green-300 text-center font-semibold">✅ Export Complete!</p>
                  <p className="text-xs text-green-400 text-center mt-1">Your video file should now be downloading</p>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
          
          {!isExporting && exportProgress === 100 && (
            <div className="bg-green-900/20 border border-green-700/30 rounded p-3">
              <p className="text-sm text-green-300 text-center">✅ Export Complete! Check your downloads folder.</p>
            </div>
          )}
          
          {!isExporting && exportProgress !== 100 && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded p-3">
              <p className="text-xs text-blue-300 text-center">💡 Export automatically renders your full timeline with all presets, camera movements, and effects</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 6.2 ExportModal Component (Alternative)

**Location:** `src/components/Controls/ExportModal.tsx`

This is an alternative export modal component with similar functionality but slightly different styling and structure. See the full file for implementation details.

---

## 7. Export Button Integration

### 7.1 TopBar Export Button

**Location:** `src/visualizer/TopBar.tsx` (Lines 247-255)

```typescript
{/* Export Button */}
<button
  onClick={() => setShowExportModal(true)}
  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
  title="Video Export"
>
  <Video size={16} />
  <span className="text-sm font-semibold">Export</span>
</button>
```

### 7.2 Modal Rendering

**Location:** `src/visualizer-software.tsx` (Lines 10530-10541)

```typescript
{/* Export Modal */}
<VideoExportModal
  showExportModal={showExportModal}
  setShowExportModal={setShowExportModal}
  exportResolution={exportResolution}
  setExportResolution={setExportResolution}
  exportFormat={exportFormat}
  setExportFormat={setExportFormat}
  isExporting={isExporting}
  audioReady={audioReady}
  exportProgress={exportProgress}
  handleExportAndCloseModal={handleExportAndCloseModal}
/>
```

---

## Export Flow Summary

1. **User clicks Export button** in TopBar
2. **Export modal opens** (`setShowExportModal(true)`)
3. **User selects:**
   - Resolution (SD, HD, FHD, QHD, 4K)
   - Format (WebM VP9, WebM VP8, MP4)
   - Views advanced settings if needed
4. **User clicks "Export Full Video"**
5. **`handleExportAndCloseModal()`** calls `exportVideo()`
6. **Export process:**
   - Sets `isExporting` to true
   - Resizes canvas to export resolution
   - Creates separate audio routing (gain node + destination)
   - Sets up MediaRecorder with codec and bitrate
   - Starts recording with error handlers
   - Plays audio through dual routing (visualization + recording)
   - Updates progress every 100ms
   - Stops recording when audio ends
7. **On completion:**
   - Creates blob from recorded chunks
   - Validates file size
   - Triggers download
   - Restores original canvas size
   - Shows completion message
   - Sets progress to 100%
8. **User closes modal** when ready

---

## Key Features

### Audio Routing Architecture
- **Dual-path routing** prevents analyser conflicts
- Visualization path: `bufferSource → analyser → destination`
- Recording path: `bufferSource → exportGain → audioDestination`

### Quality Control
- Resolution-based bitrate selection (8-50 Mbps)
- Codec fallback chain: VP9 → VP8 → plain WebM
- 30 FPS capture rate

### Error Handling
- MediaRecorder creation errors
- Recording start errors
- Empty file detection
- Codec support verification
- Runtime error handlers

### User Experience
- Real-time progress bar (0-100%)
- Modal stays open during export
- Completion message with close button
- File size logging
- Estimated file size display

---

## Export Quality Settings

| Resolution | Bitrate | File Size (est.) |
|------------|---------|------------------|
| 960×540 (SD) | 8 Mbps | ~4 MB/min |
| 1280×720 (HD) | 12 Mbps | ~6 MB/min |
| 1920×1080 (FHD) | 20 Mbps | ~10 MB/min |
| 2560×1440 (QHD) | 30 Mbps | ~15 MB/min |
| 3840×2160 (4K) | 50 Mbps | ~25 MB/min |

---

## Browser Compatibility

| Browser | VP9 | VP8 | WebM | Result |
|---------|-----|-----|------|---------|
| Chrome 90+ | ✅ | ✅ | ✅ | VP9 (best) |
| Firefox 85+ | ✅ | ✅ | ✅ | VP9 (best) |
| Safari 15+ | ⚠️ | ✅ | ✅ | VP8 (fallback) |
| Edge 90+ | ✅ | ✅ | ✅ | VP9 (best) |
| Opera 75+ | ✅ | ✅ | ✅ | VP9 (best) |

---

**Last Updated:** February 16, 2026  
**Complete Code Location:** Canvas Visualizer Repository  
**Main Files:** 
- `src/visualizer-software.tsx`
- `src/components/VisualizerSoftware/components/VideoExportModal.tsx`
- `src/components/Controls/ExportModal.tsx`
- `src/visualizer/TopBar.tsx`
