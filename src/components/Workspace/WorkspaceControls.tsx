import React from 'react';
import { Plus, Box, Circle, Square, Torus, Grid3x3, Copy, Sparkles, Cuboid } from 'lucide-react';

/**
 * PHASE 3: Workspace Controls Component
 * Provides UI for manual object creation in the 3D workspace
 */

interface WorkspaceControlsProps {
  onCreateObject: (type: 'sphere' | 'box' | 'plane' | 'torus' | 'instances') => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showAxes: boolean;
  onToggleAxes: () => void;
  useWorkspaceObjects: boolean;
  onToggleVisualizationSource: () => void;
}

export default function WorkspaceControls({
  onCreateObject,
  showGrid,
  onToggleGrid,
  showAxes,
  onToggleAxes,
  useWorkspaceObjects,
  onToggleVisualizationSource
}: WorkspaceControlsProps) {
  return (
    <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 space-y-2 z-10">
      <div className="text-xs font-semibold text-gray-300 mb-2">Workspace</div>
      
      {/* Visualization Source Toggle */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Visualization Source</div>
        <button
          onClick={onToggleVisualizationSource}
          className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors flex items-center justify-between ${
            useWorkspaceObjects
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title={useWorkspaceObjects ? "Using Workspace Objects" : "Using Preset Shapes"}
        >
          <span className="flex items-center gap-2">
            {useWorkspaceObjects ? <Cuboid className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {useWorkspaceObjects ? 'Workspace' : 'Presets'}
          </span>
          <span className="text-xs opacity-75">
            {useWorkspaceObjects ? 'Manual' : 'Auto'}
          </span>
        </button>
      </div>
      
      {/* Grid and Axes toggles */}
      <div className="flex gap-2 mb-3 pb-3 border-b border-gray-700">
        <button
          onClick={onToggleGrid}
          className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
            showGrid 
              ? 'bg-cyan-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Toggle Grid"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleAxes}
          className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
            showAxes 
              ? 'bg-cyan-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Toggle Axes Helper"
        >
          XYZ
        </button>
      </div>

      {/* Object creation buttons */}
      <div className="text-xs font-semibold text-gray-400 mb-2">
        <Plus className="w-3 h-3 inline mr-1" />
        Add Object
      </div>
      
      <button
        onClick={() => onCreateObject('sphere')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add Sphere"
      >
        <Circle className="w-4 h-4" />
        Sphere
      </button>

      <button
        onClick={() => onCreateObject('box')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add Box"
      >
        <Box className="w-4 h-4" />
        Box
      </button>

      <button
        onClick={() => onCreateObject('plane')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add Plane"
      >
        <Square className="w-4 h-4" />
        Plane
      </button>

      <button
        onClick={() => onCreateObject('torus')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add Torus"
      >
        <Torus className="w-4 h-4" />
        Torus
      </button>

      <button
        onClick={() => onCreateObject('instances')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add Instanced Mesh"
      >
        <Copy className="w-4 h-4" />
        Instances
      </button>
    </div>
  );
}
