import { Video, X } from 'lucide-react';

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
  if (!showExportModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
            <Video size={24} />
            Video Export
          </h2>
          <button
            onClick={() => setShowExportModal(false)}
            className="text-gray-400 hover:text-white transition-colors"
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
              <option value="960x540">960x540 (SD)</option>
              <option value="1280x720">1280x720 (HD 720p)</option>
              <option value="1920x1080">1920x1080 (Full HD 1080p)</option>
            </select>
          </div>
          
          {/* Format Selector */}
          <div>
            <label className="text-sm text-gray-300 block mb-2 font-semibold">Output Format</label>
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value)}
              disabled={isExporting}
              className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 focus:outline-none">
              <option value="webm">WebM (VP9 + Opus)</option>
              <option value="mp4">MP4 (if supported)</option>
            </select>
          </div>

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
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progress</span>
                <span>{exportProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-purple-500 h-3 rounded-full transition-all duration-300" 
                  style={{width: `${exportProgress}%`}}>
                </div>
              </div>
              <p className="text-purple-400 text-sm mt-2 animate-pulse text-center">🎬 Rendering video...</p>
            </div>
          )}
          
          <p className="text-xs text-gray-400 text-center">Automatically renders full timeline with all presets & camera movements</p>
        </div>
      </div>
    </div>
  );
}
