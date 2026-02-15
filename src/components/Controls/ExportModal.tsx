import React, { useState } from 'react';
import { Video, X, Info } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  isExporting: boolean;
  exportProgress: number;
  exportFormat: string;
  exportResolution: string;
  audioReady: boolean;
  onClose: () => void;
  onExport: () => void;
  onSetFormat: (format: string) => void;
  onSetResolution: (resolution: string) => void;
}

// Quality presets with estimated file sizes
const QUALITY_PRESETS = {
  'low': { bitrate: 4, label: 'Low Quality', suffix: '~2MB/min' },
  'medium': { bitrate: 8, label: 'Medium Quality', suffix: '~4MB/min' },
  'high': { bitrate: 12, label: 'High Quality', suffix: '~6MB/min' },
  'ultra': { bitrate: 20, label: 'Ultra Quality', suffix: '~10MB/min' },
};

/**
 * ExportModal Component - Video export settings modal
 * Allows user to configure export settings and initiate rendering
 */
export default function ExportModal({
  isOpen,
  isExporting,
  exportProgress,
  exportFormat,
  exportResolution,
  audioReady,
  onClose,
  onExport,
  onSetFormat,
  onSetResolution
}: ExportModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleExportAndClose = () => {
    onExport();
    onClose();
  };

  // Get estimated file size based on resolution
  const getEstimatedSize = () => {
    const [width, height] = exportResolution.split('x').map(Number);
    const pixels = width * height;
    let sizePerMin = 4; // MB per minute (medium quality estimate)
    
    if (pixels >= 1920 * 1080) {
      sizePerMin = 10;
    } else if (pixels >= 1280 * 720) {
      sizePerMin = 6;
    }
    
    return `~${sizePerMin}MB/min`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#2B2B2B] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
            <Video size={24} />
            Video Export
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Resolution Selector */}
          <div>
            <label className="text-sm text-gray-300 block mb-2 font-semibold">
              Export Resolution
            </label>
            <select 
              value={exportResolution} 
              onChange={(e) => onSetResolution(e.target.value)}
              disabled={isExporting}
              className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
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
            <label className="text-sm text-gray-300 block mb-2 font-semibold">
              Output Format
            </label>
            <select 
              value={exportFormat} 
              onChange={(e) => onSetFormat(e.target.value)}
              disabled={isExporting}
              className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="webm-vp9">WebM (VP9 + Opus) - Recommended</option>
              <option value="webm-vp8">WebM (VP8 + Opus) - Compatible</option>
              <option value="mp4">MP4 (H.264) - If Supported</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {exportFormat.startsWith('webm') 
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
            onClick={handleExportAndClose} 
            disabled={!audioReady || isExporting} 
            className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
              !audioReady || isExporting 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700'
            } text-white transition-colors`}
          >
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
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-purple-400 text-sm animate-pulse">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-2">Rendering video...</span>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Please keep this tab active during export
              </p>
            </div>
          )}
          
          {!isExporting && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded p-3">
              <p className="text-xs text-blue-300 text-center">
                💡 Export automatically renders your full timeline with all presets, camera movements, and effects
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
