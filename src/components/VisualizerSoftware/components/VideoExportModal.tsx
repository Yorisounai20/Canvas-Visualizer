import { Video, X, Info } from 'lucide-react';
import { useState } from 'react';

interface VideoExportModalProps {
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  exportResolution: string;
  setExportResolution: (resolution: string) => void;
  exportFormat: string;
  setExportFormat: (format: string) => void;
  exportMode: 'live' | 'frame-by-frame';
  setExportMode: (mode: 'live' | 'frame-by-frame') => void;
  exportFramerate: number;
  setExportFramerate: (rate: number) => void;
  isExporting: boolean;
  audioReady: boolean;
  exportProgress: number;
  handleExportAndCloseModal: () => void;
  duration: number;
  testAudioAnalysis: () => Promise<void>;
  testFrameByFrameExport?: () => Promise<void>;
}

export function VideoExportModal({
  showExportModal,
  setShowExportModal,
  exportResolution,
  setExportResolution,
  exportFormat,
  setExportFormat,
  exportMode,
  setExportMode,
  exportFramerate,
  setExportFramerate,
  isExporting,
  audioReady,
  exportProgress,
  handleExportAndCloseModal,
  duration,
  testAudioAnalysis,
  testFrameByFrameExport
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
          {/* Export Mode Selector - NEW */}
          <div>
            <label className="text-sm text-gray-300 block mb-2 font-semibold">Export Mode</label>
            <select 
              value={exportMode} 
              onChange={(e) => setExportMode(e.target.value as 'live' | 'frame-by-frame')}
              disabled={isExporting}
              className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 focus:outline-none">
              <option value="live">Live Recording (Real-time) - Default</option>
              <option value="frame-by-frame">Frame-by-Frame (Offline) - Better for Weak Laptops</option>
            </select>
            {exportMode === 'frame-by-frame' ? (
              <p className="text-xs text-green-400 mt-1">
                ⚡ Recommended for weak hardware! Renders offline without performance issues.
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Real-time capture. May be choppy on weak hardware.
              </p>
            )}
          </div>

          {/* Frame Rate Selector - Only shown for frame-by-frame mode */}
          {exportMode === 'frame-by-frame' && (
            <div>
              <label className="text-sm text-gray-300 block mb-2 font-semibold">Frame Rate</label>
              <select 
                value={exportFramerate} 
                onChange={(e) => setExportFramerate(Number(e.target.value))}
                disabled={isExporting}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 focus:outline-none">
                <option value="24">24 FPS (Cinematic)</option>
                <option value="30">30 FPS (Standard)</option>
                <option value="60">60 FPS (Smooth)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Higher FPS = smoother but larger file size
              </p>
            </div>
          )}

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
              {exportMode === 'frame-by-frame' ? (
                <option value="mp4">MP4 (H.264) - FFmpeg Output</option>
              ) : (
                <>
                  <option value="webm-vp8">WebM (VP8 + Opus) - Recommended for 1080p</option>
                  <option value="webm-vp9">WebM (VP9 + Opus) - Best Quality (slower)</option>
                  <option value="mp4">MP4 (H.264) - If Supported</option>
                </>
              )}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {exportMode === 'frame-by-frame'
                ? '✓ Uses FFmpeg.wasm to combine frames + audio'
                : exportFormat === 'webm-vp8' 
                ? '✓ Fast encoding, great quality' 
                : exportFormat === 'webm-vp9'
                ? '✓ Best compression (slower encoding)'
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
                {exportMode === 'frame-by-frame' ? (
                  <ul className="space-y-1 ml-2">
                    <li>• Mode: Offline frame-by-frame rendering</li>
                    <li>• Frame Rate: {exportFramerate} FPS</li>
                    <li>• Audio: Combined with FFmpeg.wasm</li>
                    <li>• Performance: Independent of system speed</li>
                    <li>• Perfect for weak hardware!</li>
                  </ul>
                ) : (
                  <ul className="space-y-1 ml-2">
                    <li>• Mode: Real-time live recording</li>
                    <li>• Frame Rate: 30 FPS</li>
                    <li>• Audio: 48kHz Opus codec</li>
                    <li>• Bitrate: Auto (resolution-based)</li>
                    <li>• Captures all presets, camera movements & keyframes</li>
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Warning for long exports */}
          {audioReady && duration > 300 && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
              <p className="text-sm text-yellow-300 font-semibold">⚠️ Long Export Notice</p>
              <p className="text-xs text-yellow-400 mt-1">
                This {Math.floor(duration / 60)}-minute video will take 15-30 minutes to export.
                Keep this tab active and visible during the entire process.
              </p>
            </div>
          )}

          {/* Test Audio Analysis Button - Development/Testing */}
          {audioReady && exportMode === 'frame-by-frame' && !isExporting && (
            <div className="space-y-2">
              <button 
                onClick={testAudioAnalysis} 
                className="w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors border-2 border-blue-400">
                <span className="text-lg">🧪</span>
                Test Audio Analysis
              </button>
              <button
                onClick={() => { (window as any).testExport && (window as any).testExport(); }}
                className="w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black transition-colors border-2 border-yellow-400">
                <span className="text-lg">⚡</span>
                Test Export (10s)
              </button>
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
              {/* Preview Mode Notice */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded p-2 mb-3">
                <p className="text-xs text-blue-300 text-center">
                  📹 Preview mode active for optimal performance
                </p>
              </div>
              
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
