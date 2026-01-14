import React, { useRef, useEffect, useCallback, useState } from 'react';
import { debounce } from './utils';

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  duration: number;
  width: number;
  height?: number;
  color?: string;
  waveformMode?: 'top' | 'mirrored'; // Bug #4 fix: support top-only mode
}

/**
 * WaveformVisualizer Component - Displays audio waveform in timeline
 * Renders waveform from audio buffer data
 * 
 * Bug #3 fixes: Optimized with sample capping and debounced redraws
 * Bug #4 fix: Supports top-only waveform mode
 */
export default function WaveformVisualizer({
  audioBuffer,
  duration,
  width,
  height = 60,
  color = 'rgba(100, 180, 255, 0.3)',
  waveformMode = 'top' // Default to top-only as per bug #4
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Bug #3 fix: Debounced draw function (100ms delay)
  const drawWaveform = useCallback(
    debounce(() => {
      if (!audioBuffer || !canvasRef.current) {
        setIsDrawing(false);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsDrawing(false);
        return;
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Get audio data from first channel
      const rawData = audioBuffer.getChannelData(0);
      
      // Bug #3 fix: Cap samples to prevent performance issues
      // Use minimum of width or 2048 samples, with at least 256
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
        
        if (waveformMode === 'top') {
          // Bug #4 fix: Draw top-half only (from bottom to top)
          ctx.fillRect(x, height - barHeight, Math.ceil(barWidth), barHeight);
        } else {
          // Draw mirrored bars (top and bottom)
          ctx.fillRect(x, middle - barHeight, Math.ceil(barWidth), barHeight * 2);
        }
      }
      
      setIsDrawing(false);
    }, 100), // 100ms debounce
    [audioBuffer, width, height, color, waveformMode]
  );

  useEffect(() => {
    setIsDrawing(true);
    drawWaveform();
  }, [drawWaveform]);

  if (!audioBuffer) {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex items-center justify-center bg-gray-800 bg-opacity-50"
      >
        <span className="text-xs text-gray-500">
          {isDrawing ? 'Loading waveform...' : 'No audio loaded'}
        </span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 pointer-events-none opacity-50"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
