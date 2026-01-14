import React, { useRef, useEffect, useState, useMemo } from 'react';
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  duration: number;
  width: number;
  height?: number;
  color?: string;
  debounceMs?: number; // Debounce time for canvas redraws
}

// Optimization constants
const MIN_SAMPLES = 256;
const MAX_SAMPLES = 4096;
const DEBOUNCE_DELAY_MS = 100;

/**
 * WaveformVisualizer Component - Optimized audio waveform display
 * 
 * Optimizations:
 * - Caps sample count (256-4096) to avoid performance issues with large widths
 * - Debounces redraw on width changes
 * - Caches downsampled waveform data for reuse
 * - Supports top-only or mirrored display modes
 * WaveformVisualizer Component - Displays audio waveform in timeline
 * Renders waveform from audio buffer data with optimized canvas handling
 * 
 * Performance improvements:
 * - Debounced canvas redraws to avoid repeated canvas resets during resize/zoom
 * - Only redraws when audioBuffer or dimensions actually change
 * - Avoids redrawing during scroll (canvas is positioned, not redrawn)
 */
export default function WaveformVisualizer({
  audioBuffer,
  duration,
  width,
  height = 60,
  color = 'rgba(100, 180, 255, 0.3)',
  debounceMs = 150
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

    // Set canvas size (this resets the canvas)
    canvas.width = debouncedWidth;
    canvas.height = debouncedHeight;

    // Clear canvas
    ctx.clearRect(0, 0, debouncedWidth, debouncedHeight);

    // Get audio data from first channel
    const rawData = audioBuffer.getChannelData(0);
    const samples = debouncedWidth; // One sample per pixel
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData = [];

    // Downsample the data to match the width
    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j]);
      }
      
      // Normalize the data
      const max = Math.max(...filteredData, 0.0001); // Avoid division by zero
      const normalizedData = filteredData.map(n => n / max);
      
      setIsLoading(false);
      return normalizedData;
    } catch (error) {
      console.error('Error generating waveform data:', error);
      setIsLoading(false);
      return null;
    }
  }, [audioBuffer, width]); // Recompute when audioBuffer or width changes significantly

  useEffect(() => {
    if (!waveformData || !canvasRef.current) return;
    
    const middle = debouncedHeight / 2;
    
    debounceTimerRef.current = window.setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      
      // Draw mirrored bars (top and bottom)
      ctx.fillRect(x, middle - barHeight, 1, barHeight * 2);
    }
  }, [audioBuffer, debouncedWidth, debouncedHeight, color]);

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
  
  if (isLoading) {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex items-center justify-center bg-gray-800 bg-opacity-50"
      >
        <span className="text-xs text-gray-500">Loading waveform...</span>
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
