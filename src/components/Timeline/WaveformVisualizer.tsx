import React, { useRef, useEffect, useState, useCallback } from 'react';

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  duration: number;
  width: number;
  height?: number;
  color?: string;
  debounceMs?: number; // Debounce time for canvas redraws
  mode?: 'top-only' | 'mirrored'; // Display mode for waveform
}

/**
 * WaveformVisualizer Component - Displays audio waveform in timeline
 * Renders waveform from audio buffer data with optimized canvas handling
 * 
 * Performance improvements:
 * - Debounced canvas redraws to avoid repeated canvas resets during resize/zoom
 * - Only redraws when audioBuffer or dimensions actually change
 * - Avoids redrawing during scroll (canvas is positioned, not redrawn)
 * 
 * Long audio file support:
 * - Caps canvas width to 4096px (safe browser limit)
 * - Limits waveform samples to 1024 (prevents excessive processing)
 * - Implements smart downsampling with minimum block size for quality
 * - Handles files from seconds to 10+ minutes without rendering failures
 */
export default function WaveformVisualizer({
  audioBuffer,
  duration,
  width,
  height = 60,
  color = 'rgba(100, 180, 255, 0.3)',
  debounceMs = 150,
  mode = 'mirrored'
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const [debouncedWidth, setDebouncedWidth] = useState(width);
  const [debouncedHeight, setDebouncedHeight] = useState(height);

  // Debounce width/height changes to avoid excessive redraws
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Only update if values actually changed
      if (width !== debouncedWidth) {
        setDebouncedWidth(width);
      }
      if (height !== debouncedHeight) {
        setDebouncedHeight(height);
      }
    }, debounceMs) as unknown as number;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [width, height, debounceMs, debouncedWidth, debouncedHeight]);

  // Draw waveform only when debounced dimensions or audioBuffer change
  const drawWaveform = useCallback(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // CRITICAL FIX: Limit canvas size to prevent rendering failures
      // Browser canvas limits: ~32,767px, but practical limit for performance is lower
      const MAX_CANVAS_WIDTH = 4096; // Safe limit for all browsers
      const MAX_WAVEFORM_SAMPLES = 1024; // Maximum samples to process for performance
      
      // Clamp canvas dimensions to safe limits
      const safeCanvasWidth = Math.min(debouncedWidth, MAX_CANVAS_WIDTH);
      const safeCanvasHeight = Math.min(debouncedHeight, 200); // Reasonable height limit
      
      // Set canvas size (this resets the canvas)
      canvas.width = safeCanvasWidth;
      canvas.height = safeCanvasHeight;

      // Clear canvas
      ctx.clearRect(0, 0, safeCanvasWidth, safeCanvasHeight);

      // Get audio data from first channel
      const rawData = audioBuffer.getChannelData(0);
      
      // CRITICAL FIX: Cap samples to prevent excessive processing for long files
      // For a 3-minute file at high zoom, debouncedWidth could be 7,200+ pixels
      // Capping to 1024 samples ensures consistent performance
      const samples = Math.min(debouncedWidth, MAX_WAVEFORM_SAMPLES);
      
      // Calculate block size with minimum threshold for quality
      // Ensure we don't create tiny blocks that lose audio detail
      const minBlockSize = Math.ceil(audioBuffer.sampleRate / 1000); // ~1ms minimum (44 samples at 44.1kHz)
      const calculatedBlockSize = Math.floor(rawData.length / samples);
      const blockSize = Math.max(calculatedBlockSize, minBlockSize);
      
      // Recalculate actual samples based on safe block size
      const actualSamples = Math.min(samples, Math.floor(rawData.length / blockSize));
      const filteredData = [];

      // Downsample the data to match the safe sample count
      for (let i = 0; i < actualSamples; i++) {
        const blockStart = blockSize * i;
        let sum = 0;
        // Ensure we don't read past the end of the buffer
        const blockEnd = Math.min(blockStart + blockSize, rawData.length);
        for (let j = blockStart; j < blockEnd; j++) {
          sum += Math.abs(rawData[j]);
        }
        filteredData.push(sum / (blockEnd - blockStart));
      }

      // Validate we have data to render
      if (filteredData.length === 0) {
        console.warn('No waveform data generated');
        return;
      }

      // Normalize the data
      const max = Math.max(...filteredData, 0.0001); // Avoid division by zero
      const normalizedData = filteredData.map(n => n / max);

      // Draw the waveform - scale to fit canvas width
      ctx.fillStyle = color;
      const middle = safeCanvasHeight / 2;
      const barWidth = safeCanvasWidth / normalizedData.length;

      normalizedData.forEach((value, i) => {
        const barHeight = value * (safeCanvasHeight / 2);
        const x = i * barWidth;

        if (mode === 'mirrored') {
          // Draw mirrored bars (top and bottom)
          ctx.fillRect(x, middle - barHeight, Math.max(barWidth, 1), barHeight * 2);
        } else {
          // Draw top-only bars
          ctx.fillRect(x, safeCanvasHeight - barHeight, Math.max(barWidth, 1), barHeight);
        }
      });
    } catch (error) {
      console.error('Failed to render waveform:', error);
      // Draw error state
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Waveform render error', canvas.width / 2, canvas.height / 2);
    }
  }, [audioBuffer, debouncedWidth, debouncedHeight, color, mode]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

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
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 pointer-events-none opacity-50"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
