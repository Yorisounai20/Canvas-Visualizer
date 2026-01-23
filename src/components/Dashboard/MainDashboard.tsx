import React from 'react';
import { Zap, Play, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MainDashboardProps {
  onSelectMode: () => void;
}

/**
 * Main Dashboard Component
 * Streamlined interface for quick mode selection
 */
export default function MainDashboard({ onSelectMode }: MainDashboardProps) {
  const navigate = useNavigate();
  
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
            Start creating audio-reactive visuals
          </p>
        </div>

        {/* Main Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          {/* Launch Button */}
          <button
            onClick={onSelectMode}
            className="group bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-8 border-2 border-cyan-500 hover:border-cyan-400 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/30 text-center flex-1 max-w-md"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Canvas Visualizer</h2>
                <p className="text-sm text-gray-300 mb-4">
                  Create stunning audio-reactive 3D visualizations with direct controls and instant preview
                </p>
              </div>
              <div className="flex items-center gap-2 text-cyan-400 text-base font-medium">
                <Play className="w-5 h-5" />
                <span>Launch Canvas</span>
              </div>
            </div>
          </button>
          
          {/* Projects Button */}
          <button
            onClick={() => navigate('/projects')}
            className="group bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-8 border-2 border-purple-500 hover:border-purple-400 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30 text-center flex-1 max-w-md"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">My Projects</h2>
                <p className="text-sm text-gray-300 mb-4">
                  Browse and manage your saved audio visualization projects
                </p>
              </div>
              <div className="flex items-center gap-2 text-purple-400 text-base font-medium">
                <FolderOpen className="w-5 h-5" />
                <span>View Projects</span>
              </div>
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
            Your session will be remembered for next time
          </p>
        </div>
      </div>
    </div>
  );
}
