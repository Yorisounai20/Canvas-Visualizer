import { Home, Menu, ChevronDown, BadgeHelp, Video, Save, FolderOpen, FilePlus } from 'lucide-react';

interface TopBarProps {
  onBackToDashboard?: () => void;
  showFileMenu: boolean;
  setShowFileMenu: (show: boolean) => void;
  handleNewProject: () => void;
  handleSaveProject: () => void;
  setShowProjectsModal: (show: boolean) => void;
  setShowKeyboardShortcuts: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  isSaving: boolean;
  currentTime: number;
  duration: number;
  formatTime: (time: number) => string;
}

export default function TopBar({
  onBackToDashboard,
  showFileMenu,
  setShowFileMenu,
  handleNewProject,
  handleSaveProject,
  setShowProjectsModal,
  setShowKeyboardShortcuts,
  setShowExportModal,
  isSaving,
  currentTime,
  duration,
  formatTime
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      {/* Left: Branding and Navigation */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Canvas Visualizer
        </h1>
        <span className="text-xs text-gray-500 border-l border-gray-700 pl-3">
          Audio-Reactive 3D Editor
        </span>
      </div>

      {/* Center: File Menu and Time Display */}
      <div className="flex items-center gap-4">
        {/* Back to Dashboard Button */}
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
            title="Back to Dashboard"
          >
            <Home size={16} />
            <span>Dashboard</span>
          </button>
        )}
        
        {/* File Menu Dropdown */}
        <div className="relative file-menu-container">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
            title="File Menu"
          >
            <Menu size={16} />
            <span>File</span>
            <ChevronDown size={14} className={`transition-transform ${showFileMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown Menu */}
          {showFileMenu && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[180px]">
              <button
                onClick={() => {
                  handleNewProject();
                  setShowFileMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-white rounded-t-lg transition-colors"
              >
                <FilePlus size={16} />
                <span className="text-sm">New Project</span>
                <span className="ml-auto text-xs text-gray-400">Ctrl+N</span>
              </button>
              <button
                onClick={() => {
                  handleSaveProject();
                  setShowFileMenu(false);
                }}
                disabled={isSaving}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={16} />
                <span className="text-sm">{isSaving ? 'Saving...' : 'Save Project'}</span>
                <span className="ml-auto text-xs text-gray-400">Ctrl+S</span>
              </button>
              <button
                onClick={() => {
                  setShowProjectsModal(true);
                  setShowFileMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-white rounded-b-lg transition-colors"
              >
                <FolderOpen size={16} />
                <span className="text-sm">Open Project</span>
                <span className="ml-auto text-xs text-gray-400">Ctrl+O</span>
              </button>
            </div>
          )}
        </div>

        {/* Time Display */}
        <div className="px-3 py-1 rounded bg-gray-800 border border-gray-700">
          <span className="text-sm font-mono text-cyan-400">{formatTime(currentTime)}</span>
          <span className="text-xs text-gray-500 mx-1">/</span>
          <span className="text-sm font-mono text-gray-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Keyboard Shortcuts Button */}
        <button
          onClick={() => setShowKeyboardShortcuts(true)}
          className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <BadgeHelp size={16} />
        </button>
        
        {/* Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
          title="Video Export"
        >
          <Video size={16} />
          <span className="text-sm font-semibold">Export</span>
        </button>
      </div>
    </div>
  );
}
