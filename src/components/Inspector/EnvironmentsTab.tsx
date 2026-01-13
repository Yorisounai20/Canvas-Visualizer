import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { EnvironmentKeyframe } from '../VisualizerSoftware/types';

interface ParticleEmitterKeyframe {
  id: number;
  time: number;
  duration: number;
  emissionRate: number;
  lifetime: number;
  maxParticles: number;
  spawnX: number;
  spawnY: number;
  spawnZ: number;
  spawnRadius: number;
  startColor: string;
  endColor: string;
  startSize: number;
  endSize: number;
  audioTrack: 'bass' | 'mids' | 'highs' | 'all';
  shape: 'sphere' | 'cube' | 'tetrahedron' | 'octahedron';
  enabled: boolean;
}

interface EnvironmentsTabProps {
  // Current state
  currentTime: number;
  
  // Environment Keyframes
  environmentKeyframes: EnvironmentKeyframe[];
  handleAddEnvironmentKeyframe: () => void;
  handleDeleteEnvironmentKeyframe: (id: number) => void;
  handleUpdateEnvironmentKeyframe: (id: number, type: string, intensity: number, color?: string) => void;
  
  // Particle Emitter Keyframes
  particleEmitterKeyframes: ParticleEmitterKeyframe[];
  addParticleEmitterKeyframe: () => void;
  deleteParticleEmitterKeyframe: (id: number) => void;
  updateParticleEmitterKeyframe: (id: number, field: string, value: any) => void;
  
  // Default Settings for new particles
  particleEmissionRate: number;
  particleLifetime: number;
  particleMaxCount: number;
  particleStartColor: string;
  particleEndColor: string;
  particleStartSize: number;
  particleEndSize: number;
  particleShape: 'sphere' | 'cube' | 'tetrahedron' | 'octahedron';
  setParticleEmissionRate: (rate: number) => void;
  setParticleLifetime: (lifetime: number) => void;
  setParticleMaxCount: (count: number) => void;
  setParticleStartColor: (color: string) => void;
  setParticleEndColor: (color: string) => void;
  setParticleStartSize: (size: number) => void;
  setParticleEndSize: (size: number) => void;
  setParticleShape: (shape: 'sphere' | 'cube' | 'tetrahedron' | 'octahedron') => void;
}

/**
 * Environments Tab Component - Environment System and Particle Emitters
 * 
 * Features:
 * - Environment keyframes with types (ocean, space, forest, etc.)
 * - Particle emitter timeline with multiple emitters
 * - Default particle settings templates
 * - Add/Edit/Delete environment and particle keyframes
 */
export default function EnvironmentsTab(props: EnvironmentsTabProps) {
  const sortedEnvironmentKeyframes = [...props.environmentKeyframes].sort((a, b) => a.time - b.time);
  const sortedParticleKeyframes = [...props.particleEmitterKeyframes].sort((a, b) => a.time - b.time);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const environmentTypes = [
    { value: 'ocean', label: '🌊 Ocean', color: '#1e40af' },
    { value: 'space', label: '🌌 Space', color: '#1f2937' },
    { value: 'forest', label: '🌲 Forest', color: '#166534' },
    { value: 'desert', label: '🏜️ Desert', color: '#c2410c' },
    { value: 'aurora', label: '🌈 Aurora', color: '#5b21b6' },
    { value: 'fire', label: '🔥 Fire', color: '#dc2626' },
    { value: 'ice', label: '❄️ Ice', color: '#0ea5e9' },
    { value: 'neon', label: '💡 Neon', color: '#ec4899' },
  ];

  return (
    <div className="space-y-3">
      {/* Environment Keyframes */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-cyan-400">🌍 Environment Keyframes</h4>
          <button
            onClick={props.handleAddEnvironmentKeyframe}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex items-center gap-1"
          >
            <Plus size={12} />
            Add Environment
          </button>
        </div>
        
        {sortedEnvironmentKeyframes.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No environment keyframes yet. Click "Add Environment" to create one.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedEnvironmentKeyframes.map((kf) => {
              const envType = environmentTypes.find(t => t.value === kf.type);
              return (
                <div key={kf.id} className="bg-gray-800 rounded p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: envType?.color }}>
                      {envType?.label || kf.type} @ {formatTime(kf.time)}
                    </span>
                    <button
                      onClick={() => props.handleDeleteEnvironmentKeyframe(kf.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Delete environment"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Time (s)</label>
                    <input
                      type="number"
                      value={kf.time}
                      onChange={(e) => props.handleUpdateEnvironmentKeyframe(kf.id, kf.type, kf.intensity, kf.color)}
                      step="0.1"
                      min="0"
                      className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Type</label>
                    <select
                      value={kf.type}
                      onChange={(e) => props.handleUpdateEnvironmentKeyframe(kf.id, e.target.value, kf.intensity, kf.color)}
                      className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                    >
                      {environmentTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Intensity: {(kf.intensity * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={kf.intensity}
                      onChange={(e) => props.handleUpdateEnvironmentKeyframe(kf.id, kf.type, parseFloat(e.target.value), kf.color)}
                      className="w-full"
                    />
                  </div>
                  
                  {kf.color !== undefined && (
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Color Tint</label>
                      <input
                        type="color"
                        value={kf.color}
                        onChange={(e) => props.handleUpdateEnvironmentKeyframe(kf.id, kf.type, kf.intensity, e.target.value)}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Particle Emitter Timeline */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-cyan-400">✨ Particle Emitter Timeline</h4>
          <button
            onClick={props.addParticleEmitterKeyframe}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex items-center gap-1"
          >
            <Plus size={12} />
            Add Emitter
          </button>
        </div>
        
        {sortedParticleKeyframes.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No particle emitters yet. Configure defaults below, then click "Add Emitter".
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sortedParticleKeyframes.map((kf) => (
              <div key={kf.id} className="bg-gray-800 rounded p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={kf.enabled}
                      onChange={(e) => props.updateParticleEmitterKeyframe(kf.id, 'enabled', e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-cyan-400">
                      Emitter #{kf.id} @ {formatTime(kf.time)}
                    </span>
                  </div>
                  <button
                    onClick={() => props.deleteParticleEmitterKeyframe(kf.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete emitter"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-400">Duration: {kf.duration.toFixed(1)}s</div>
                  <div className="text-gray-400">Rate: {kf.emissionRate}/s</div>
                  <div className="text-gray-400">Max: {kf.maxParticles}</div>
                  <div className="text-gray-400">Shape: {kf.shape}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border border-gray-600" 
                    style={{ backgroundColor: kf.startColor }}
                    title="Start color"
                  />
                  <span className="text-xs text-gray-500">→</span>
                  <div 
                    className="w-4 h-4 rounded border border-gray-600" 
                    style={{ backgroundColor: kf.endColor }}
                    title="End color"
                  />
                  <span className="text-xs text-gray-400 ml-2">
                    {kf.audioTrack.toUpperCase()} driven
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Default Particle Settings (Template) */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <h4 className="text-sm font-semibold text-cyan-400">⚙️ Default Particle Settings</h4>
        <p className="text-xs text-gray-500">Configure defaults for new particle emitters</p>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Emission Rate: {props.particleEmissionRate}/s
          </label>
          <input
            type="range"
            min="1"
            max="200"
            step="1"
            value={props.particleEmissionRate}
            onChange={(e) => props.setParticleEmissionRate(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Lifetime: {props.particleLifetime.toFixed(1)}s
          </label>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={props.particleLifetime}
            onChange={(e) => props.setParticleLifetime(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Max Particles: {props.particleMaxCount}
          </label>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={props.particleMaxCount}
            onChange={(e) => props.setParticleMaxCount(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Start Color</label>
            <input
              type="color"
              value={props.particleStartColor}
              onChange={(e) => props.setParticleStartColor(e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">End Color</label>
            <input
              type="color"
              value={props.particleEndColor}
              onChange={(e) => props.setParticleEndColor(e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Start Size: {props.particleStartSize.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={props.particleStartSize}
              onChange={(e) => props.setParticleStartSize(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              End Size: {props.particleEndSize.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={props.particleEndSize}
              onChange={(e) => props.setParticleEndSize(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">Particle Shape</label>
          <div className="grid grid-cols-4 gap-1">
            {(['sphere', 'cube', 'tetrahedron', 'octahedron'] as const).map((shape) => (
              <button
                key={shape}
                onClick={() => props.setParticleShape(shape)}
                className={`px-2 py-1.5 rounded text-xs capitalize ${
                  props.particleShape === shape
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {shape === 'sphere' ? '🔮' : shape === 'cube' ? '🟪' : shape === 'tetrahedron' ? '🔷' : '💠'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-center italic">
        Environment keyframes change scene atmosphere. Particle emitters spawn animated particles over time.
      </p>
    </div>
  );
}
