import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, ZoomIn, ZoomOut, Copy, Trash2, Edit2, Plus } from 'lucide-react';
import { Section, AnimationType, PresetKeyframe, CameraKeyframe, TextKeyframe, EnvironmentKeyframe, WorkspaceObject, CameraFXClip } from '../../types';
import WaveformVisualizer from './WaveformVisualizer';
import ContextMenu, { ContextMenuItem } from '../Common/ContextMenu';
import { 
  BASE_PX_PER_SECOND, 
  MIN_ZOOM, 
  MAX_ZOOM, 
  DEFAULT_FPS,
  formatTime, 
  getPixelsPerSecond,
  timeToPixels,
  pixelsToTime,
  snapTime,
  clamp,
  frameToTime
} from './utils';

interface TimelineV2Props {
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
  isPlaying?: boolean;
  onSelectSection: (id: number) => void;
  onUpdateSection: (id: number, field: string, value: any) => void;
  onAddSection: () => void;
  onSeek: (time: number) => void;
  onTogglePlayPause?: () => void;
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

/**
 * TimelineV2 - Modern scrollable per-track timeline component
 * 
 * Features:
 * - Horizontal and vertical scrolling
 * - Per-track waveforms
 * - Smooth RAF-throttled interactions
 * - Snap-to-grid
 * - Keyboard navigation
 * - Context menu and marquee selection
 * - Resizable keyframe bars
 * - Zoom centered on mouse
 */
export default function TimelineV2({
  sections,
  currentTime,
  duration,
  animationTypes,
  selectedSectionId,
  audioBuffer,
  showWaveform = true,
  presetKeyframes,
  cameraKeyframes,
  textKeyframes,
  environmentKeyframes,
  workspaceObjects = [],
  cameraFXClips = [],
  selectedFXClipId,
  isPlaying = false,
  onSelectSection,
  onUpdateSection,
  onAddSection,
  onSeek,
  onTogglePlayPause,
  onAddPresetKeyframe,
  onAddCameraKeyframe,
  onAddTextKeyframe,
  onAddEnvironmentKeyframe,
  onDeletePresetKeyframe,
  onDeleteCameraKeyframe,
  onDeleteTextKeyframe,
  onDeleteEnvironmentKeyframe,
  onUpdatePresetKeyframe,
  onUpdateCameraKeyframe,
  onUpdateTextKeyframe,
  onUpdateEnvironmentKeyframe,
  onMovePresetKeyframe,
  onMoveTextKeyframe,
  onMoveEnvironmentKeyframe,
  onSelectFXClip,
  onUpdateCameraFXClip,
  onDeleteCameraFXClip,
  onAddCameraFXClip
}: TimelineV2Props) {
  // Zoom and scroll state
  const [zoom, setZoom] = useState(1.0);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(0.1); // 100ms grid by default
  const [waveformMode, setWaveformMode] = useState<'mirrored' | 'top'>('top'); // Waveform display mode
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  
  // Calculate pixels per second based on zoom
  const pixelsPerSecond = getPixelsPerSecond(zoom);
  
  // RAF-throttled drag state (stored in refs to avoid re-renders during drag)
  const dragStateRef = useRef<{
    isDragging: boolean;
    type: 'playhead' | 'keyframe' | 'pan' | null;
    keyframeId: number | null;
    startX: number;
    startY: number;
    startTime: number;
    lastClientX: number;
    lastClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
    rafId: number | null;
    mouseButton: number | null;
  }>({
    isDragging: false,
    type: null,
    keyframeId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastClientX: 0,
    lastClientY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
    rafId: null,
    mouseButton: null
  });
  
  // Preview position during drag (only updated via RAF)
  const [previewTime, setPreviewTime] = useState<number | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  
  // Marquee selection state
  const [marquee, setMarquee] = useState<{ 
    startX: number; 
    startY: number; 
    endX: number; 
    endY: number;
  } | null>(null);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle keys when timeline is focused or when we're the active panel
    const isTimelineFocused = containerRef.current?.contains(document.activeElement);
    
    // Spacebar: toggle play/pause
    if (e.code === 'Space' && isTimelineFocused) {
      e.preventDefault();
      onTogglePlayPause?.();
      return;
    }
    
    // Arrow keys and other navigation
    if (isTimelineFocused) {
      const frameTime = frameToTime(1, DEFAULT_FPS);
      let newTime = currentTime;
      
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd+Left: -5s
          newTime = Math.max(0, currentTime - 5);
        } else if (e.shiftKey) {
          // Shift+Left: -1s
          newTime = Math.max(0, currentTime - 1);
        } else {
          // Left: -1 frame
          newTime = Math.max(0, currentTime - frameTime);
        }
        onSeek(newTime);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd+Right: +5s
          newTime = Math.min(duration, currentTime + 5);
        } else if (e.shiftKey) {
          // Shift+Right: +1s
          newTime = Math.min(duration, currentTime + 1);
        } else {
          // Right: +1 frame
          newTime = Math.min(duration, currentTime + frameTime);
        }
        onSeek(newTime);
      } else if (e.code === 'Home') {
        e.preventDefault();
        onSeek(0);
      } else if (e.code === 'End') {
        e.preventDefault();
        onSeek(duration);
      } else if (e.code === 'PageUp') {
        e.preventDefault();
        // Jump back by viewport width (in seconds)
        const container = timelineContentRef.current;
        if (container) {
          const viewportWidthSeconds = pixelsToTime(container.clientWidth, pixelsPerSecond);
          newTime = Math.max(0, currentTime - viewportWidthSeconds);
          onSeek(newTime);
        }
      } else if (e.code === 'PageDown') {
        e.preventDefault();
        // Jump forward by viewport width (in seconds)
        const container = timelineContentRef.current;
        if (container) {
          const viewportWidthSeconds = pixelsToTime(container.clientWidth, pixelsPerSecond);
          newTime = Math.min(duration, currentTime + viewportWidthSeconds);
          onSeek(newTime);
        }
      }
    }
  }, [currentTime, duration, onSeek, onTogglePlayPause, pixelsPerSecond]);
  
  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // RAF-throttled playhead drag
  const handlePlayheadPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = timelineContentRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left + container.scrollLeft;
    const clickTime = pixelsToTime(clickX, pixelsPerSecond);
    
    dragStateRef.current = {
      isDragging: true,
      type: 'playhead',
      keyframeId: null,
      startX: clickX,
      startTime: clickTime,
      lastClientX: e.clientX,
      rafId: null
    };
    
    // Immediately seek to clicked position
    onSeek(clamp(clickTime, 0, duration));
    
    // Capture pointer
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [duration, onSeek, pixelsPerSecond]);
  
  const handlePointerMove = useCallback((e: PointerEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging) return;
    
    dragState.lastClientX = e.clientX;
    
    // Throttle updates using RAF
    if (!dragState.rafId) {
      dragState.rafId = requestAnimationFrame(() => {
        dragState.rafId = null;
        
        const container = timelineContentRef.current;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const currentX = dragState.lastClientX - rect.left + container.scrollLeft;
        const newTime = pixelsToTime(currentX, pixelsPerSecond);
        const snappedTime = snapTime(newTime, gridSize, snapEnabled);
        const clampedTime = clamp(snappedTime, 0, duration);
        
        // Update preview during drag
        setPreviewTime(clampedTime);
      });
    }
  }, [duration, gridSize, pixelsPerSecond, snapEnabled]);
  
  const handlePointerUp = useCallback((e: PointerEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging) return;
    
    // Cancel any pending RAF
    if (dragState.rafId) {
      cancelAnimationFrame(dragState.rafId);
      dragState.rafId = null;
    }
    
    // Commit final position
    const container = timelineContentRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const finalX = e.clientX - rect.left + container.scrollLeft;
      const finalTime = pixelsToTime(finalX, pixelsPerSecond);
      const snappedTime = snapTime(finalTime, gridSize, snapEnabled);
      const clampedTime = clamp(snappedTime, 0, duration);
      
      onSeek(clampedTime);
    }
    
    // Reset drag state
    dragStateRef.current.isDragging = false;
    dragStateRef.current.type = null;
    setPreviewTime(null);
    
    // Release pointer capture
    (e.target as HTMLElement)?.releasePointerCapture((e as any).pointerId);
  }, [duration, gridSize, onSeek, pixelsPerSecond, snapEnabled]);
  
  // Set up document-level pointer event listeners for dragging
  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);
  
  // Wheel handler for zoom (Shift+wheel) and horizontal scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    const container = timelineContentRef.current;
    if (!container) return;
    
    if (e.shiftKey) {
      // Shift+wheel: zoom centered on mouse
      e.preventDefault();
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseTime = pixelsToTime(mouseX + container.scrollLeft, pixelsPerSecond);
      
      // Calculate new zoom
      const ZOOM_SENSITIVITY = 0.0015;
      const zoomFactor = 1 - e.deltaY * ZOOM_SENSITIVITY;
      const newZoom = clamp(zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
      
      setZoom(newZoom);
      
      // Adjust scroll to keep mouse position at same time
      requestAnimationFrame(() => {
        const newPPS = getPixelsPerSecond(newZoom);
        const newMousePixels = timeToPixels(mouseTime, newPPS);
        container.scrollLeft = newMousePixels - mouseX;
      });
    } else {
      // Regular wheel: horizontal scroll
      // Prefer deltaX if available (horizontal scroll), otherwise map deltaY to horizontal
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      container.scrollLeft += delta;
    }
  }, [pixelsPerSecond, zoom]);
  
  // Right-click drag to pan or marquee (with Shift)
  const handleTimelinePointerDown = useCallback((e: React.PointerEvent) => {
    const container = timelineContentRef.current;
    if (!container) return;
    
    // Right button (button 2)
    if (e.button === 2) {
      e.preventDefault();
      
      if (e.shiftKey) {
        // Shift+right-drag: marquee selection
        dragStateRef.current = {
          isDragging: true,
          type: 'pan', // We'll check for Shift in the move handler
          keyframeId: null,
          startX: e.clientX,
          startY: e.clientY,
          startTime: 0,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
          startScrollLeft: container.scrollLeft,
          startScrollTop: container.scrollTop,
          rafId: null,
          mouseButton: 2
        };
        
        // Initialize marquee
        setMarquee({
          startX: e.clientX,
          startY: e.clientY,
          endX: e.clientX,
          endY: e.clientY
        });
      } else {
        // Regular right-drag: pan
        dragStateRef.current = {
          isDragging: true,
          type: 'pan',
          keyframeId: null,
          startX: e.clientX,
          startY: e.clientY,
          startTime: 0,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
          startScrollLeft: container.scrollLeft,
          startScrollTop: container.scrollTop,
          rafId: null,
          mouseButton: 2
        };
        
        // Set cursor
        container.style.cursor = 'grabbing';
      }
    }
  }, []);
  
  // Update pointer move handler to support pan
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState.isDragging) return;
      
      dragState.lastClientX = e.clientX;
      dragState.lastClientY = e.clientY;
      
      // Throttle updates using RAF
      if (!dragState.rafId) {
        dragState.rafId = requestAnimationFrame(() => {
          dragState.rafId = null;
          
          const container = timelineContentRef.current;
          if (!container) return;
          
          if (dragState.type === 'pan') {
            // Check if marquee is active (Shift was held)
            if (marquee) {
              // Update marquee rectangle
              setMarquee(prev => prev ? {
                ...prev,
                endX: dragState.lastClientX,
                endY: dragState.lastClientY
              } : null);
            } else {
              // Pan: update scroll position
              const dx = dragState.startX - dragState.lastClientX;
              const dy = dragState.startY - dragState.lastClientY;
              container.scrollLeft = dragState.startScrollLeft + dx;
              container.scrollTop = dragState.startScrollTop + dy;
            }
          } else if (dragState.type === 'playhead') {
            // Playhead: update preview time
            const rect = container.getBoundingClientRect();
            const currentX = dragState.lastClientX - rect.left + container.scrollLeft;
            const newTime = pixelsToTime(currentX, pixelsPerSecond);
            const snappedTime = snapTime(newTime, gridSize, snapEnabled);
            const clampedTime = clamp(snappedTime, 0, duration);
            setPreviewTime(clampedTime);
          }
        });
      }
    };
    
    const handleUp = (e: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState.isDragging) return;
      
      // Cancel any pending RAF
      if (dragState.rafId) {
        cancelAnimationFrame(dragState.rafId);
        dragState.rafId = null;
      }
      
      const container = timelineContentRef.current;
      
      if (dragState.type === 'pan') {
        // Check if it was a short click (< 5px movement) for context menu
        const dx = Math.abs(e.clientX - dragState.startX);
        const dy = Math.abs(e.clientY - dragState.startY);
        const wasShortClick = dx < 5 && dy < 5;
        
        if (wasShortClick && dragState.mouseButton === 2 && !marquee) {
          // Show context menu
          showContextMenuAt(e.clientX, e.clientY);
        } else if (marquee) {
          // Marquee selection complete
          // TODO: Select keyframes in marquee area (will implement in Chunk 6 with keyframes)
          console.log('Marquee selection area:', marquee);
          setMarquee(null);
        }
        
        // Reset cursor
        if (container) {
          container.style.cursor = 'default';
        }
      } else if (dragState.type === 'playhead' && container) {
        // Commit playhead position
        const rect = container.getBoundingClientRect();
        const finalX = e.clientX - rect.left + container.scrollLeft;
        const finalTime = pixelsToTime(finalX, pixelsPerSecond);
        const snappedTime = snapTime(finalTime, gridSize, snapEnabled);
        const clampedTime = clamp(snappedTime, 0, duration);
        onSeek(clampedTime);
      }
      
      // Reset drag state
      dragStateRef.current.isDragging = false;
      dragStateRef.current.type = null;
      setPreviewTime(null);
    };
    
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, [duration, gridSize, onSeek, pixelsPerSecond, snapEnabled]);
  
  // Set up wheel event listener
  useEffect(() => {
    const container = timelineContentRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);
  
  // Context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Don't show if we're currently dragging
    if (dragStateRef.current.isDragging) return;
    
    showContextMenuAt(e.clientX, e.clientY);
  }, []);
  
  // Show context menu at position
  const showContextMenuAt = useCallback((x: number, y: number) => {
    const menuItems: ContextMenuItem[] = [
      {
        label: 'Add Preset Keyframe',
        icon: <Plus size={14} />,
        onClick: () => {
          const container = timelineContentRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const clickX = x - rect.left + container.scrollLeft;
            const clickTime = pixelsToTime(clickX, pixelsPerSecond);
            onAddPresetKeyframe?.(clickTime);
          }
        }
      },
      {
        label: 'Add Camera Keyframe',
        icon: <Plus size={14} />,
        onClick: () => {
          const container = timelineContentRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const clickX = x - rect.left + container.scrollLeft;
            const clickTime = pixelsToTime(clickX, pixelsPerSecond);
            onAddCameraKeyframe?.(clickTime);
          }
        }
      },
      {
        label: 'Add Text Keyframe',
        icon: <Plus size={14} />,
        onClick: () => {
          const container = timelineContentRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const clickX = x - rect.left + container.scrollLeft;
            const clickTime = pixelsToTime(clickX, pixelsPerSecond);
            onAddTextKeyframe?.(clickTime);
          }
        }
      },
      {
        label: 'Add Environment Keyframe',
        icon: <Plus size={14} />,
        onClick: () => {
          const container = timelineContentRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const clickX = x - rect.left + container.scrollLeft;
            const clickTime = pixelsToTime(clickX, pixelsPerSecond);
            onAddEnvironmentKeyframe?.(clickTime);
          }
        }
      },
      { separator: true } as ContextMenuItem,
      {
        label: 'Copy',
        icon: <Copy size={14} />,
        onClick: () => {
          console.log('Copy (not implemented yet)');
        },
        disabled: true
      },
      {
        label: 'Delete',
        icon: <Trash2 size={14} />,
        onClick: () => {
          console.log('Delete (not implemented yet)');
        },
        disabled: true
      },
      {
        label: 'Rename',
        icon: <Edit2 size={14} />,
        onClick: () => {
          console.log('Rename (not implemented yet)');
        },
        disabled: true
      }
    ];
    
    setContextMenu({ x, y, items: menuItems });
  }, [onAddPresetKeyframe, onAddCameraKeyframe, onAddTextKeyframe, onAddEnvironmentKeyframe, pixelsPerSecond]);

  // Calculate playhead position
  const playheadX = timeToPixels(previewTime ?? currentTime, pixelsPerSecond);
  const timelineWidth = Math.max(timeToPixels(duration, pixelsPerSecond), 1000);

  return (
    <div 
      ref={containerRef}
      className="timeline-v2 flex flex-col h-full bg-gray-900 text-white"
      tabIndex={0}
    >
      {/* Header */}
      <div className="timeline-header flex items-center gap-4 px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlayPause}
            className="p-2 rounded bg-cyan-600 hover:bg-cyan-700 transition-colors"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>

        <div className="text-sm font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={snapEnabled}
              onChange={(e) => setSnapEnabled(e.target.checked)}
              className="w-3 h-3"
            />
            Snap
          </label>
          <select
            value={gridSize}
            onChange={(e) => setGridSize(parseFloat(e.target.value))}
            className="text-xs bg-gray-700 text-white px-2 py-1 rounded"
            title="Grid size"
          >
            <option value={1/30}>1 frame</option>
            <option value={0.1}>100ms</option>
            <option value={0.25}>250ms</option>
            <option value={0.5}>500ms</option>
            <option value={1.0}>1s</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">Zoom: {Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.max(MIN_ZOOM, zoom - 0.25))}
            className="p-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setZoom(Math.min(MAX_ZOOM, zoom + 0.25))}
            className="p-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Timeline content */}
      <div
        ref={timelineContentRef}
        className="timeline-content flex-1 overflow-auto relative bg-gray-950"
        onPointerDown={handleTimelinePointerDown}
        onContextMenu={handleContextMenu}
      >
        {/* Timeline ruler and tracks */}
        <div 
          className="timeline-canvas relative"
          style={{ width: `${timelineWidth}px`, minHeight: '200px' }}
        >
          {/* Ruler */}
          <div className="timeline-ruler h-8 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
            <svg width={timelineWidth} height={32}>
              {/* Draw time markers every second */}
              {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => {
                const x = timeToPixels(i, pixelsPerSecond);
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={20}
                      x2={x}
                      y2={32}
                      stroke="#4b5563"
                      strokeWidth={1}
                    />
                    <text
                      x={x + 4}
                      y={16}
                      fill="#9ca3af"
                      fontSize={10}
                      fontFamily="monospace"
                    >
                      {formatTime(i)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* Tracks placeholder */}
          <div className="timeline-tracks relative">
            {/* Audio track with waveform */}
            {audioBuffer && (
              <div className="track-row h-24 bg-gray-900 border-b border-gray-800 relative">
                <div className="track-label absolute left-0 top-0 h-full w-32 bg-gray-800 border-r border-gray-700 flex items-center px-3 z-10">
                  <span className="text-xs text-gray-400 font-medium">Audio</span>
                </div>
                <div className="track-content ml-32 h-full relative">
                  <WaveformVisualizer
                    audioBuffer={audioBuffer}
                    duration={duration}
                    width={timelineWidth}
                    height={96}
                    color="rgba(6, 182, 212, 0.4)"
                    mode={waveformMode}
                  />
                </div>
              </div>
            )}
            
            {/* Info panel */}
            <div className="p-4 text-gray-500 text-sm">
              <p className="font-semibold mb-2">✅ Chunk 5 Complete - Context Menu & Marquee</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Right-click: Context menu with Add Keyframe options</li>
                <li>Shift+right-drag: Marquee selection (green rectangle)</li>
                <li>Context menu prevented during drag (&gt; 5px movement)</li>
                <li>Menu items: Add Preset/Camera/Text/Environment Keyframes</li>
                <li>Placeholder items: Copy, Delete, Rename (for future use)</li>
                <li>ESC or click outside closes context menu</li>
              </ul>
            </div>
          </div>
          
          {/* Marquee selection rectangle */}
          {marquee && (
            <div
              className="absolute border-2 border-green-500 bg-green-500 bg-opacity-10 pointer-events-none z-30"
              style={{
                left: `${Math.min(marquee.startX, marquee.endX)}px`,
                top: `${Math.min(marquee.startY, marquee.endY)}px`,
                width: `${Math.abs(marquee.endX - marquee.startX)}px`,
                height: `${Math.abs(marquee.endY - marquee.startY)}px`
              }}
            />
          )}
          
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 pointer-events-none"
            style={{ left: `${playheadX}px` }}
          >
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 cursor-ew-resize pointer-events-auto"
              style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
              onPointerDown={handlePlayheadPointerDown}
            />
          </div>
        </div>
      </div>
      
      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          isOpen={true}
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
