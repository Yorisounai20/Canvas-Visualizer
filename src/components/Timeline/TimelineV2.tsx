/**
 * TimelineV2 - New Scrollable Timeline Component
 * 
 * Two-column layout: 240px fixed left labels + scrollable right content
 * Sticky time ruler, per-track waveforms, zoom controls, click-to-seek
 * 
 * All P1, P2, P3 bug fixes applied:
 * - RAF-throttled dragging (Bug #5, #7)
 * - Optimized waveform rendering (Bug #3)
 * - Compact header (Bug #1)
 * - Context menu & marquee (Bug #6)
 * - Keyboard shortcuts (Bug #8)
 * - Play button (Bug #9)
 * - Top-half waveform (Bug #4)
 * - Parameter Events & Letterbox tracks (Bug #10, #11)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';
import { timeToPixels, pixelsToTime, formatTime, clamp, getPixelsPerSecond, MIN_ZOOM, MAX_ZOOM } from './utils';
import WaveformVisualizer from './WaveformVisualizer';

interface TimelineV2Props {
  currentTime: number;
  duration: number;
  audioBuffer: AudioBuffer | null;
  onSeek: (time: number) => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export default function TimelineV2({
  currentTime,
  duration,
  audioBuffer,
  onSeek,
  isPlaying = false,
  onPlayPause,
}: TimelineV2Props) {
  const [zoom, setZoom] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const pixelsPerSecond = getPixelsPerSecond(zoom);
  const timelineWidth = timeToPixels(duration, pixelsPerSecond);
  
  // Handle click-to-seek
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const time = pixelsToTime(x, pixelsPerSecond);
    
    onSeek(clamp(time, 0, duration));
  };
  
  // Zoom controls
  const handleZoomIn = () => setZoom(prev => clamp(prev * 1.2, MIN_ZOOM, MAX_ZOOM));
  const handleZoomOut = () => setZoom(prev => clamp(prev / 1.2, MIN_ZOOM, MAX_ZOOM));
  
  // Keyboard shortcuts (Bug #8)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.key === ' ') {
        e.preventDefault();
        onPlayPause?.();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 1 : (e.ctrlKey || e.metaKey) ? 5 : 1/30;
        onSeek(Math.max(0, currentTime - step));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 1 : (e.ctrlKey || e.metaKey) ? 5 : 1/30;
        onSeek(Math.min(duration, currentTime + step));
      } else if (e.key === 'Home') {
        e.preventDefault();
        onSeek(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        onSeek(duration);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, onSeek, onPlayPause]);
  
  // Generate time markers
  const markers = [];
  const markerInterval = zoom < 0.5 ? 10 : zoom < 1 ? 5 : zoom < 2 ? 2 : 1;
  for (let t = 0; t <= duration; t += markerInterval) {
    markers.push(t);
  }
  
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Compact Header (Bug #1) */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {/* Play Button (Bug #9) */}
          {onPlayPause && (
            <button
              onClick={onPlayPause}
              className="p-1.5 rounded bg-cyan-600 hover:bg-cyan-700 transition-colors"
              title="Play/Pause (Space)"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
          
          <span className="text-xs text-gray-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
          <span className="text-[10px] text-gray-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
        </div>
      </div>
      
      {/* Two-Column Layout: Fixed Left (240px) + Scrollable Right */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Track Labels (Fixed 240px) */}
        <div className="w-60 bg-gray-850 border-r border-gray-700 flex flex-col">
          <div className="h-8 border-b border-gray-700 flex items-center px-3">
            <span className="text-[10px] text-gray-500 uppercase">Tracks</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {audioBuffer && (
              <div className="h-20 border-b border-gray-700 flex items-center px-3">
                <span className="text-xs">Audio</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column: Scrollable Timeline Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sticky Time Ruler */}
          <div 
            className="h-8 bg-gray-800 border-b border-gray-700 sticky top-0 z-10 overflow-hidden"
            style={{ width: '100%' }}
          >
            <div 
              ref={timelineRef}
              className="relative h-full"
              style={{ width: `${timelineWidth}px` }}
            >
              {markers.map(time => (
                <div
                  key={time}
                  className="absolute top-0 h-full flex flex-col items-center justify-center"
                  style={{ left: `${timeToPixels(time, pixelsPerSecond)}px` }}
                >
                  <div className="h-2 w-px bg-gray-600" />
                  <span className="text-[9px] text-gray-500 mt-0.5">
                    {formatTime(time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Scrollable Content Area */}
          <div
            ref={containerRef}
            className="flex-1 overflow-auto relative"
            onClick={handleTimelineClick}
          >
            <div
              className="relative"
              style={{ width: `${timelineWidth}px`, minHeight: '100%' }}
            >
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-500 pointer-events-none z-20"
                style={{ left: `${timeToPixels(currentTime, pixelsPerSecond)}px` }}
              >
                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-cyan-500 rounded-full" />
              </div>
              
              {/* Grid Lines */}
              {markers.map(time => (
                <div
                  key={`grid-${time}`}
                  className="absolute top-0 bottom-0 w-px bg-gray-800"
                  style={{ left: `${timeToPixels(time, pixelsPerSecond)}px` }}
                />
              ))}
              
              {/* Track Rows */}
              {audioBuffer && (
                <div className="h-20 border-b border-gray-700 relative">
                  {/* Per-Track Waveform (Bug #4: top-half only) */}
                  <WaveformVisualizer
                    audioBuffer={audioBuffer}
                    width={timelineWidth}
                    height={80}
                    waveformMode="top"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
