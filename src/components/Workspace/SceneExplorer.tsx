import React from 'react';
import { Camera, Lightbulb, Box, Circle, Square } from 'lucide-react';
import type { WorkspaceObject } from '../../types';

interface SceneExplorerProps {
  objects: WorkspaceObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onDeleteObject: (id: string) => void;
}

/**
 * FINAL ARCHITECTURE: Scene Explorer/Outliner
 * Blender-like object hierarchy showing all scene objects
 * Click object to select and show properties in right panel
 */
export const SceneExplorer: React.FC<SceneExplorerProps> = ({
  objects,
  selectedObjectId,
  onSelectObject,
  onDeleteObject,
}) => {
  const getObjectIcon = (type: string) => {
    switch (type) {
      case 'camera':
        return <Camera className="w-4 h-4" />;
      case 'light':
        return <Lightbulb className="w-4 h-4" />;
      case 'sphere':
        return <Circle className="w-4 h-4" />;
      case 'box':
        return <Square className="w-4 h-4" />;
      case 'plane':
        return <Box className="w-4 h-4" />;
      case 'torus':
        return <Circle className="w-4 h-4" />;
      default:
        return <Box className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Scene Explorer
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>No objects in scene</p>
            <p className="mt-2 text-xs">Create objects in workspace mode (W key)</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {objects.map((obj) => (
              <div
                key={obj.id}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded cursor-pointer
                  transition-colors
                  ${
                    selectedObjectId === obj.id
                      ? 'bg-purple-600 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                  }
                `}
                onClick={() => onSelectObject(obj.id)}
              >
                <span className="flex-shrink-0">{getObjectIcon(obj.type)}</span>
                <span className="flex-1 text-sm font-medium truncate">{obj.name}</span>
                {!obj.visible && (
                  <span className="text-xs opacity-50">(hidden)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 text-xs text-gray-500">
        {objects.length} object{objects.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
