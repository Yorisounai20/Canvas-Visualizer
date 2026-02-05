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
  // Camera settings from main editor (for camera objects)
  cameraDistance?: number;
  cameraHeight?: number;
  cameraRotation?: number;
  onSetCameraDistance?: (value: number) => void;
  onSetCameraHeight?: (value: number) => void;
  onSetCameraRotation?: (value: number) => void;
  // Letterbox settings (for camera objects)
  showLetterbox?: boolean;
  letterboxSize?: number;
  onSetShowLetterbox?: (value: boolean) => void;
  onSetLetterboxSize?: (value: number) => void;
}

export default function ObjectPropertiesPanel({
  selectedObject,
  onUpdateObject,
  onDeleteObject,
  cameraDistance,
  cameraHeight,
  cameraRotation,
  onSetCameraDistance,
  onSetCameraHeight,
  onSetCameraRotation,
  showLetterbox,
  letterboxSize,
  onSetShowLetterbox,
  onSetLetterboxSize
}: ObjectPropertiesPanelProps) {
  if (!selectedObject) {
    return (
      <div className="h-full flex flex-col bg-gray-900">
        <div className="p-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Properties
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 text-gray-400 text-sm">
          Select an object to edit its properties
        </div>
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
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Properties
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      {/* PR 2: Object Grouping - Group and Role */}
      <div className="bg-gray-800 rounded p-3 space-y-3">
        <div className="text-sm font-semibold text-gray-300 mb-2">
          Grouping (for Presets)
        </div>
        
        {/* Group */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Group</label>
          <input
            type="text"
            value={selectedObject.group || ''}
            onChange={(e) => onUpdateObject(selectedObject.id, { group: e.target.value || undefined })}
            placeholder="e.g., head, body, fins"
            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Logical group for preset targeting
          </p>
        </div>
        
        {/* Role */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Role</label>
          <input
            type="text"
            value={selectedObject.role || ''}
            onChange={(e) => onUpdateObject(selectedObject.id, { role: e.target.value || undefined })}
            placeholder="e.g., fin_left, antenna_1"
            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Specific role within group
          </p>
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

      {/* Material Properties */}
      <div className="pt-4 border-t border-gray-700 space-y-3">
        <div className="text-sm font-semibold text-gray-300 mb-2">Material</div>
        
        {/* Material Type */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Type</label>
          <select
            value={selectedObject.materialType || 'basic'}
            onChange={(e) => onUpdateObject(selectedObject.id, { materialType: e.target.value as any })}
            className="w-full px-2 py-1 bg-gray-700 rounded text-xs text-white"
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard (PBR)</option>
            <option value="phong">Phong</option>
            <option value="lambert">Lambert</option>
          </select>
        </div>

        {/* Opacity */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Opacity: {(selectedObject.opacity !== undefined ? selectedObject.opacity : 1).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={selectedObject.opacity !== undefined ? selectedObject.opacity : 1}
            onChange={(e) => onUpdateObject(selectedObject.id, { opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Metalness (for standard materials only) */}
        {(selectedObject.materialType === 'standard' || !selectedObject.materialType) && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Metalness: {(selectedObject.metalness !== undefined ? selectedObject.metalness : 0.5).toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedObject.metalness !== undefined ? selectedObject.metalness : 0.5}
              onChange={(e) => onUpdateObject(selectedObject.id, { metalness: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        )}

        {/* Roughness (for standard materials) */}
        {(selectedObject.materialType === 'standard' || !selectedObject.materialType) && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Roughness: {(selectedObject.roughness !== undefined ? selectedObject.roughness : 0.5).toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedObject.roughness !== undefined ? selectedObject.roughness : 0.5}
              onChange={(e) => onUpdateObject(selectedObject.id, { roughness: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Camera-specific settings (only for camera objects) */}
      {selectedObject.type === 'camera' && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-sm font-semibold text-gray-300 mb-3">Camera Settings</div>
          
          {cameraDistance !== undefined && onSetCameraDistance && (
            <div className="mb-3">
              <label className="text-xs text-gray-400 block mb-1">
                Distance: {cameraDistance.toFixed(1)}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="0.5"
                value={cameraDistance}
                onChange={(e) => onSetCameraDistance(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
              />
            </div>
          )}

          {cameraHeight !== undefined && onSetCameraHeight && (
            <div className="mb-3">
              <label className="text-xs text-gray-400 block mb-1">
                Height: {cameraHeight.toFixed(1)}
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={cameraHeight}
                onChange={(e) => onSetCameraHeight(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
              />
            </div>
          )}

          {cameraRotation !== undefined && onSetCameraRotation && (
            <div className="mb-3">
              <label className="text-xs text-gray-400 block mb-1">
                Rotation: {(cameraRotation * 180 / Math.PI).toFixed(0)}°
              </label>
              <input
                type="range"
                min="0"
                max={Math.PI * 2}
                step="0.05"
                value={cameraRotation}
                onChange={(e) => onSetCameraRotation(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
              />
            </div>
          )}

          {/* Letterbox Controls */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-xs font-semibold text-gray-300 mb-3">Letterbox (Curtain Effect)</div>
            
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="cameraLetterbox"
                checked={showLetterbox || false}
                onChange={(e) => onSetShowLetterbox?.(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="cameraLetterbox" className="text-sm text-white cursor-pointer">
                Show Letterbox
              </label>
            </div>

            {showLetterbox && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Size: {letterboxSize || 0}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={letterboxSize || 0}
                  onChange={(e) => onSetLetterboxSize?.(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Animatable curtain effect - opens/closes like cinema letterbox
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>{/* End scrollable content */}
    </div>
  );
}
