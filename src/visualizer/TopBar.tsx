import { Home, ChevronDown, BadgeHelp, Video, Save, FolderOpen, FilePlus, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TopBarProps {
  onBackToDashboard?: () => void;
  handleNewProject: () => void;
  handleSaveProject: () => void;
  setShowProjectsModal: (show: boolean) => void;
  setShowKeyboardShortcuts: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setShowSettingsModal?: (show: boolean) => void;
  isSaving: boolean;
  currentTime: number;
  duration: number;
  formatTime: (time: number) => string;
  viewMode: 'editor' | 'preview';
  setViewMode: (mode: 'editor' | 'preview') => void;
  workspaceMode?: boolean;
  setWorkspaceMode?: (mode: boolean) => void;
  isAutosaving?: boolean;
  lastAutosaveTime?: Date | null;
}

export default function TopBar({
  onBackToDashboard,
  handleNewProject,
  handleSaveProject,
  setShowProjectsModal,
  setShowKeyboardShortcuts,
  setShowExportModal,
  setShowSettingsModal,
  isSaving,
  currentTime,
  duration,
  formatTime,
  viewMode,
  setViewMode,
  workspaceMode = false,
  setWorkspaceMode,
  isAutosaving = false,
  lastAutosaveTime = null
}: TopBarProps) {
  const [showAppMenu, setShowAppMenu] = useState(false);
  const appMenuRef = useRef<HTMLDivElement>(null);

  // Close app menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (appMenuRef.current && !appMenuRef.current.contains(e.target as Node)) {
        setShowAppMenu(false);
      }
    };

    if (showAppMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAppMenu]);

  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      {/* Left: Branding and Navigation */}
      <div className="flex items-center gap-3">
        {/* Canvas Visualizer Dropdown */}
        <div className="relative" ref={appMenuRef}>
          <button
            onClick={() => setShowAppMenu(!showAppMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-800 transition-colors"
          >
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Canvas Visualizer
            </h1>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showAppMenu && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 py-2 z-50">
              {/* Back to Dashboard */}
              {onBackToDashboard && (
                <>
                  <button
                    onClick={() => {
                      onBackToDashboard();
                      setShowAppMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3"
                  >
                    <Home size={16} />
                    <span>Back to Dashboard</span>
                  </button>
                  <div className="h-px bg-gray-700 my-2" />
                </>
              )}

              {/* File Controls */}
              <button
                onClick={() => {
                  handleNewProject();
                  setShowAppMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3"
              >
                <FilePlus size={16} />
                <span>New Project</span>
                <span className="ml-auto text-xs text-gray-500">Ctrl+N</span>
              </button>

              <button
                onClick={() => {
                  setShowProjectsModal(true);
                  setShowAppMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3"
              >
                <FolderOpen size={16} />
                <span>Open Project</span>
                <span className="ml-auto text-xs text-gray-500">Ctrl+O</span>
              </button>

              <button
                onClick={() => {
                  handleSaveProject();
                  setShowAppMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3"
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Project'}</span>
                <span className="ml-auto text-xs text-gray-500">Ctrl+S</span>
              </button>
            </div>
          )}
        </div>

        <span className="text-xs text-gray-500 border-l border-gray-700 pl-3">
          Audio-Reactive 3D Editor
        </span>
      </div>

      {/* Center: File Menu and Time Display */}
      <div className="flex items-center gap-4">
        {/* Editor/Preview/Workspace Mode Toggle */}
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => {
              setViewMode('editor');
              if (setWorkspaceMode) setWorkspaceMode(false);
            }}
            aria-label="Switch to Editor mode"
            aria-pressed={viewMode === 'editor' && !workspaceMode}
            className={`px-4 py-1.5 text-sm font-medium rounded-l-lg border transition-colors ${
              viewMode === 'editor' && !workspaceMode
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
            title="Editor mode - Show all panels and timeline"
          >
            📝 Editor
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            aria-label="Switch to Preview mode"
            aria-pressed={viewMode === 'preview'}
            className={`px-4 py-1.5 text-sm font-medium border-t border-b transition-colors ${
              viewMode === 'preview'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
            title="Preview mode - Show canvas only"
          >
            ▶️ Preview
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('editor');
              if (setWorkspaceMode) setWorkspaceMode(true);
            }}
            aria-label="Switch to Workspace mode"
            aria-pressed={workspaceMode}
            className={`px-4 py-1.5 text-sm font-medium rounded-r-lg border-t border-r border-b transition-colors ${
              workspaceMode
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
            title="Workspace mode - Manual 3D object editing"
          >
            🔨 Workspace
          </button>
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
        {/* Autosave Indicator */}
        {(isAutosaving || lastAutosaveTime) && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm">
            {isAutosaving ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-gray-300">Autosaving...</span>
              </>
            ) : lastAutosaveTime ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-400 text-xs">
                  Saved {new Date().getTime() - lastAutosaveTime.getTime() < 60000 
                    ? 'just now' 
                    : `${Math.floor((new Date().getTime() - lastAutosaveTime.getTime()) / 60000)}m ago`}
                </span>
              </>
            ) : null}
          </div>
        )}

        {/* Settings Button */}
        {setShowSettingsModal && (
          <button
            onClick={() => setShowSettingsModal(true)}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        )}

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
