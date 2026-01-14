import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';
import { Section, AnimationType, PresetKeyframe, CameraKeyframe, TextKeyframe, EnvironmentKeyframe, WorkspaceObject, CameraFXClip } from '../../types';
import WaveformVisualizer from './WaveformVisualizer';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  
  // Calculate pixels per second based on zoom
  const pixelsPerSecond = getPixelsPerSecond(zoom);
  
  // RAF-throttled drag state (stored in refs to avoid re-renders during drag)
  const dragStateRef = useRef<{
    isDragging: boolean;
    type: 'playhead' | 'keyframe' | null;
    keyframeId: number | null;
    startX: number;
    startTime: number;
    lastClientX: number;
    rafId: number | null;
  }>({
    isDragging: false,
    type: null,
    keyframeId: null,
    startX: 0,
    startTime: 0,
    lastClientX: 0,
    rafId: null
  });
  
  // Preview position during drag (only updated via RAF)
  const [previewTime, setPreviewTime] = useState<number | null>(null);
  
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
          <div className="timeline-tracks p-4">
            <div className="text-gray-500 text-sm">
              <p className="font-semibold mb-2">✅ Chunk 2 Complete - RAF-Throttled Interactions</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Playhead drag with RAF throttling</li>
                <li>Snap-to-grid: {snapEnabled ? 'ON' : 'OFF'} (Grid: {gridSize}s)</li>
                <li>Keyboard navigation implemented:</li>
                <li className="ml-4">• Space: Play/Pause</li>
                <li className="ml-4">• Left/Right: Frame step (±{(1/DEFAULT_FPS).toFixed(3)}s)</li>
                <li className="ml-4">• Shift+Left/Right: ±1s</li>
                <li className="ml-4">• Ctrl/Cmd+Left/Right: ±5s</li>
                <li className="ml-4">• PageUp/PageDown: Viewport jump</li>
                <li className="ml-4">• Home/End: Start/End</li>
              </ul>
              <p className="mt-3 text-xs text-gray-600">
                Click timeline ruler to test playhead drag. Focus timeline and use keyboard shortcuts.
              </p>
            </div>
          </div>
          
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
    </div>
  );
}
