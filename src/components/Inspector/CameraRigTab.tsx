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
  
  // Issue #5: Advanced Camera Rig Controls
  // Path Visualization
  showPaths?: boolean;
  setShowPaths?: (show: boolean) => void;
  showKeyframeMarkers?: boolean;
  setShowKeyframeMarkers?: (show: boolean) => void;
  
  // Rig Transitions
  enableSmoothTransitions?: boolean;
  setEnableSmoothTransitions?: (enable: boolean) => void;
  rigTransitionDuration?: number;
  setRigTransitionDuration?: (duration: number) => void;
  rigTransitionEasing?: string;
  setRigTransitionEasing?: (easing: string) => void;
  
  // Framing Controls
  lookAtOffsetX?: number;
  setLookAtOffsetX?: (offset: number) => void;
  lookAtOffsetY?: number;
  setLookAtOffsetY?: (offset: number) => void;
  enableFramingLock?: boolean;
  setEnableFramingLock?: (enable: boolean) => void;
  ruleOfThirdsBias?: number;
  setRuleOfThirdsBias?: (bias: number) => void;
  
  // Camera FX Layer
  shakeIntensity?: number;
  setShakeIntensity?: (intensity: number) => void;
  shakeFrequency?: number;
  setShakeFrequency?: (frequency: number) => void;
  handheldDriftIntensity?: number;
  setHandheldDriftIntensity?: (intensity: number) => void;
  fovRamping?: boolean;
  setFovRamping?: (enable: boolean) => void;
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
      <p className="text-xs text-gray-500 text-center italic">
        Camera rigs automate camera movement along predefined paths. Advanced controls provide professional cinematic tools.
      </p>
      
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
              onChange={(e) => updateRig(selectedRig.id, { type: e.target.value as CameraRig['type'] })}
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
      
      {/* ISSUE #5: Advanced Camera Rig Controls */}
      {/* Path Visualization */}
      {props.showPaths !== undefined && (
        <div className="bg-gray-700 rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-semibold text-cyan-400">📍 Path Visualization</h4>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-paths"
              checked={props.showPaths}
              onChange={(e) => props.setShowPaths!(e.target.checked)}
              className="cursor-pointer"
            />
            <label htmlFor="show-paths" className="text-xs text-gray-400 cursor-pointer">
              Show Paths
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-keyframe-markers"
              checked={props.showKeyframeMarkers}
              onChange={(e) => props.setShowKeyframeMarkers!(e.target.checked)}
              className="cursor-pointer"
            />
            <label htmlFor="show-keyframe-markers" className="text-xs text-gray-400 cursor-pointer">
              Show Keyframe Markers
            </label>
          </div>
          
          <p className="text-xs text-gray-500 italic">
            Path Colors: Orbit=Cyan, Dolly=Green, Crane=Magenta, Custom=White
          </p>
        </div>
      )}
      
      {/* Rig Transitions */}
      {props.enableSmoothTransitions !== undefined && (
        <div className="bg-gray-700 rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-semibold text-cyan-400">🔄 Rig Transitions</h4>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enable-smooth-transitions"
              checked={props.enableSmoothTransitions}
              onChange={(e) => props.setEnableSmoothTransitions!(e.target.checked)}
              className="cursor-pointer"
            />
            <label htmlFor="enable-smooth-transitions" className="text-xs text-gray-400 cursor-pointer">
              Enable Smooth Transitions
            </label>
          </div>
          
          {props.rigTransitionDuration !== undefined && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Duration: {props.rigTransitionDuration.toFixed(1)}s
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={props.rigTransitionDuration}
                onChange={(e) => props.setRigTransitionDuration!(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          
          {props.rigTransitionEasing !== undefined && (
            <div>
              <label className="text-xs text-gray-400 block mb-2">Easing</label>
              <select
                value={props.rigTransitionEasing}
                onChange={(e) => props.setRigTransitionEasing!(e.target.value)}
                className="w-full px-2 py-1 bg-gray-600 rounded text-white text-xs"
              >
                <option value="linear">Linear</option>
                <option value="easeInOut">Ease In-Out</option>
                <option value="easeIn">Ease In</option>
                <option value="easeOut">Ease Out</option>
              </select>
            </div>
          )}
        </div>
      )}
      
      {/* Framing Controls */}
      {props.lookAtOffsetX !== undefined && (
        <div className="bg-gray-700 rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-semibold text-cyan-400">🎯 Framing Controls</h4>
          
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Look-At Offset X: {props.lookAtOffsetX.toFixed(1)}
            </label>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.1"
              value={props.lookAtOffsetX}
              onChange={(e) => props.setLookAtOffsetX!(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          {props.lookAtOffsetY !== undefined && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Look-At Offset Y: {props.lookAtOffsetY.toFixed(1)}
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={props.lookAtOffsetY}
                onChange={(e) => props.setLookAtOffsetY!(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          
          {props.enableFramingLock !== undefined && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-framing-lock"
                checked={props.enableFramingLock}
                onChange={(e) => props.setEnableFramingLock!(e.target.checked)}
                className="cursor-pointer"
              />
              <label htmlFor="enable-framing-lock" className="text-xs text-gray-400 cursor-pointer">
                Framing Lock (keep subject centered)
              </label>
            </div>
          )}
          
          {props.ruleOfThirdsBias !== undefined && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Rule of Thirds Bias: {(props.ruleOfThirdsBias * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={props.ruleOfThirdsBias}
                onChange={(e) => props.setRuleOfThirdsBias!(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Camera FX Layer */}
      {props.shakeIntensity !== undefined && (
        <div className="bg-gray-700 rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-semibold text-cyan-400">✨ Camera FX Layer</h4>
          
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Shake Intensity: {props.shakeIntensity.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={props.shakeIntensity}
              onChange={(e) => props.setShakeIntensity!(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          {props.shakeFrequency !== undefined && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Shake Frequency: {props.shakeFrequency.toFixed(0)}Hz
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={props.shakeFrequency}
                onChange={(e) => props.setShakeFrequency!(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          
          {props.handheldDriftIntensity !== undefined && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="handheld-drift"
                checked={props.handheldDriftIntensity > 0}
                onChange={(e) => props.setHandheldDriftIntensity!(e.target.checked ? 0.2 : 0)}
                className="cursor-pointer"
              />
              <label htmlFor="handheld-drift" className="text-xs text-gray-400 cursor-pointer">
                Handheld Drift
              </label>
            </div>
          )}
          
          {props.fovRamping !== undefined && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fov-ramping"
                checked={props.fovRamping}
                onChange={(e) => props.setFovRamping!(e.target.checked)}
                className="cursor-pointer"
              />
              <label htmlFor="fov-ramping" className="text-xs text-gray-400 cursor-pointer">
                FOV Ramping (motion blur effect)
              </label>
            </div>
          )}
        </div>
      )}
      
      {/* Shot Presets */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <h4 className="text-sm font-semibold text-cyan-400">📷 Shot Presets</h4>
        <p className="text-xs text-gray-500 italic">Apply cinematic presets to active rigs</p>
        
        <div className="grid grid-cols-2 gap-2">
          <button className="px-2 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded">
            Close-Up
          </button>
          <button className="px-2 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded">
            Wide Shot
          </button>
          <button className="px-2 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded">
            Overhead
          </button>
          <button className="px-2 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded">
            Low Angle
          </button>
          <button className="px-2 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded">
            Dutch Angle
          </button>
          <button className="px-2 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded">
            Tracking
          </button>
        </div>
      </div>
    </div>
  );
}
