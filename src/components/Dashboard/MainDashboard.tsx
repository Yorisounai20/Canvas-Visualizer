import React from 'react';
import { Sparkles, Zap, Play } from 'lucide-react';

interface MainDashboardProps {
  onSelectMode: () => void;
}

/**
 * Main Dashboard Component
 * Streamlined interface for quick mode selection
 */
export default function MainDashboard({ onSelectMode }: MainDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Compact Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Canvas Visualizer
          </h1>
          <p className="text-lg text-gray-300 mb-2">
            3D Music Video Creator
          </p>
          <p className="text-sm text-gray-400">
            Select a mode to start creating audio-reactive visuals
          </p>
        </div>

        {/* Streamlined Mode Selection */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Editor Mode - Archived Notice (Not Clickable) */}
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-600 text-left opacity-60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-400">Editor Mode</h2>
                <p className="text-sm text-gray-500">Archived</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              After Effects-style interface has been archived. Use Software Mode for all visualization needs.
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <span>📦 Archived</span>
            </div>
          </div>

          {/* Software Mode - Primary Card (Clickable) */}
          <button
            onClick={onSelectMode}
            className="group bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border-2 border-cyan-500 hover:border-cyan-400 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/30 text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Software Mode</h2>
                <p className="text-sm text-cyan-300">Primary Mode</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-3">
              Streamlined interface with direct controls, instant preview, and easy-to-use tools for fast visualizations
            </p>
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
              <Play className="w-4 h-4" />
              <span>Launch Software</span>
            </div>
          </button>
        </div>

        {/* Quick Info */}
        <div className="bg-gray-800 bg-opacity-30 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-gray-400 mb-1">Animation Presets</p>
              <p className="text-white font-semibold">25+ Presets</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Export Quality</p>
              <p className="text-white font-semibold">Up to 4K</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Supported Formats</p>
              <p className="text-white font-semibold">MP3, WAV, OGG</p>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Software Mode will be remembered for next time. Editor Mode has been archived.
          </p>
        </div>
      </div>
    </div>
  );
}
