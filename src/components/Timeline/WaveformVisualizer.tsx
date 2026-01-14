import React, { useRef, useEffect, useState, useMemo } from 'react';

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  duration: number;
  width: number;
  height?: number;
  color?: string;
  mode?: 'mirrored' | 'top'; // Display mode: mirrored (top & bottom) or top only
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
 */
export default function WaveformVisualizer({
  audioBuffer,
  duration,
  width,
  height = 60,
  color = 'rgba(100, 180, 255, 0.3)',
  mode = 'mirrored'
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  
  // Cache downsampled waveform data
  const waveformData = useMemo(() => {
    if (!audioBuffer) return null;
    
    setIsLoading(true);
    
    try {
      // Get audio data from first channel
      const rawData = audioBuffer.getChannelData(0);
      
      // Cap samples to budget (between MIN_SAMPLES and MAX_SAMPLES)
      const targetSamples = Math.min(
        Math.max(MIN_SAMPLES, Math.floor(width)),
        MAX_SAMPLES
      );
      
      const blockSize = Math.floor(rawData.length / targetSamples);
      const filteredData: number[] = [];
      
      // Downsample by averaging blocks
      for (let i = 0; i < targetSamples; i++) {
        const blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize && blockStart + j < rawData.length; j++) {
          sum += Math.abs(rawData[blockStart + j]);
        }
        filteredData.push(sum / blockSize);
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
    
    // Debounce redraw on width changes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = window.setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw waveform
      ctx.fillStyle = color;
      ctx.beginPath();
      
      const middle = mode === 'top' ? height : height / 2;
      const scaleX = width / waveformData.length;
      
      for (let i = 0; i < waveformData.length; i++) {
        const x = Math.floor(i * scaleX);
        const barWidth = Math.max(1, Math.ceil(scaleX));
        const amplitude = waveformData[i] * middle;
        
        if (mode === 'top') {
          // Draw bars from bottom to top
          ctx.fillRect(x, height - amplitude, barWidth, amplitude);
        } else {
          // Draw mirrored bars (top and bottom)
          ctx.fillRect(x, middle - amplitude, barWidth, amplitude * 2);
        }
      }
      
      debounceTimerRef.current = null;
    }, DEBOUNCE_DELAY_MS);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [waveformData, width, height, color, mode]);

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
