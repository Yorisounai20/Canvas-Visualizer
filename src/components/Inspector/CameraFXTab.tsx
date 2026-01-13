import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CameraFXClip, CameraFXKeyframe, CameraFXAudioModulation } from '../../types';

interface CameraFXTabProps {
  // Current state
  currentTime: number;
  
  // Camera FX Clips
  cameraFXClips: CameraFXClip[];
  selectedFXClipId: string | null;
  setSelectedFXClipId: (id: string | null) => void;
  addCameraFXClip: (type: 'grid' | 'kaleidoscope' | 'pip') => void;
  updateCameraFXClip: (id: string, updates: Partial<CameraFXClip>) => void;
  deleteCameraFXClip: (id: string) => void;
  
  // Camera FX Keyframes
  cameraFXKeyframes: CameraFXKeyframe[];
  addCameraFXKeyframe: (clipId: string, parameter: string, value: number) => void;
  updateCameraFXKeyframe: (id: string, updates: Partial<CameraFXKeyframe>) => void;
  deleteCameraFXKeyframe: (id: string) => void;
  
  // Camera FX Audio Modulations
  cameraFXAudioModulations: CameraFXAudioModulation[];
  addCameraFXAudioModulation: (clipId: string, parameter: string, audioTrack: 'bass' | 'mids' | 'highs', amount: number) => void;
  updateCameraFXAudioModulation: (id: string, updates: Partial<CameraFXAudioModulation>) => void;
  deleteCameraFXAudioModulation: (id: string) => void;
}

/**
 * Camera FX Tab Component - Advanced Camera Effects System
 * 
 * Features:
 * - Camera FX System (Grid, Kaleidoscope, Picture-in-Picture)
 * - Timeline clips with start/end times
 * - FX parameter keyframes for animation
 * - Audio modulation for reactive effects
 * - Add/Edit/Delete FX clips and keyframes
 */
export default function CameraFXTab(props: CameraFXTabProps) {
  const sortedClips = [...props.cameraFXClips].sort((a, b) => a.startTime - b.startTime);
  const selectedClip = sortedClips.find(c => c.id === props.selectedFXClipId);
  
  const clipKeyframes = selectedClip 
    ? props.cameraFXKeyframes.filter(kf => kf.clipId === selectedClip.id).sort((a, b) => a.time - b.time)
    : [];
  
  const clipModulations = selectedClip
    ? props.cameraFXAudioModulations.filter(mod => mod.clipId === selectedClip.id)
    : [];
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getFXIcon = (type: string) => {
    switch (type) {
      case 'grid': return '🔲';
      case 'kaleidoscope': return '🌀';
      case 'pip': return '📺';
      default: return '🎬';
    }
  };

  return (
    <div className="space-y-3">
      {/* Add Camera FX Buttons */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <h4 className="text-sm font-semibold text-cyan-400">🎬 Camera FX Types</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => props.addCameraFXClip('grid')}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex flex-col items-center gap-1"
          >
            <span>🔲</span>
            <span>Grid</span>
          </button>
          <button
            onClick={() => props.addCameraFXClip('kaleidoscope')}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex flex-col items-center gap-1"
          >
            <span>🌀</span>
            <span>Kaleidoscope</span>
          </button>
          <button
            onClick={() => props.addCameraFXClip('pip')}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex flex-col items-center gap-1"
          >
            <span>📺</span>
            <span>PiP</span>
          </button>
        </div>
      </div>
      
      {/* FX Clips Timeline */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <h4 className="text-sm font-semibold text-cyan-400">📅 FX Timeline Clips</h4>
        
        {sortedClips.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No FX clips yet. Click a button above to add an FX clip at the current time.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sortedClips.map((clip) => (
              <div 
                key={clip.id} 
                className={`bg-gray-800 rounded p-2 space-y-2 cursor-pointer border-2 ${
                  props.selectedFXClipId === clip.id ? 'border-cyan-500' : 'border-transparent'
                }`}
                onClick={() => props.setSelectedFXClipId(clip.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={clip.enabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        props.updateCameraFXClip(clip.id, { enabled: e.target.checked });
                      }}
                      className="cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-cyan-400">
                      {getFXIcon(clip.type)} {clip.name || clip.type}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      props.deleteCameraFXClip(clip.id);
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete FX clip"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <div>Start: {formatTime(clip.startTime)}</div>
                  <div>End: {formatTime(clip.endTime)}</div>
                </div>
                
                {clip.type === 'grid' && (
                  <div className="text-xs text-gray-500">
                    Grid: {clip.gridRows}×{clip.gridColumns}
                  </div>
                )}
                {clip.type === 'kaleidoscope' && (
                  <div className="text-xs text-gray-500">
                    Segments: {clip.kaleidoscopeSegments} | Rotation: {clip.kaleidoscopeRotation}°
                  </div>
                )}
                {clip.type === 'pip' && (
                  <div className="text-xs text-gray-500">
                    Scale: {(clip.pipScale! * 100).toFixed(0)}% | Pos: ({(clip.pipPositionX! * 100).toFixed(0)}%, {(clip.pipPositionY! * 100).toFixed(0)}%)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Selected Clip Editor */}
      {selectedClip && (
        <div className="bg-gray-700 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-cyan-400">
              ✏️ Edit: {getFXIcon(selectedClip.type)} {selectedClip.name}
            </h4>
            <button
              onClick={() => props.setSelectedFXClipId(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
          
          {/* Clip Timing */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Start Time (s)</label>
              <input
                type="number"
                value={selectedClip.startTime}
                onChange={(e) => props.updateCameraFXClip(selectedClip.id, { startTime: parseFloat(e.target.value) })}
                step="0.1"
                min="0"
                className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">End Time (s)</label>
              <input
                type="number"
                value={selectedClip.endTime}
                onChange={(e) => props.updateCameraFXClip(selectedClip.id, { endTime: parseFloat(e.target.value) })}
                step="0.1"
                min={selectedClip.startTime}
                className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs"
              />
            </div>
          </div>
          
          {/* Type-specific parameters */}
          {selectedClip.type === 'grid' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Rows</label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={selectedClip.gridRows || 2}
                  onChange={(e) => props.updateCameraFXClip(selectedClip.id, { gridRows: parseInt(e.target.value) })}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{selectedClip.gridRows || 2}</span>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Columns</label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={selectedClip.gridColumns || 2}
                  onChange={(e) => props.updateCameraFXClip(selectedClip.id, { gridColumns: parseInt(e.target.value) })}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{selectedClip.gridColumns || 2}</span>
              </div>
            </div>
          )}
          
          {selectedClip.type === 'kaleidoscope' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Segments: {selectedClip.kaleidoscopeSegments}</label>
                <input
                  type="range"
                  min="2"
                  max="16"
                  value={selectedClip.kaleidoscopeSegments || 6}
                  onChange={(e) => props.updateCameraFXClip(selectedClip.id, { kaleidoscopeSegments: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Rotation: {selectedClip.kaleidoscopeRotation}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedClip.kaleidoscopeRotation || 0}
                  onChange={(e) => props.updateCameraFXClip(selectedClip.id, { kaleidoscopeRotation: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          {selectedClip.type === 'pip' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Scale: {((selectedClip.pipScale || 0.25) * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={selectedClip.pipScale || 0.25}
                  onChange={(e) => props.updateCameraFXClip(selectedClip.id, { pipScale: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">X: {((selectedClip.pipPositionX || 0.65) * 100).toFixed(0)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedClip.pipPositionX || 0.65}
                    onChange={(e) => props.updateCameraFXClip(selectedClip.id, { pipPositionX: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Y: {((selectedClip.pipPositionY || 0.65) * 100).toFixed(0)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedClip.pipPositionY || 0.65}
                    onChange={(e) => props.updateCameraFXClip(selectedClip.id, { pipPositionY: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* FX Keyframes */}
          <div className="border-t border-gray-600 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-semibold text-gray-300">⏱️ Parameter Keyframes</h5>
              <span className="text-xs text-gray-500">{clipKeyframes.length} keyframes</span>
            </div>
            {clipKeyframes.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-xs">
                No keyframes for this clip
              </div>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {clipKeyframes.map(kf => (
                  <div key={kf.id} className="flex items-center justify-between text-xs bg-gray-800 rounded px-2 py-1">
                    <span className="text-gray-400">{kf.parameter}: {kf.value} @ {formatTime(kf.time)}</span>
                    <button
                      onClick={() => props.deleteCameraFXKeyframe(kf.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Audio Modulations */}
          <div className="border-t border-gray-600 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-semibold text-gray-300">🎵 Audio Modulations</h5>
              <span className="text-xs text-gray-500">{clipModulations.length} mods</span>
            </div>
            {clipModulations.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-xs">
                No audio modulations for this clip
              </div>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {clipModulations.map(mod => (
                  <div key={mod.id} className="flex items-center justify-between text-xs bg-gray-800 rounded px-2 py-1">
                    <span className="text-gray-400">{mod.parameter} ← {mod.audioTrack} ({mod.amount}x)</span>
                    <button
                      onClick={() => props.deleteCameraFXAudioModulation(mod.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 text-center italic">
        Camera FX create visual effects that transform the rendered output. Select a clip to edit parameters.
      </p>
    </div>
  );
}
