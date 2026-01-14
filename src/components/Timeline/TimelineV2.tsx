/**
 * TimelineV2 - Scrollable Per-Track Timeline
 * 
 * New timeline implementation with:
 * - Two-column layout (fixed left labels, scrollable right content)
 * - Sticky time ruler at top
 * - Per-track waveforms
 * - Horizontal and vertical scrolling
 * - Wheel zoom and pan (to be implemented in PR C)
 */

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Section, AnimationType, PresetKeyframe, CameraKeyframe, TextKeyframe, EnvironmentKeyframe, WorkspaceObject, CameraFXClip } from '../../types';
import WaveformVisualizer from './WaveformVisualizer';
import { 
  BASE_PX_PER_SECOND, 
  MIN_ZOOM, 
  MAX_ZOOM, 
  calculatePixelsPerSecond,
  calculateTimelineWidth,
  formatTime,
  timeToPixels,
  pixelsToTime,
  clampZoom
} from './utils';

// Re-export TimelineProps from original Timeline for compatibility
interface TimelineProps {
  sections: Section[];
  currentTime: number;
  duration: number;
  animationTypes: AnimationType[];
  selectedSectionId: number | null;
  audioBuffer: AudioBuffer | null;
  showWaveform?: boolean;
  presetKeyframes: PresetKeyframe[];
  cameraKeyframes: CameraKeyframe[];
  textKeyframes: TextKeyframe[];
  environmentKeyframes: EnvironmentKeyframe[];
  workspaceObjects?: WorkspaceObject[];
  cameraFXClips?: CameraFXClip[];
  selectedFXClipId?: string | null;
  onSelectSection: (id: number) => void;
  onUpdateSection: (id: number, field: string, value: any) => void;
  onAddSection: () => void;
  onSeek: (time: number) => void;
  onAddPresetKeyframe?: (time: number) => void;
  onAddCameraKeyframe?: (time: number) => void;
  onAddTextKeyframe?: (time: number) => void;
  onAddEnvironmentKeyframe?: (time: number) => void;
  onDeletePresetKeyframe?: (id: number) => void;
  onDeleteCameraKeyframe?: (time: number) => void;
  onDeleteTextKeyframe?: (id: number) => void;
  onDeleteEnvironmentKeyframe?: (id: number) => void;
  onUpdatePresetKeyframe?: (id: number, preset: string) => void;
  onUpdateCameraKeyframe?: (time: number, updates: Partial<CameraKeyframe>) => void;
  onUpdateTextKeyframe?: (id: number, show: boolean, text?: string) => void;
  onUpdateEnvironmentKeyframe?: (id: number, type: string, intensity: number, color?: string) => void;
  onMovePresetKeyframe?: (id: number, newTime: number) => void;
  onMoveTextKeyframe?: (id: number, newTime: number) => void;
  onMoveEnvironmentKeyframe?: (id: number, newTime: number) => void;
  onSelectFXClip?: (id: string) => void;
  onUpdateCameraFXClip?: (id: string, updates: Partial<CameraFXClip>) => void;
  onDeleteCameraFXClip?: (id: string) => void;
  onAddCameraFXClip?: (type: 'grid' | 'kaleidoscope' | 'pip', startTime: number) => void;
}

const LEFT_COLUMN_WIDTH = 240; // Fixed width for track labels
const RULER_HEIGHT = 40; // Height of time ruler
const TRACK_HEIGHT = 80; // Height of each track row
const MIN_TIMELINE_WIDTH = 800; // Minimum width for timeline content

export default function TimelineV2({
  currentTime,
  duration,
  audioBuffer,
  showWaveform = true,
  onSeek,
}: TimelineProps) {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  // Calculate dimensions
  const pixelsPerSecond = useMemo(() => calculatePixelsPerSecond(zoomLevel), [zoomLevel]);
  const timelineWidth = useMemo(
    () => calculateTimelineWidth(duration, zoomLevel, MIN_TIMELINE_WIDTH),
    [duration, zoomLevel]
  );

  // Mock tracks for initial implementation
  // TODO: Replace with actual track data from props in future PRs
  const tracks = useMemo(() => [
    { id: 'audio', name: 'Audio', type: 'audio' as const },
    { id: 'presets', name: 'Presets', type: 'preset' as const },
    { id: 'camera', name: 'Camera', type: 'camera' as const },
    { id: 'text', name: 'Text', type: 'text' as const },
  ], []);

  // Handle wheel zoom (shift+wheel) and scroll (wheel)
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!scrollContainerRef.current) return;

    // Shift+wheel = zoom centered at mouse position
    if (e.shiftKey) {
      e.preventDefault();
      
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + container.scrollLeft;
      
      // Calculate time position under mouse before zoom
      const timeUnderMouse = pixelsToTime(mouseX, pixelsPerSecond);
      
      // Calculate new zoom level
      const zoomDelta = -e.deltaY * 0.001; // Adjust sensitivity
      const newZoom = clampZoom(zoomLevel + zoomDelta);
      
      if (newZoom !== zoomLevel) {
        setZoomLevel(newZoom);
        
        // After zoom, calculate new pixel position for the same time
        // and adjust scroll to keep that time under the mouse
        requestAnimationFrame(() => {
          const newPixelsPerSecond = calculatePixelsPerSecond(newZoom);
          const newMouseX = timeToPixels(timeUnderMouse, newPixelsPerSecond);
          const mouseOffsetInViewport = e.clientX - rect.left;
          container.scrollLeft = newMouseX - mouseOffsetInViewport;
        });
      }
    } else {
      // Normal wheel = horizontal scroll
      // Let browser handle this naturally, but we could customize if needed
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  }, [zoomLevel, pixelsPerSecond]);

  // Handle right-click pan start
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Right-click (button 2) = pan
    if (e.button === 2 && scrollContainerRef.current) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
      };
      document.body.style.cursor = 'grabbing';
    }
  }, []);

  // Handle pan move and end at document level
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning && panStartRef.current && scrollContainerRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        
        scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
        scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        panStartRef.current = null;
        document.body.style.cursor = '';
      }
    };

    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  // Attach wheel listener to scroll container
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle when timeline area has focus
    if (!scrollContainerRef.current?.contains(document.activeElement)) return;

    const DEFAULT_FPS = 30;
    const frameTime = 1 / DEFAULT_FPS;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd+Left = -5 seconds
          onSeek(Math.max(0, currentTime - 5));
        } else if (e.shiftKey) {
          // Shift+Left = -1 second
          onSeek(Math.max(0, currentTime - 1));
        } else {
          // Left = -1 frame
          onSeek(Math.max(0, currentTime - frameTime));
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd+Right = +5 seconds
          onSeek(Math.min(duration, currentTime + 5));
        } else if (e.shiftKey) {
          // Shift+Right = +1 second
          onSeek(Math.min(duration, currentTime + 1));
        } else {
          // Right = +1 frame
          onSeek(Math.min(duration, currentTime + frameTime));
        }
        break;

      case 'Home':
        e.preventDefault();
        onSeek(0);
        break;

      case 'End':
        e.preventDefault();
        onSeek(duration);
        break;

      case 'PageUp':
        e.preventDefault();
        // Jump backward by visible viewport width (in time)
        if (scrollContainerRef.current) {
          const viewportWidth = scrollContainerRef.current.clientWidth;
          const viewportTime = pixelsToTime(viewportWidth, pixelsPerSecond);
          onSeek(Math.max(0, currentTime - viewportTime));
        }
        break;

      case 'PageDown':
        e.preventDefault();
        // Jump forward by visible viewport width (in time)
        if (scrollContainerRef.current) {
          const viewportWidth = scrollContainerRef.current.clientWidth;
          const viewportTime = pixelsToTime(viewportWidth, pixelsPerSecond);
          onSeek(Math.min(duration, currentTime + viewportTime));
        }
        break;
    }
  }, [currentTime, duration, onSeek, pixelsPerSecond]);

  // Attach keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const playheadPixelX = timeToPixels(currentTime, pixelsPerSecond);
    const scrollLeft = container.scrollLeft;
    const viewportWidth = container.clientWidth;
    
    // If playhead is off-screen to the left
    if (playheadPixelX < scrollLeft) {
      container.scrollLeft = playheadPixelX - 50; // 50px padding
    }
    // If playhead is off-screen to the right
    else if (playheadPixelX > scrollLeft + viewportWidth) {
      container.scrollLeft = playheadPixelX - viewportWidth + 50; // 50px padding
    }
  }, [currentTime, pixelsPerSecond]);

  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't seek if we were panning
    if (isPanning) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelsToTime(x, pixelsPerSecond);
    onSeek(Math.max(0, Math.min(duration, time)));
  };

  // Render time ruler markers
  const renderRulerMarkers = () => {
    const markers: JSX.Element[] = [];
    const secondsInterval = zoomLevel < 0.5 ? 10 : zoomLevel < 1 ? 5 : 1;
    
    for (let time = 0; time <= duration; time += secondsInterval) {
      const x = timeToPixels(time, pixelsPerSecond);
      markers.push(
        <div
          key={time}
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: `${x}px` }}
        >
          <div className="w-px h-2 bg-gray-500" />
          <span className="text-xs text-gray-400 mt-1">
            {formatTime(time)}
          </span>
        </div>
      );
    }
    
    return markers;
  };

  // Render playhead
  const playheadX = timeToPixels(currentTime, pixelsPerSecond);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header with zoom controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Zoom:</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.25}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="text-xs text-gray-400">{zoomLevel.toFixed(2)}x</span>
          <button
            onClick={() => setZoomLevel(1.0)}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            Reset
          </button>
          <span className="text-xs text-gray-500 ml-4">
            💡 Shift+Wheel=Zoom, Right-click=Pan, Arrows=Step
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Main timeline area - two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column - Fixed track labels */}
        <div 
          className="flex-shrink-0 bg-gray-800 border-r border-gray-700 overflow-y-auto"
          style={{ width: `${LEFT_COLUMN_WIDTH}px` }}
        >
          {/* Spacer for ruler */}
          <div 
            className="border-b border-gray-700"
            style={{ height: `${RULER_HEIGHT}px` }}
          />
          
          {/* Track labels */}
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center px-4 border-b border-gray-700"
              style={{ height: `${TRACK_HEIGHT}px` }}
            >
              <span className="text-sm font-medium">{track.name}</span>
            </div>
          ))}
        </div>

        {/* Right column - Scrollable timeline content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative focus:outline-none focus:ring-2 focus:ring-cyan-500"
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          style={{ cursor: isPanning ? 'grabbing' : 'default' }}
          tabIndex={0}
          role="region"
          aria-label="Timeline content"
        >
          {/* Sticky ruler at top */}
          <div
            className="sticky top-0 z-20 bg-gray-800 border-b border-gray-700"
            style={{ 
              height: `${RULER_HEIGHT}px`,
              width: `${timelineWidth}px`
            }}
          >
            <div className="relative h-full">
              {renderRulerMarkers()}
            </div>
          </div>

          {/* Timeline content container */}
          <div
            className="relative"
            style={{ 
              width: `${timelineWidth}px`,
              minHeight: `${tracks.length * TRACK_HEIGHT}px`
            }}
            onClick={handleTimelineClick}
          >
            {/* Track rows */}
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="relative border-b border-gray-700"
                style={{ height: `${TRACK_HEIGHT}px` }}
              >
                {/* Waveform for audio track */}
                {track.type === 'audio' && showWaveform && audioBuffer && (
                  <WaveformVisualizer
                    audioBuffer={audioBuffer}
                    duration={duration}
                    width={timelineWidth}
                    height={TRACK_HEIGHT}
                    color="rgba(100, 180, 255, 0.3)"
                  />
                )}

                {/* Grid lines for visual reference */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: Math.ceil(duration) }).map((_, i) => {
                    const x = timeToPixels(i, pixelsPerSecond);
                    return (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-gray-700 opacity-30"
                        style={{ left: `${x}px` }}
                      />
                    );
                  })}
                </div>

                {/* TODO: Render keyframes/clips for this track (PR C) */}
              </div>
            ))}

            {/* Playhead - spans all tracks */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
              style={{ left: `${playheadX}px` }}
            >
              <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
