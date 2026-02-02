import React from 'react';
import { Box, Circle, Square, Torus, Grid3x3 } from 'lucide-react';
import { SceneExplorer } from './SceneExplorer';
import { WorkspaceObject } from '../../types';

/**
 * Scene Panel - Object Hierarchy and Creation
 * Part of the multi-panel workspace layout
 */

interface ScenePanelProps {
  workspaceObjects: WorkspaceObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onDeleteObject: (id: string) => void;
  onCreateObject: (type: 'sphere' | 'box' | 'plane' | 'torus' | 'instances') => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showAxes: boolean;
  onToggleAxes: () => void;
  useWorkspaceObjects: boolean;
  onToggleVisualizationSource: () => void;
}

export default function ScenePanel({
  workspaceObjects,
  selectedObjectId,
  onSelectObject,
  onDeleteObject,
  onCreateObject,
  showGrid,
  onToggleGrid,
  showAxes,
  onToggleAxes,
  useWorkspaceObjects,
  onToggleVisualizationSource
}: ScenePanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Object Creation Toolbar */}
      <div className="p-3 border-b border-gray-800 bg-gray-900">
        <div className="text-xs font-semibold text-gray-400 mb-2">Create Objects</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onCreateObject('sphere')}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
            title="Add Sphere"
          >
            <Circle size={14} />
            <span>Sphere</span>
          </button>
          <button
            onClick={() => onCreateObject('box')}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
            title="Add Box"
          >
            <Box size={14} />
            <span>Box</span>
          </button>
          <button
            onClick={() => onCreateObject('plane')}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
            title="Add Plane"
          >
            <Square size={14} />
            <span>Plane</span>
          </button>
          <button
            onClick={() => onCreateObject('torus')}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
            title="Add Torus"
          >
            <Torus size={14} />
            <span>Torus</span>
          </button>
        </div>

        {/* Scene Options */}
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={onToggleGrid}
              className="w-4 h-4 rounded"
            />
            <Grid3x3 size={14} />
            <span>Show Grid</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
            <input
              type="checkbox"
              checked={showAxes}
              onChange={onToggleAxes}
              className="w-4 h-4 rounded"
            />
            <span>Show Axes</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
            <input
              type="checkbox"
              checked={useWorkspaceObjects}
              onChange={onToggleVisualizationSource}
              className="w-4 h-4 rounded"
            />
            <span>Use Workspace Objects</span>
          </label>
        </div>
      </div>

      {/* Scene Explorer - Object Hierarchy */}
      <div className="flex-1 overflow-y-auto">
        <SceneExplorer
          objects={workspaceObjects}
          selectedObjectId={selectedObjectId}
          onSelectObject={onSelectObject}
          onDeleteObject={onDeleteObject}
        />
      </div>

      {/* Object Count Footer */}
      <div className="p-2 border-t border-gray-800 bg-gray-850">
        <div className="text-xs text-gray-500 text-center">
          {workspaceObjects.length} {workspaceObjects.length === 1 ? 'object' : 'objects'} in scene
        </div>
      </div>
    </div>
  );
}
