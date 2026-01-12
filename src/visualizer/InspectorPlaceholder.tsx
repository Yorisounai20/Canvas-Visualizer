import { Info, Move, RotateCw, Maximize, Eye } from 'lucide-react';

export default function InspectorPlaceholder() {
  return (
    <div className="space-y-6">
      {/* Selection Info */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Info size={14} />
            Selection
          </h4>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <p className="text-sm text-gray-400 text-center py-4">
            Select an object in the canvas to inspect and edit its properties
          </p>
        </div>
      </div>

      {/* Transform Properties */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Move size={14} />
          Transform
        </h4>
        
        {/* Position */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-2 block">Position</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <input 
                type="number" 
                placeholder="X" 
                className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                disabled
              />
            </div>
            <div>
              <input 
                type="number" 
                placeholder="Y" 
                className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                disabled
              />
            </div>
            <div>
              <input 
                type="number" 
                placeholder="Z" 
                className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-2 block flex items-center gap-1">
            <RotateCw size={12} />
            Rotation
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="X°" className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600" disabled />
            <input type="number" placeholder="Y°" className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600" disabled />
            <input type="number" placeholder="Z°" className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600" disabled />
          </div>
        </div>

        {/* Scale */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block flex items-center gap-1">
            <Maximize size={12} />
            Scale
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="X" className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600" disabled />
            <input type="number" placeholder="Y" className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600" disabled />
            <input type="number" placeholder="Z" className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600" disabled />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Eye size={14} />
          Appearance
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Visible</span>
            <button className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-400" disabled>
              <Eye size={14} />
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Opacity</label>
            <input type="range" min="0" max="100" className="w-full" disabled />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Color</label>
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded border border-gray-700 bg-purple-500/20"></div>
              <input type="text" value="#A855F7" className="flex-1 px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 font-mono" disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
