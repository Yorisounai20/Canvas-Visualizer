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
  presetKeyframes = [],
  cameraKeyframes = [],
  textKeyframes = [],
  environmentKeyframes = [],
}: TimelineProps) {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  
  // Playhead dragging state
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  
  // Keyframe dragging state
  const [isDraggingKeyframe, setIsDraggingKeyframe] = useState(false);
  const [draggedKeyframe, setDraggedKeyframe] = useState<{
    trackType: string;
    keyframeId: string;
    originalTime: number;
    currentTime: number;
  } | null>(null);
  
  // Track collapse state (Chunk 6.1)
  const [collapsedTracks, setCollapsedTracks] = useState<Set<string>>(new Set());
  
  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectedKeyframes, setSelectedKeyframes] = useState<Set<string>>(new Set());
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    trackType: string;
    keyframeId: string;
    time: number;
  } | null>(null);

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
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Shift+right-click = marquee selection
    if (e.button === 2 && e.shiftKey) {
      e.preventDefault();
      setIsMarqueeSelecting(true);
      const x = e.clientX - rect.left + container.scrollLeft;
      const y = e.clientY - rect.top + container.scrollTop;
      setMarqueeStart({ x, y });
      setMarqueeEnd({ x, y });
      document.body.style.cursor = 'crosshair';
    }
    // Right-click (button 2) without shift = pan
    else if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };
      document.body.style.cursor = 'grabbing';
    }
  }, []);

  // Handle pan move and end at document level
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      if (isPanning && panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        
        container.scrollLeft = panStartRef.current.scrollLeft - dx;
        container.scrollTop = panStartRef.current.scrollTop - dy;
      } else if (isMarqueeSelecting && marqueeStart) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left + container.scrollLeft;
        const y = e.clientY - rect.top + container.scrollTop;
        setMarqueeEnd({ x, y });
      } else if (isDraggingPlayhead) {
        // Smooth playhead dragging with RAF throttling
        requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left + container.scrollLeft;
          const time = pixelsToTime(x, pixelsPerSecond);
          onSeek(Math.max(0, Math.min(duration, time)));
        });
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        panStartRef.current = null;
        document.body.style.cursor = '';
      } else if (isMarqueeSelecting) {
        // Finalize marquee selection
        setIsMarqueeSelecting(false);
        setMarqueeStart(null);
        setMarqueeEnd(null);
        document.body.style.cursor = '';
        
        // TODO: Implement keyframe selection logic based on marquee rectangle
        // This will be implemented when we add keyframe interaction handlers
      } else if (isDraggingPlayhead) {
        setIsDraggingPlayhead(false);
        document.body.style.cursor = '';
      }
    };

    if (isPanning || isMarqueeSelecting || isDraggingPlayhead) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, isMarqueeSelecting, isDraggingPlayhead, marqueeStart, pixelsPerSecond, duration, onSeek]);

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
    // Don't seek if we were panning or dragging playhead
    if (isPanning || isDraggingPlayhead) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelsToTime(x, pixelsPerSecond);
    onSeek(Math.max(0, Math.min(duration, time)));
  };
  
  // Handle track collapse/expand toggle (Chunk 6.1)
  const toggleTrackCollapse = useCallback((trackId: string) => {
    setCollapsedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  }, []);

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

  // Render keyframes for a track
  const renderKeyframes = (trackType: 'preset' | 'camera' | 'text' | 'environment') => {
    type KeyframeWithTime = PresetKeyframe | CameraKeyframe | TextKeyframe | EnvironmentKeyframe;
    let keyframes: KeyframeWithTime[] = [];
    let color = '';
    
    switch (trackType) {
      case 'preset':
        keyframes = presetKeyframes;
        color = 'bg-cyan-500';
        break;
      case 'camera':
        keyframes = cameraKeyframes;
        color = 'bg-purple-500';
        break;
      case 'text':
        keyframes = textKeyframes;
        color = 'bg-green-500';
        break;
      case 'environment':
        keyframes = environmentKeyframes;
        color = 'bg-orange-500';
        break;
    }
    
    return keyframes.map((kf, idx) => {
      const time = 'time' in kf ? kf.time : 0;
      const keyId = 'id' in kf && kf.id ? kf.id : `${trackType}-${time}-${idx}`;
      const fullKeyId = `${trackType}-${keyId}`;
      const isSelected = selectedKeyframes.has(fullKeyId);
      const isDragging = isDraggingKeyframe && draggedKeyframe?.keyframeId === fullKeyId;
      const displayTime = isDragging && draggedKeyframe ? draggedKeyframe.currentTime : time;
      const x = timeToPixels(displayTime, pixelsPerSecond);
      
      const handleKeyframeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Left click only - right click handled by onContextMenu
        if (e.button !== 0) return;
        
        let hasMoved = false;
        const startX = e.clientX;
        const startY = e.clientY;
        
        setIsDraggingKeyframe(true);
        setDraggedKeyframe({
          trackType,
          keyframeId: fullKeyId,
          originalTime: time,
          currentTime: time,
        });
        
        const handleMouseMove = (moveE: MouseEvent) => {
          if (!scrollContainerRef.current) return;
          
          // Check if mouse moved enough to consider it a drag (>3px)
          const dx = Math.abs(moveE.clientX - startX);
          const dy = Math.abs(moveE.clientY - startY);
          if (dx > 3 || dy > 3) {
            hasMoved = true;
          }
          
          requestAnimationFrame(() => {
            const rect = scrollContainerRef.current!.getBoundingClientRect();
            const scrollLeft = scrollContainerRef.current!.scrollLeft;
            const relativeX = moveE.clientX - rect.left + scrollLeft;
            let newTime = pixelsToTime(relativeX, pixelsPerSecond);
            
            // Clamp to valid range
            newTime = Math.max(0, Math.min(duration, newTime));
            
            // Round to nearest frame (30fps default)
            newTime = Math.round(newTime * 30) / 30;
            
            setDraggedKeyframe(prev => prev ? { ...prev, currentTime: newTime } : null);
          });
        };
        
        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = '';
          
          if (!hasMoved) {
            // This was a click, not a drag - select the keyframe
            console.log(`Selected keyframe: ${fullKeyId} at ${formatTime(time)}`);
            // TODO: Open inspector panel and focus on this keyframe
            setSelectedKeyframes(new Set([fullKeyId]));
          } else if (draggedKeyframe && draggedKeyframe.currentTime !== draggedKeyframe.originalTime) {
            // This was a drag - move the keyframe
            console.log(`Move keyframe ${fullKeyId} from ${draggedKeyframe.originalTime} to ${draggedKeyframe.currentTime}`);
            // TODO: Call appropriate onMove callback based on track type
          }
          
          setIsDraggingKeyframe(false);
          setDraggedKeyframe(null);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'grabbing';
      };
      
      const handleKeyframeContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          trackType,
          keyframeId: fullKeyId,
          time,
        });
      };
      
      return (
        <div
          key={fullKeyId}
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${color} ${
            isSelected || isDragging ? 'ring-2 ring-white' : ''
          } hover:scale-125 transition-transform ${isDragging ? 'z-50 cursor-grabbing' : 'cursor-grab'}`}
          style={{ 
            left: `${x}px`, 
            marginLeft: '-6px',
            opacity: isDragging ? 1 : isSelected ? 0.9 : 0.8,
          }}
          title={`${trackType} keyframe at ${formatTime(displayTime)}`}
          onMouseDown={handleKeyframeMouseDown}
          onContextMenu={handleKeyframeContextMenu}
        />
      );
    });
  };

  // Render marquee selection rectangle
  const renderMarquee = () => {
    if (!isMarqueeSelecting || !marqueeStart || !marqueeEnd) return null;
    
    const left = Math.min(marqueeStart.x, marqueeEnd.x);
    const top = Math.min(marqueeStart.y, marqueeEnd.y);
    const width = Math.abs(marqueeEnd.x - marqueeStart.x);
    const height = Math.abs(marqueeEnd.y - marqueeStart.y);
    
    return (
      <div
        className="absolute border-2 border-cyan-500 bg-cyan-500 bg-opacity-20 pointer-events-none z-30"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    );
  };

  // Render playhead
  const playheadX = timeToPixels(currentTime, pixelsPerSecond);

  // Handle context menu actions
  const handleContextMenuAction = (action: 'copy' | 'delete' | 'duplicate') => {
    if (!contextMenu) return;
    
    const { trackType, keyframeId, time } = contextMenu;
    console.log(`${action} keyframe: ${keyframeId} at ${formatTime(time)}`);
    
    // TODO: Implement actual actions based on track type
    // For now, just log the action
    
    setContextMenu(null);
  };
  
  // Close context menu on click away
  useEffect(() => {
    if (!contextMenu) return;
    
    const handleClickAway = () => setContextMenu(null);
    document.addEventListener('click', handleClickAway);
    return () => document.removeEventListener('click', handleClickAway);
  }, [contextMenu]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white" onClick={() => setContextMenu(null)}>
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
            💡 Shift+Wheel=Zoom, Right-click=Pan, Shift+Right-click=Select, Arrows=Step
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
          {tracks.map((track) => {
            const isCollapsed = collapsedTracks.has(track.id);
            return (
              <div
                key={track.id}
                className="flex items-center px-2 border-b border-gray-700"
                style={{ height: `${TRACK_HEIGHT}px` }}
              >
                {/* Collapse/expand button */}
                <button
                  onClick={() => toggleTrackCollapse(track.id)}
                  className="p-1 hover:bg-gray-700 rounded mr-2 text-gray-400 hover:text-gray-200"
                  title={isCollapsed ? "Expand track" : "Collapse track"}
                >
                  {isCollapsed ? '▶' : '▼'}
                </button>
                <span className="text-sm font-medium">{track.name}</span>
              </div>
            );
          })}
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
            {tracks.map((track, index) => {
              const isCollapsed = collapsedTracks.has(track.id);
              return (
                <div
                  key={track.id}
                  className="relative border-b border-gray-700 overflow-hidden transition-all"
                  style={{ height: isCollapsed ? '40px' : `${TRACK_HEIGHT}px` }}
                >
                  {/* Only render track content if not collapsed */}
                  {!isCollapsed && (
                    <>
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

                      {/* Render keyframes for this track */}
                      {track.type === 'preset' && renderKeyframes('preset')}
                      {track.type === 'camera' && renderKeyframes('camera')}
                      {track.type === 'text' && renderKeyframes('text')}
                      {track.type === 'environment' && (
                        <div className="absolute inset-0">
                          {renderKeyframes('environment')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Playhead - spans all tracks */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${playheadX}px`, pointerEvents: 'none' }}
            >
              {/* Playhead handle - draggable */}
              <div 
                className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full cursor-grab hover:scale-125 transition-transform"
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsDraggingPlayhead(true);
                  document.body.style.cursor = 'grabbing';
                }}
                title="Drag to scrub timeline"
              />
            </div>
            
            {/* Marquee selection rectangle */}
            {renderMarquee()}
          </div>
        </div>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
            onClick={() => handleContextMenuAction('copy')}
          >
            <span>📋</span> Copy Keyframe
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
            onClick={() => handleContextMenuAction('duplicate')}
          >
            <span>➕</span> Duplicate
          </button>
          <div className="border-t border-gray-700 my-1" />
          <button
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
            onClick={() => handleContextMenuAction('delete')}
          >
            <span>🗑️</span> Delete
          </button>
        </div>
      )}
    </div>
  );
}
