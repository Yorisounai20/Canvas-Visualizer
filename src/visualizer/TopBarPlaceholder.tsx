import { Play, Pause, SkipBack, SkipForward, Video, Save, FolderOpen, Settings } from 'lucide-react';

export default function TopBarPlaceholder() {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Canvas Visualizer
        </h1>
        <span className="text-xs text-gray-500 border-l border-gray-700 pl-3">
          Audio-Reactive 3D Editor
        </span>
      </div>

      {/* Center: Transport Controls */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" title="Skip Back">
          <SkipBack size={18} />
        </button>
        <button className="p-2 rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors" title="Play/Pause">
          <Play size={18} />
        </button>
        <button className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" title="Skip Forward">
          <SkipForward size={18} />
        </button>
        <div className="ml-4 px-3 py-1 rounded bg-gray-800 border border-gray-700">
          <span className="text-sm font-mono text-cyan-400">00:00.000</span>
          <span className="text-xs text-gray-500 mx-1">/</span>
          <span className="text-sm font-mono text-gray-400">00:00.000</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex items-center gap-2" title="Open Project">
          <FolderOpen size={16} />
          <span className="text-sm">Open</span>
        </button>
        <button className="px-3 py-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex items-center gap-2" title="Save Project">
          <Save size={16} />
          <span className="text-sm">Save</span>
        </button>
        <button className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-2" title="Export Video">
          <Video size={16} />
          <span className="text-sm font-semibold">Export</span>
        </button>
        <button className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
