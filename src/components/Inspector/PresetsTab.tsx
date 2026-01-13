import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface PresetKeyframe {
  id: number;
  time: number;
  endTime: number;
  preset: string;
  speed: number;
}

interface SpeedKeyframe {
  id: number;
  time: number;
  speed: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

interface AnimationType {
  value: string;
  label: string;
  icon: string;
}

interface PresetsTabProps {
  // Current state
  currentTime: number;
  duration: number | null;
  
  // Preset Keyframes
  presetKeyframes: PresetKeyframe[];
  handleAddPresetKeyframe: () => void;
  handleDeletePresetKeyframe: (id: number) => void;
  handleUpdatePresetKeyframe: (id: number, field: string, value: any) => void;
  
  // Speed Keyframes
  presetSpeedKeyframes: SpeedKeyframe[];
  handleAddSpeedKeyframe: () => void;
  handleDeleteSpeedKeyframe: (id: number) => void;
  handleUpdateSpeedKeyframe: (id: number, field: 'time' | 'speed' | 'easing', value: number | string) => void;
  
  // Available animation types
  animationTypes: AnimationType[];
  
  // Current preset getter
  getCurrentPreset: () => string;
  getCurrentPresetSpeed: () => number;
}

/**
 * Presets Tab Component - Preset Timeline with Speed Keyframes
 * 
 * Features:
 * - Preset Timeline visualization with segments
 * - Current preset display
 * - Speed Keyframes timeline with gradient visualization
 * - Add/Edit/Delete preset and speed keyframes
 * - Color-coded preset segments
 */
export default function PresetsTab(props: PresetsTabProps) {
  const sortedPresetKeyframes = [...props.presetKeyframes].sort((a, b) => a.time - b.time);
  const sortedSpeedKeyframes = [...props.presetSpeedKeyframes].sort((a, b) => a.time - b.time);
  
  const currentPreset = props.getCurrentPreset();
  const currentSpeed = props.getCurrentPresetSpeed();
  const currentPresetInfo = props.animationTypes.find(t => t.value === currentPreset);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getPresetColor = (preset: string) => {
    const colors: Record<string, string> = {
      orbit: '#3b82f6', // blue
      explosion: '#ef4444', // red
      tunnel: '#8b5cf6', // purple
      wave: '#06b6d4', // cyan
      spiral: '#f59e0b', // amber
      chill: '#10b981', // green
      pulse: '#ec4899', // pink
      vortex: '#6366f1', // indigo
      seiryu: '#0ea5e9', // sky
      cosmic: '#a855f7', // violet
    };
    return colors[preset] || '#6b7280'; // default gray
  };

  return (
    <div className="space-y-3">
      {/* Current Preset Display */}
      <div className="bg-gray-700 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-cyan-400 mb-3">🎬 Current Preset</h4>
        <div className="bg-gray-800 rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Preset:</span>
            <span className="text-sm text-white font-medium">
              {currentPresetInfo?.icon} {currentPresetInfo?.label || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Speed:</span>
            <span className="text-sm text-white font-medium">{currentSpeed.toFixed(2)}x</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Time:</span>
            <span className="text-sm text-white font-medium">{formatTime(props.currentTime)}</span>
          </div>
        </div>
      </div>
      
      {/* Preset Timeline */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-cyan-400">⏱️ Preset Timeline</h4>
          <button
            onClick={props.handleAddPresetKeyframe}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex items-center gap-1"
          >
            <Plus size={12} />
            Add Segment
          </button>
        </div>
        
        {/* Timeline Visualization */}
        {props.duration && (
          <div className="relative h-8 bg-gray-900 rounded overflow-hidden">
            {sortedPresetKeyframes.map((kf) => {
              const startPercent = (kf.time / props.duration!) * 100;
              const widthPercent = Math.max(0, ((kf.endTime - kf.time) / props.duration!) * 100);
              const color = getPresetColor(kf.preset);
              
              return (
                <div
                  key={kf.id}
                  className="absolute h-full flex items-center justify-center text-xs text-white font-medium overflow-hidden"
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: color,
                    borderRight: '1px solid rgba(0,0,0,0.3)'
                  }}
                  title={`${props.animationTypes.find(t => t.value === kf.preset)?.label} (${formatTime(kf.time)} - ${formatTime(kf.endTime)})`}
                >
                  {widthPercent > 5 && (
                    <span className="truncate px-1">
                      {props.animationTypes.find(t => t.value === kf.preset)?.icon}
                    </span>
                  )}
                </div>
              );
            })}
            {/* Playhead */}
            <div
              className="absolute top-0 w-0.5 h-full bg-white pointer-events-none"
              style={{ left: `${(props.currentTime / props.duration) * 100}%` }}
            />
          </div>
        )}
        
        {/* Preset Keyframes List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedPresetKeyframes.map((kf) => (
            <div key={kf.id} className="bg-gray-800 rounded p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: getPresetColor(kf.preset) }}>
                  Segment #{kf.id}
                </span>
                <button
                  onClick={() => props.handleDeletePresetKeyframe(kf.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="Delete segment"
                  disabled={sortedPresetKeyframes.length <= 1}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Start: {formatTime(kf.time)}</label>
                  <input
                    type="number"
                    value={kf.time}
                    onChange={(e) => props.handleUpdatePresetKeyframe(kf.id, 'time', parseFloat(e.target.value))}
                    step="0.1"
                    min="0"
                    className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">End: {formatTime(kf.endTime)}</label>
                  <input
                    type="number"
                    value={kf.endTime}
                    onChange={(e) => props.handleUpdatePresetKeyframe(kf.id, 'endTime', parseFloat(e.target.value))}
                    step="0.1"
                    min={kf.time + 0.1}
                    className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-400 block mb-1">Preset</label>
                <select
                  value={kf.preset}
                  onChange={(e) => props.handleUpdatePresetKeyframe(kf.id, 'preset', e.target.value)}
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                >
                  {props.animationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Speed Keyframes */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-cyan-400">⚡ Speed Keyframes</h4>
          <button
            onClick={props.handleAddSpeedKeyframe}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex items-center gap-1"
          >
            <Plus size={12} />
            Add Keyframe
          </button>
        </div>
        
        {/* Speed Gradient Visualization */}
        {props.duration && sortedSpeedKeyframes.length > 0 && (
          <div className="relative h-8 bg-gray-900 rounded overflow-hidden">
            <div className="absolute inset-0 flex">
              {sortedSpeedKeyframes.map((kf, idx) => {
                const nextKf = sortedSpeedKeyframes[idx + 1];
                if (!nextKf) return null;
                
                const startPercent = (kf.time / props.duration!) * 100;
                const widthPercent = ((nextKf.time - kf.time) / props.duration!) * 100;
                
                // Color based on speed (slow = blue, normal = green, fast = red)
                const avgSpeed = (kf.speed + nextKf.speed) / 2;
                const hue = Math.max(0, Math.min(120, 120 - (avgSpeed - 1) * 60)); // 120=green, 0=red
                const color = `hsl(${hue}, 70%, 50%)`;
                
                return (
                  <div
                    key={kf.id}
                    className="absolute h-full"
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                      background: `linear-gradient(to right, ${color}, ${color})`,
                      opacity: 0.7
                    }}
                  />
                );
              })}
            </div>
            {/* Playhead */}
            <div
              className="absolute top-0 w-0.5 h-full bg-white pointer-events-none z-10"
              style={{ left: `${(props.currentTime / props.duration) * 100}%` }}
            />
          </div>
        )}
        
        {/* Speed Keyframes List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {sortedSpeedKeyframes.map((kf) => (
            <div key={kf.id} className="bg-gray-800 rounded p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Time: {formatTime(kf.time)}</span>
                <button
                  onClick={() => props.handleDeleteSpeedKeyframe(kf.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="Delete keyframe"
                  disabled={sortedSpeedKeyframes.length <= 1}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Time (s)</label>
                  <input
                    type="number"
                    value={kf.time}
                    onChange={(e) => props.handleUpdateSpeedKeyframe(kf.id, 'time', parseFloat(e.target.value))}
                    step="0.1"
                    min="0"
                    className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Speed: {kf.speed.toFixed(2)}x</label>
                  <input
                    type="range"
                    value={kf.speed}
                    onChange={(e) => props.handleUpdateSpeedKeyframe(kf.id, 'speed', parseFloat(e.target.value))}
                    min="0.1"
                    max="3"
                    step="0.1"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-400 block mb-1">Easing</label>
                <select
                  value={kf.easing}
                  onChange={(e) => props.handleUpdateSpeedKeyframe(kf.id, 'easing', e.target.value)}
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                >
                  <option value="linear">Linear</option>
                  <option value="easeIn">Ease In</option>
                  <option value="easeOut">Ease Out</option>
                  <option value="easeInOut">Ease In/Out</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-center italic">
        Preset segments define which animation plays when. Speed keyframes control animation speed over time.
      </p>
    </div>
  );
}
