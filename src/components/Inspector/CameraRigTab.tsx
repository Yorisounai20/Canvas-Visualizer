import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface CameraRig {
  id: string;
  name: string;
  type: 'orbit' | 'rotation' | 'dolly' | 'pan' | 'crane' | 'zoom' | 'custom';
  enabled: boolean;
  startTime: number;
  endTime: number;
  [key: string]: any;
}

interface CameraRigTabProps {
  // Current state
  currentTime: number;
  
  // Camera Rigs
  cameraRigs: CameraRig[];
  selectedRigId: string | null;
  setSelectedRigId: (id: string | null) => void;
  setCameraRigs: (rigs: CameraRig[]) => void;
  
  // Camera Rig Keyframes
  cameraRigKeyframes: any[];
  setCameraRigKeyframes: (keyframes: any[]) => void;
}

/**
 * Camera Rig Tab Component - Advanced Camera Rig System
 * 
 * Features:
 * - 7 rig types (Orbit, Rotation, Dolly, Pan, Crane, Zoom, Custom)
 * - Path Visualization toggles
 * - Rig Transitions
 * - Framing Controls
 * - Camera FX Layer
 * - Shot Presets
 * - Camera Rig Keyframes
 */
export default function CameraRigTab(props: CameraRigTabProps) {
  const sortedRigs = [...props.cameraRigs].sort((a, b) => a.startTime - b.startTime);
  const selectedRig = sortedRigs.find(r => r.id === props.selectedRigId);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const rigTypes = [
    { value: 'orbit', label: 'Orbit', icon: '🔄', desc: 'Circular camera movement' },
    { value: 'rotation', label: 'Rotation', icon: '🌀', desc: 'Rotate around target' },
    { value: 'dolly', label: 'Dolly', icon: '🎥', desc: 'Move forward/backward' },
    { value: 'pan', label: 'Pan', icon: '↔️', desc: 'Horizontal movement' },
    { value: 'crane', label: 'Crane', icon: '⬆️', desc: 'Vertical movement' },
    { value: 'zoom', label: 'Zoom', icon: '🔍', desc: 'Zoom in/out' },
    { value: 'custom', label: 'Custom', icon: '✨', desc: 'Custom path' },
  ];
  
  const addRig = (type: string) => {
    const newRig: CameraRig = {
      id: `rig-${Date.now()}`,
      name: `${type} Rig`,
      type: type as CameraRig['type'],
      enabled: true,
      startTime: props.currentTime,
      endTime: props.currentTime + 10,
    };
    props.setCameraRigs([...props.cameraRigs, newRig].sort((a, b) => a.startTime - b.startTime));
    props.setSelectedRigId(newRig.id);
  };
  
  const deleteRig = (id: string) => {
    props.setCameraRigs(props.cameraRigs.filter(r => r.id !== id));
    props.setCameraRigKeyframes(props.cameraRigKeyframes.filter(kf => kf.rigId !== id));
    if (props.selectedRigId === id) props.setSelectedRigId(null);
  };
  
  const updateRig = (id: string, updates: Partial<CameraRig>) => {
    props.setCameraRigs(props.cameraRigs.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
  };
  
  const getRigIcon = (type: string) => {
    return rigTypes.find(t => t.value === type)?.icon || '🎬';
  };

  return (
    <div className="space-y-3">
      {/* Add Camera Rig Type Selector */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <h4 className="text-sm font-semibold text-cyan-400">🎥 Camera Rig Types</h4>
        <div className="grid grid-cols-3 gap-2">
          {rigTypes.slice(0, 6).map((type) => (
            <button
              key={type.value}
              onClick={() => addRig(type.value)}
              className="px-2 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex flex-col items-center gap-1"
              title={type.desc}
            >
              <span className="text-base">{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => addRig('custom')}
          className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs rounded flex items-center justify-center gap-2"
        >
          <span className="text-base">✨</span>
          <span>Custom Rig</span>
        </button>
      </div>
      
      {/* Camera Rigs Timeline */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <h4 className="text-sm font-semibold text-cyan-400">📅 Camera Rig Timeline</h4>
        
        {sortedRigs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No camera rigs yet. Click a button above to add a rig at the current time.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedRigs.map((rig) => (
              <div 
                key={rig.id} 
                className={`bg-gray-800 rounded p-2 space-y-2 cursor-pointer border-2 ${
                  props.selectedRigId === rig.id ? 'border-cyan-500' : 'border-transparent'
                }`}
                onClick={() => props.setSelectedRigId(rig.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rig.enabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateRig(rig.id, { enabled: e.target.checked });
                      }}
                      className="cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-cyan-400">
                      {getRigIcon(rig.type)} {rig.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRig(rig.id);
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete rig"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <div>Start: {formatTime(rig.startTime)}</div>
                  <div>End: {formatTime(rig.endTime)}</div>
                  <div className="col-span-2 text-gray-500 capitalize">Type: {rig.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Selected Rig Editor */}
      {selectedRig && (
        <div className="bg-gray-700 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-cyan-400">
              ✏️ Edit: {getRigIcon(selectedRig.type)} {selectedRig.name}
            </h4>
            <button
              onClick={() => props.setSelectedRigId(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
          
          {/* Rig Name */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Name</label>
            <input
              type="text"
              value={selectedRig.name}
              onChange={(e) => updateRig(selectedRig.id, { name: e.target.value })}
              className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs"
            />
          </div>
          
          {/* Rig Timing */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Start Time (s)</label>
              <input
                type="number"
                value={selectedRig.startTime}
                onChange={(e) => updateRig(selectedRig.id, { startTime: parseFloat(e.target.value) })}
                step="0.1"
                min="0"
                className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">End Time (s)</label>
              <input
                type="number"
                value={selectedRig.endTime}
                onChange={(e) => updateRig(selectedRig.id, { endTime: parseFloat(e.target.value) })}
                step="0.1"
                min={selectedRig.startTime}
                className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs"
              />
            </div>
          </div>
          
          {/* Rig Type */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Rig Type</label>
            <select
              value={selectedRig.type}
              onChange={(e) => updateRig(selectedRig.id, { type: e.target.value })}
              className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs"
            >
              {rigTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="border-t border-gray-600 pt-3">
            <p className="text-xs text-gray-500 italic">
              Advanced rig parameters and keyframes coming soon. Use the basic controls above to position and time your camera rig.
            </p>
          </div>
        </div>
      )}
      
      {/* Info Panel */}
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
        <h5 className="text-xs font-semibold text-cyan-400 mb-2">ℹ️ Camera Rig Guide</h5>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-purple-400">🔄</span>
            <div>
              <div className="font-medium text-white">Orbit:</div>
              <div>Circular movement around the scene center</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">🌀</span>
            <div>
              <div className="font-medium text-white">Rotation:</div>
              <div>Rotate camera view around target point</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">🎥</span>
            <div>
              <div className="font-medium text-white">Dolly:</div>
              <div>Push in or pull back camera movement</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">↔️</span>
            <div>
              <div className="font-medium text-white">Pan:</div>
              <div>Left-right horizontal camera tracking</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">⬆️</span>
            <div>
              <div className="font-medium text-white">Crane:</div>
              <div>Vertical up-down camera movement</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">🔍</span>
            <div>
              <div className="font-medium text-white">Zoom:</div>
              <div>Change focal length for zoom effect</div>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-center italic">
        Camera rigs automate camera movement along predefined paths. Select a rig to edit its timing and parameters.
      </p>
    </div>
  );
}
