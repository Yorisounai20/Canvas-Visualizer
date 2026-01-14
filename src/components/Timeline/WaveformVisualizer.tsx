import React, { useRef, useEffect, useState } from 'react';
import { debounce } from './utils';

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  width: number;
  height?: number;
  color?: string;
  waveformMode?: 'top' | 'mirrored'; // Bug #4: Support top-half only mode
}

/**
 * WaveformVisualizer Component - Displays audio waveform in timeline
 * 
 * Bug #3: Performance optimizations - sample capping, debouncing
 * Bug #4: Top-half waveform mode support
 */
export default function WaveformVisualizer({
  audioBuffer,
  width,
  height = 60,
  color = 'rgba(100, 180, 255, 0.3)',
  waveformMode = 'top', // Bug #4: Default to top-half only
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    // Bug #3: Debounce rendering for performance (100ms)
    const debouncedRender = debounce(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setIsLoading(true);

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Get audio data from first channel
      const rawData = audioBuffer.getChannelData(0);
      
      // Bug #3: Cap samples to max 2048 for performance
      const samples = Math.min(Math.max(256, Math.floor(width)), 2048);
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData = [];

      // Downsample the data
      for (let i = 0; i < samples; i++) {
        const blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[blockStart + j]);
        }
        filteredData.push(sum / blockSize);
      }

      // Normalize the data
      const max = Math.max(...filteredData);
      const normalizedData = filteredData.map(n => n / max);

      // Draw waveform
      ctx.fillStyle = color;
      ctx.beginPath();
      
      const middle = height / 2;
      const barWidth = width / samples;
      
      for (let i = 0; i < normalizedData.length; i++) {
        const x = i * barWidth;
        const barHeight = normalizedData[i] * (waveformMode === 'top' ? height : middle);
        
        // Bug #4: Draw based on waveformMode
        if (waveformMode === 'top') {
          // Top-half only: bars from bottom to top
          ctx.fillRect(x, height - barHeight, Math.max(1, barWidth), barHeight);
        } else {
          // Mirrored: bars from middle outward
          ctx.fillRect(x, middle - barHeight, Math.max(1, barWidth), barHeight * 2);
        }
      }
      
      setIsLoading(false);
    }, 100);

    debouncedRender();
  }, [audioBuffer, width, height, color, waveformMode]);

  if (!audioBuffer) {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex items-center justify-center bg-gray-800 bg-opacity-50"
      >
        <span className="text-xs text-gray-500">No audio loaded</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
      {/* Bug #3: Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
          <span className="text-xs text-gray-400">Rendering waveform...</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none opacity-50"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
}
