import { Clock, ZoomIn, ZoomOut, Grid, Lock, Scissors, Copy } from 'lucide-react';

export default function TimelinePlaceholder() {
  return (
    <div className="space-y-3">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Clock size={14} />
            Timeline
          </h4>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" title="Zoom In">
              <ZoomIn size={14} />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" title="Zoom Out">
              <ZoomOut size={14} />
            </button>
            <div className="w-px h-4 bg-gray-700 mx-1"></div>
            <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" title="Snap to Grid">
              <Grid size={14} />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" title="Lock Tracks">
              <Lock size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            <Scissors size={12} />
            Split
          </button>
          <button className="px-2 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            <Copy size={12} />
            Duplicate
          </button>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative h-24 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        {/* Time markers */}
        <div className="absolute top-0 left-0 right-0 h-6 border-b border-gray-800 bg-gray-950/50">
          <div className="flex justify-between px-2 text-xs text-gray-500 pt-1">
            <span>0:00</span>
            <span>0:15</span>
            <span>0:30</span>
            <span>0:45</span>
            <span>1:00</span>
          </div>
        </div>

        {/* Track lanes */}
        <div className="absolute top-6 left-0 right-0 bottom-0 flex flex-col">
          <div className="flex-1 border-b border-gray-800/50 flex items-center px-2">
            <span className="text-xs text-gray-600">Animation Track</span>
          </div>
          <div className="flex-1 border-b border-gray-800/50 flex items-center px-2">
            <span className="text-xs text-gray-600">Camera Track</span>
          </div>
          <div className="flex-1 flex items-center px-2">
            <span className="text-xs text-gray-600">Effects Track</span>
          </div>
        </div>

        {/* Playhead */}
        <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-purple-500 shadow-lg shadow-purple-500/50">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full"></div>
        </div>
      </div>

      {/* Timeline Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-500">
          Add keyframes and animation sequences to create dynamic visuals
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Duration: <span className="text-gray-400">1:00.000</span></span>
          <span className="text-gray-600">FPS: <span className="text-gray-400">60</span></span>
        </div>
      </div>
    </div>
  );
}
