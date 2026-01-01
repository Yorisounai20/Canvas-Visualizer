import React from 'react';
import { WorkspaceObject } from '../../types';
import { Trash2, Eye, EyeOff } from 'lucide-react';

/**
 * PHASE 3: Object Properties Panel
 * Live parameter editing for selected workspace objects with real-time preview
 */

interface ObjectPropertiesPanelProps {
  selectedObject: WorkspaceObject | null;
  onUpdateObject: (id: string, updates: Partial<WorkspaceObject>) => void;
  onDeleteObject: (id: string) => void;
}

export default function ObjectPropertiesPanel({
  selectedObject,
  onUpdateObject,
  onDeleteObject
}: ObjectPropertiesPanelProps) {
  if (!selectedObject) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        Select an object to edit its properties
      </div>
    );
  }

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    onUpdateObject(selectedObject.id, {
      position: { ...selectedObject.position, [axis]: value }
    });
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    onUpdateObject(selectedObject.id, {
      rotation: { ...selectedObject.rotation, [axis]: value }
    });
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: number) => {
    onUpdateObject(selectedObject.id, {
      scale: { ...selectedObject.scale, [axis]: value }
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Object header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-700">
        <div>
          <div className="font-semibold text-white">{selectedObject.name}</div>
          <div className="text-xs text-gray-400">{selectedObject.type}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdateObject(selectedObject.id, { visible: !selectedObject.visible })}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            title={selectedObject.visible ? "Hide" : "Show"}
          >
            {selectedObject.visible ? (
              <Eye className="w-4 h-4 text-cyan-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => onDeleteObject(selectedObject.id)}
            className="p-2 bg-red-600 hover:bg-red-500 rounded transition-colors"
            title="Delete Object"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Position */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-2">Position</div>
        <div className="space-y-2">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis} className="flex items-center gap-2">
              <label className="text-xs text-gray-400 w-6 uppercase">{axis}</label>
              <input
                type="range"
                min="-20"
                max="20"
                step="0.1"
                value={selectedObject.position[axis]}
                onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                value={selectedObject.position[axis].toFixed(1)}
                onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-gray-700 rounded text-xs text-white"
                step="0.1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rotation */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-2">Rotation (degrees)</div>
        <div className="space-y-2">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis} className="flex items-center gap-2">
              <label className="text-xs text-gray-400 w-6 uppercase">{axis}</label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={selectedObject.rotation[axis]}
                onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                value={selectedObject.rotation[axis].toFixed(0)}
                onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-gray-700 rounded text-xs text-white"
                step="1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-2">Scale</div>
        <div className="space-y-2">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis} className="flex items-center gap-2">
              <label className="text-xs text-gray-400 w-6 uppercase">{axis}</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={selectedObject.scale[axis]}
                onChange={(e) => handleScaleChange(axis, parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                value={selectedObject.scale[axis].toFixed(1)}
                onChange={(e) => handleScaleChange(axis, parseFloat(e.target.value) || 0.1)}
                className="w-16 px-2 py-1 bg-gray-700 rounded text-xs text-white"
                step="0.1"
                min="0.1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-2">Color</div>
        <input
          type="color"
          value={selectedObject.color}
          onChange={(e) => onUpdateObject(selectedObject.id, { color: e.target.value })}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>

      {/* Wireframe toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">Wireframe</span>
        <input
          type="checkbox"
          checked={selectedObject.wireframe}
          onChange={(e) => onUpdateObject(selectedObject.id, { wireframe: e.target.checked })}
          className="w-4 h-4"
        />
      </div>
    </div>
  );
}
