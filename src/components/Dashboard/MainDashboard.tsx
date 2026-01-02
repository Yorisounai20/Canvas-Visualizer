import React from 'react';
import { Sparkles, Zap } from 'lucide-react';

interface MainDashboardProps {
  onSelectMode: (mode: 'editor' | 'software') => void;
}

/**
 * Main Dashboard Component
 * Allows users to choose between the Editor (advanced) and Software (simple) modes
 */
export default function MainDashboard({ onSelectMode }: MainDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Canvas Visualizer
          </h1>
          <p className="text-xl text-gray-300">
            Choose your creative workflow
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Editor Mode Card */}
          <div
            onClick={() => onSelectMode('editor')}
            className="group bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-500 hover:border-purple-400 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Editor Mode</h2>
                <p className="text-purple-300">Professional Workflow</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <p className="text-gray-300">After Effects-style interface with layers & timeline</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <p className="text-gray-300">Blender-like workspace mode (W key)</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <p className="text-gray-300">Multiple cameras with keyframe switching</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <p className="text-gray-300">Per-camera letterbox controls (curtain effects)</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <p className="text-gray-300">Advanced property editing & context menus</p>
              </div>
            </div>

            <div className="text-center">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Launch Editor
              </button>
            </div>
          </div>

          {/* Software Mode Card */}
          <div
            onClick={() => onSelectMode('software')}
            className="group bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border-2 border-cyan-500 hover:border-cyan-400 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-cyan-600 rounded-xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Software Mode</h2>
                <p className="text-cyan-300">Quick & Simple</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                <p className="text-gray-300">Simple, streamlined interface</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                <p className="text-gray-300">Direct controls & instant preview</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                <p className="text-gray-300">Animated letterbox with keyframes</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                <p className="text-gray-300">Camera shake events & effects</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                <p className="text-gray-300">Perfect for quick visualizations</p>
              </div>
            </div>

            <div className="text-center">
              <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Launch Software
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            Both modes support 9 animation presets, audio-reactive 3D visuals, and video export
          </p>
        </div>
      </div>
    </div>
  );
}
