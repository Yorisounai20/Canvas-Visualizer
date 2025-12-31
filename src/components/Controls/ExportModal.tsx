import React from 'react';
import { Video, X } from 'lucide-react';

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
  if (!isOpen) return null;

  const handleExportAndClose = () => {
    onExport();
    onClose();
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
              <option value="960x540">960x540 (SD)</option>
              <option value="1280x720">1280x720 (HD 720p)</option>
              <option value="1920x1080">1920x1080 (Full HD 1080p)</option>
            </select>
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
              <option value="webm">WebM (VP9 + Opus)</option>
              <option value="mp4">MP4 (if supported)</option>
            </select>
          </div>

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
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progress</span>
                <span>{exportProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-purple-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-purple-400 text-sm mt-2 animate-pulse text-center">
                🎬 Rendering video...
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-400 text-center">
            Automatically renders full timeline with all presets & camera movements
          </p>
        </div>
      </div>
    </div>
  );
}
