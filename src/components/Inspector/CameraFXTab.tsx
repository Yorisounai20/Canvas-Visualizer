import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { CameraFXClip, CameraFXKeyframe, CameraFXAudioModulation, ParameterEvent, AudioTrack } from '../../types';

interface CameraFXTabProps {
  // Current state
  currentTime: number;
  duration: number;
  
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
  
  // Parameter Events (Issue #4)
  parameterEvents: ParameterEvent[];
  audioTracks: AudioTrack[];
  addParameterEvent: () => void;
  updateParameterEvent: (eventId: string, updates: Partial<ParameterEvent>) => void;
  deleteParameterEvent: (eventId: string) => void;
}

/**
 * Camera FX Tab Component - Advanced Camera Effects System
 * 
 * Features:
 * - Camera FX System (Grid, Kaleidoscope, Picture-in-Picture)
 * - Timeline clips with start/end times
 * - FX parameter keyframes for animation
 * - Audio modulation for reactive effects
 * - Parameter Events Timeline (Manual/Automated modes)
 * - Add/Edit/Delete FX clips, keyframes, and parameter events
 */
export default function CameraFXTab(props: CameraFXTabProps) {
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
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
  
  const formatTimeInput = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const parseTimeInput = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
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
      
      {/* ISSUE #4: Parameter Events Timeline */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-cyan-400">⚡ Parameter Events</h4>
          <button
            onClick={props.addParameterEvent}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex items-center gap-1"
          >
            <Plus size={12} />
            Add Event
          </button>
        </div>
        
        {props.parameterEvents.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No parameter events yet. Click "Add Event" to create one.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {props.parameterEvents.map(event => {
              const formatTime = (secs: number) => {
                const mins = Math.floor(secs / 60);
                const s = Math.floor(secs % 60);
                return `${mins}:${s.toString().padStart(2, '0')}`;
              };
              
              return (
                <div key={event.id} className="bg-gray-800 rounded p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      {event.mode === 'manual' ? '⏱️ Manual' : '🤖 Automated'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingEventId(event.id);
                        setShowEventModal(true);
                      }}
                      className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-xs text-gray-400">
                    {event.mode === 'manual' ? (
                      <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                    ) : (
                      <span>Threshold: {Math.round((event.threshold || 0.5) * 100)}%</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {event.parameters.backgroundFlash! > 0 && (
                      <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">⚪ Flash</span>
                    )}
                    {event.parameters.cameraShake! > 0 && (
                      <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">📷 Shake</span>
                    )}
                    {event.parameters.vignettePulse! > 0 && (
                      <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">🌑 Vignette</span>
                    )}
                    {event.parameters.saturationBurst! > 0 && (
                      <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">🎨 Saturation</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500 text-center italic">
        Camera FX create visual effects that transform the rendered output. Parameter events add reactive animations.
      </p>
      
      {/* Parameter Event Edit Modal */}
      {showEventModal && editingEventId && (() => {
        const event = props.parameterEvents.find(e => e.id === editingEventId);
        if (!event) return null;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowEventModal(false)}>
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-400">⚡ Edit Event</h2>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Mode Selection */}
                <div>
                  <label className="text-sm text-gray-300 block mb-2">Event Mode</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => props.updateParameterEvent(editingEventId, { mode: 'manual' })}
                      className={`flex-1 px-3 py-2 rounded text-xs ${event.mode === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                      ⏱️ Manual (Fixed Time)
                    </button>
                    <button
                      onClick={() => props.updateParameterEvent(editingEventId, { mode: 'automated' })}
                      className={`flex-1 px-3 py-2 rounded text-xs ${event.mode === 'automated' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                      🤖 Automated (Reactive)
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {event.mode === 'manual' ? 'Triggers at a specific time' : 'React to Audio Track'}
                  </p>
                </div>

                {/* Manual Mode: Start/End Time */}
                {event.mode === 'manual' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-300 block mb-2">Start Time (MM:SS)</label>
                      <input
                        type="text"
                        value={formatTimeInput(event.startTime)}
                        onChange={(e) => {
                          const newTime = parseTimeInput(e.target.value);
                          if (!isNaN(newTime) && newTime >= 0 && newTime <= props.duration) {
                            props.updateParameterEvent(editingEventId, { startTime: newTime });
                          }
                        }}
                        placeholder="0:00"
                        className="w-full px-3 py-2 bg-gray-700 rounded text-white font-mono text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">When the event starts</p>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-300 block mb-2">End Time (MM:SS)</label>
                      <input
                        type="text"
                        value={formatTimeInput(event.endTime)}
                        onChange={(e) => {
                          const newTime = parseTimeInput(e.target.value);
                          if (!isNaN(newTime) && newTime >= event.startTime && newTime <= props.duration) {
                            props.updateParameterEvent(editingEventId, { endTime: newTime });
                          }
                        }}
                        placeholder="0:00"
                        className="w-full px-3 py-2 bg-gray-700 rounded text-white font-mono text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">When the event ends (must be after start time)</p>
                    </div>
                  </>
                )}

                {/* Automated Mode: Audio Track + Threshold */}
                {event.mode === 'automated' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-300 block mb-2">Select a track...</label>
                      <select
                        value={event.audioTrackId || ''}
                        onChange={(e) => props.updateParameterEvent(editingEventId, { audioTrackId: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 rounded text-white text-sm"
                      >
                        <option value="">Select a track...</option>
                        {props.audioTracks.map(track => (
                          <option key={track.id} value={track.id}>{track.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-300 block mb-2">Frequency Threshold</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={event.threshold || 0.5}
                        onChange={(e) => props.updateParameterEvent(editingEventId, { threshold: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">
                        {Math.round((event.threshold || 0.5) * 100)}% - Triggers when bass frequency exceeds this level
                      </span>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-300 block mb-2">Effect Duration (seconds)</label>
                      <input
                        type="range"
                        min="0.05"
                        max="2"
                        step="0.05"
                        value={event.endTime - event.startTime}
                        onChange={(e) => {
                          const duration = parseFloat(e.target.value);
                          props.updateParameterEvent(editingEventId, { endTime: event.startTime + duration });
                        }}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">
                        {(event.endTime - event.startTime).toFixed(2)}s (how long the effect lasts after triggering)
                      </span>
                    </div>
                  </>
                )}

                {/* Background Flash */}
                <div>
                  <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(event.parameters.backgroundFlash ?? 0) > 0}
                      onChange={(e) => props.updateParameterEvent(editingEventId, {
                        parameters: { ...event.parameters, backgroundFlash: e.target.checked ? 0.5 : 0 }
                      })}
                    />
                    ⚪ Background Flash
                  </label>
                  {(event.parameters.backgroundFlash ?? 0) > 0 && (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={event.parameters.backgroundFlash ?? 0}
                        onChange={(e) => props.updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, backgroundFlash: parseFloat(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">{Math.round((event.parameters.backgroundFlash ?? 0) * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Camera Shake */}
                <div>
                  <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(event.parameters.cameraShake ?? 0) > 0}
                      onChange={(e) => props.updateParameterEvent(editingEventId, {
                        parameters: { ...event.parameters, cameraShake: e.target.checked ? 0.5 : 0 }
                      })}
                    />
                    📷 Camera Shake (Automated)
                  </label>
                  {(event.parameters.cameraShake ?? 0) > 0 && (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={event.parameters.cameraShake ?? 0}
                        onChange={(e) => props.updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, cameraShake: parseFloat(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">{Math.round((event.parameters.cameraShake ?? 0) * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Vignette Pulse */}
                <div>
                  <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(event.parameters.vignettePulse ?? 0) > 0}
                      onChange={(e) => props.updateParameterEvent(editingEventId, {
                        parameters: { ...event.parameters, vignettePulse: e.target.checked ? 0.5 : 0 }
                      })}
                    />
                    🌑 Vignette Pulse
                  </label>
                  {(event.parameters.vignettePulse ?? 0) > 0 && (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={event.parameters.vignettePulse ?? 0}
                        onChange={(e) => props.updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, vignettePulse: parseFloat(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">{Math.round((event.parameters.vignettePulse ?? 0) * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Saturation Burst */}
                <div>
                  <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(event.parameters.saturationBurst ?? 0) > 0}
                      onChange={(e) => props.updateParameterEvent(editingEventId, {
                        parameters: { ...event.parameters, saturationBurst: e.target.checked ? 0.5 : 0 }
                      })}
                    />
                    🎨 Saturation Burst
                  </label>
                  {(event.parameters.saturationBurst ?? 0) > 0 && (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={event.parameters.saturationBurst ?? 0}
                        onChange={(e) => props.updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, saturationBurst: parseFloat(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">{Math.round((event.parameters.saturationBurst ?? 0) * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Vignette Strength Pulse */}
                <div>
                  <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(event.parameters.vignetteStrengthPulseRef ?? 0) > 0}
                      onChange={(e) => props.updateParameterEvent(editingEventId, {
                        parameters: { ...event.parameters, vignetteStrengthPulseRef: e.target.checked ? 0.5 : 0 }
                      })}
                    />
                    🌫️ Vignette Pulse
                  </label>
                  {(event.parameters.vignetteStrengthPulseRef ?? 0) > 0 && (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={event.parameters.vignetteStrengthPulseRef ?? 0}
                        onChange={(e) => props.updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, vignetteStrengthPulseRef: parseFloat(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">{Math.round((event.parameters.vignetteStrengthPulseRef ?? 0) * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Contrast Burst */}
                <div>
                  <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(event.parameters.contrastBurst ?? 0) > 0}
                      onChange={(e) => props.updateParameterEvent(editingEventId, {
                        parameters: { ...event.parameters, contrastBurst: e.target.checked ? 0.5 : 0 }
                      })}
                    />
                    🔆 Contrast Burst
                  </label>
                  {(event.parameters.contrastBurst ?? 0) > 0 && (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={event.parameters.contrastBurst ?? 0}
                        onChange={(e) => props.updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, contrastBurst: parseFloat(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">{Math.round((event.parameters.contrastBurst ?? 0) * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Color Tint Flash */}
                <div>
                  <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(event.parameters.colorTintFlash?.intensity ?? 0) > 0}
                      onChange={(e) => props.updateParameterEvent(editingEventId, {
                        parameters: { ...event.parameters, colorTintFlash: e.target.checked ? { r: 1, g: 0, b: 0, intensity: 0.5 } : undefined }
                      })}
                    />
                    🌈 Color Tint Flash
                  </label>
                  {(event.parameters.colorTintFlash?.intensity ?? 0) > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-red-400 block mb-1">R</label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={event.parameters.colorTintFlash?.r ?? 1}
                            onChange={(e) => props.updateParameterEvent(editingEventId, {
                              parameters: { ...event.parameters, colorTintFlash: { ...event.parameters.colorTintFlash!, r: parseFloat(e.target.value) } }
                            })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-400 block mb-1">G</label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={event.parameters.colorTintFlash?.g ?? 0}
                            onChange={(e) => props.updateParameterEvent(editingEventId, {
                              parameters: { ...event.parameters, colorTintFlash: { ...event.parameters.colorTintFlash!, g: parseFloat(e.target.value) } }
                            })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-blue-400 block mb-1">B</label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={event.parameters.colorTintFlash?.b ?? 0}
                            onChange={(e) => props.updateParameterEvent(editingEventId, {
                              parameters: { ...event.parameters, colorTintFlash: { ...event.parameters.colorTintFlash!, b: parseFloat(e.target.value) } }
                            })}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Intensity</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={event.parameters.colorTintFlash?.intensity ?? 0.5}
                          onChange={(e) => props.updateParameterEvent(editingEventId, {
                            parameters: { ...event.parameters, colorTintFlash: { ...event.parameters.colorTintFlash!, intensity: parseFloat(e.target.value) } }
                          })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{Math.round((event.parameters.colorTintFlash?.intensity ?? 0) * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    props.deleteParameterEvent(editingEventId);
                    setShowEventModal(false);
                  }}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Delete Event
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
