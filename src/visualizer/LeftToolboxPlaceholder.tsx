import { Wand2, Box, Palette, Camera, Sparkles, Layers } from 'lucide-react';

export default function LeftToolboxPlaceholder() {
  return (
    <div className="space-y-6">
      {/* Animation Presets Section */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Wand2 size={14} />
          Animation Presets
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 rounded-lg bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 text-sm font-medium transition-all hover:shadow-lg hover:shadow-purple-500/20">
            Orbital
          </button>
          <button className="px-3 py-2 rounded-lg bg-gradient-to-br from-cyan-600/20 to-cyan-600/5 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 text-sm font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/20">
            Explosion
          </button>
          <button className="px-3 py-2 rounded-lg bg-gradient-to-br from-green-600/20 to-green-600/5 border border-green-500/30 hover:border-green-500/50 text-green-300 text-sm font-medium transition-all hover:shadow-lg hover:shadow-green-500/20">
            Tunnel
          </button>
          <button className="px-3 py-2 rounded-lg bg-gradient-to-br from-pink-600/20 to-pink-600/5 border border-pink-500/30 hover:border-pink-500/50 text-pink-300 text-sm font-medium transition-all hover:shadow-lg hover:shadow-pink-500/20">
            Wave
          </button>
        </div>
        <button className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 text-sm transition-colors">
          + Browse All (25 presets)
        </button>
      </div>

      {/* Shapes & Objects */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Box size={14} />
          Shapes & Objects
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 rounded hover:bg-gray-800/50 cursor-pointer">
            <span className="text-gray-300">Cubes</span>
            <span className="text-xs text-gray-500">100</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded hover:bg-gray-800/50 cursor-pointer">
            <span className="text-gray-300">Octahedrons</span>
            <span className="text-xs text-gray-500">115</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded hover:bg-gray-800/50 cursor-pointer">
            <span className="text-gray-300">Tetrahedrons</span>
            <span className="text-xs text-gray-500">100</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles size={14} />
          Quick Actions
        </h4>
        <div className="space-y-2">
          <button className="w-full px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-600 text-gray-300 text-sm text-left transition-colors flex items-center gap-2">
            <Palette size={14} />
            Color Palette
          </button>
          <button className="w-full px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-600 text-gray-300 text-sm text-left transition-colors flex items-center gap-2">
            <Camera size={14} />
            Camera Presets
          </button>
          <button className="w-full px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-600 text-gray-300 text-sm text-left transition-colors flex items-center gap-2">
            <Layers size={14} />
            Environment
          </button>
        </div>
      </div>
    </div>
  );
}
