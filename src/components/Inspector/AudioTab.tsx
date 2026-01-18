import React, { useEffect, useRef } from 'react';
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
 * Waveform Canvas Component - Renders waveform for a single audio track
 * Uses useEffect to properly handle buffer updates and re-renders
 */
function WaveformCanvas({ track }: { track: AudioTrack }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !track.buffer) return;
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn('Could not get canvas 2d context');
        return;
      }
      
      // Generate waveform data (now with built-in error handling)
      const waveform = generateWaveformData(track.buffer, 200);
      
      // Set canvas dimensions
      canvas.width = canvas.offsetWidth;
      canvas.height = 64;
      
      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw waveform bars
      ctx.fillStyle = track.active ? '#06b6d4' : '#4b5563';
      const barWidth = canvas.width / waveform.length;
      
      for (let i = 0; i < waveform.length; i++) {
        const barHeight = waveform[i] * canvas.height;
        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }
    } catch (error) {
      console.error('Failed to render waveform for track:', track.name, error);
      // Show error state on canvas
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.fillStyle = '#7f1d1d'; // Red error background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Error rendering waveform', canvas.width / 2, canvas.height / 2);
      }
    }
  }, [track.buffer, track.active, track.id, track.name]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
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
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(f => f.type.startsWith('audio/'));
    if (audioFile) {
      addAudioTrack(audioFile);
    }
  };

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
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`text-center py-12 text-gray-400 text-sm border-2 border-dashed rounded-lg transition-colors ${
              isDragging
                ? 'border-purple-500 bg-purple-900/20 text-purple-300'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-4xl mb-2">🎵</div>
            <div className="font-medium mb-1">
              {isDragging ? 'Drop audio file here' : 'Drag & drop audio files here'}
            </div>
            <div className="text-xs text-gray-500">
              or click "Add Track" button above
            </div>
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
                  <WaveformCanvas track={track} />
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
