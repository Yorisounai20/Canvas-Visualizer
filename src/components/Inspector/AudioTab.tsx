import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AudioTrack } from '../VisualizerSoftware/types';
import { generateWaveformData } from '../VisualizerSoftware/utils';

interface AudioTabProps {
  audioTracks: AudioTrack[];
  bassGain: number;
  midsGain: number;
  highsGain: number;
  addAudioTrack: (file: File) => void;
  removeAudioTrack: (id: string) => void;
  setActiveTrack: (id: string) => void;
  setBassGain: (gain: number) => void;
  setMidsGain: (gain: number) => void;
  setHighsGain: (gain: number) => void;
}

/**
 * Audio Tab Component - Comprehensive audio track management
 * Extracted from visualizer-software-COMPREHENSIVE-BACKUP.tsx lines 8336-8445
 */
export default function AudioTab({
  audioTracks,
  bassGain,
  midsGain,
  highsGain,
  addAudioTrack,
  removeAudioTrack,
  setActiveTrack,
  setBassGain,
  setMidsGain,
  setHighsGain
}: AudioTabProps) {
  return (
    <div>
      <div className="mb-4 bg-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-cyan-400">🎵 Audio Tracks</h3>
          <label className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded cursor-pointer flex items-center gap-1">
            <Plus size={14} /> Add Track
            <input 
              type="file" 
              accept="audio/*" 
              onChange={(e) => { if (e.target.files?.[0]) addAudioTrack(e.target.files[0]); }}
              className="hidden"
            />
          </label>
        </div>
        
        {audioTracks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No audio tracks loaded. Click "Add Track" to upload audio files.
          </div>
        ) : (
          <div className="space-y-3">
            {audioTracks.map((track) => (
              <div key={track.id} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="activeTrack"
                      checked={track.active}
                      onChange={() => setActiveTrack(track.id)}
                      className="cursor-pointer"
                      title="Active track (frequencies drive visualization)"
                    />
                    <span className="text-sm text-white font-medium">{track.name}</span>
                    {track.active && <span className="text-xs text-cyan-400 bg-cyan-900 px-2 py-0.5 rounded">Active</span>}
                  </div>
                  <button
                    onClick={() => removeAudioTrack(track.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Remove track"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {/* Waveform visualization for this track */}
                <div className="bg-black rounded p-2 mb-2 h-16">
                  <canvas
                    ref={(canvas) => {
                      if (canvas && track.buffer) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          const waveform = generateWaveformData(track.buffer, 200);
                          canvas.width = canvas.offsetWidth;
                          canvas.height = 64;
                          ctx.fillStyle = '#000';
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                          ctx.fillStyle = track.active ? '#06b6d4' : '#4b5563';
                          const barWidth = canvas.width / waveform.length;
                          for (let i = 0; i < waveform.length; i++) {
                            const barHeight = waveform[i] * canvas.height;
                            const x = i * barWidth;
                            const y = (canvas.height - barHeight) / 2;
                            ctx.fillRect(x, y, barWidth - 1, barHeight);
                          }
                        }
                      }
                    }}
                    className="w-full h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Frequency Gain Controls */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <h3 className="text-sm font-semibold text-cyan-400">🎚️ Frequency Gain Controls</h3>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Bass Gain: {bassGain.toFixed(2)}x
          </label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={bassGain}
            onChange={(e) => setBassGain(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Mids Gain: {midsGain.toFixed(2)}x
          </label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={midsGain}
            onChange={(e) => setMidsGain(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Highs Gain: {highsGain.toFixed(2)}x
          </label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={highsGain}
            onChange={(e) => setHighsGain(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
