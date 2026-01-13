import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Section, AnimationType, PresetKeyframe, CameraKeyframe, TextKeyframe, EnvironmentKeyframe, WorkspaceObject, CameraFXClip } from '../../types';
import WaveformVisualizer from './WaveformVisualizer';
import ContextMenu, { ContextMenuItem } from '../Common/ContextMenu';
import { EASING_FUNCTIONS, EASING_BY_CATEGORY, EASING_CATEGORY_ORDER } from '../../lib/easingFunctions';

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
  workspaceObjects?: WorkspaceObject[]; // For camera selection in camera keyframes
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

type TimelineTab = 'sections' | 'presets' | 'camera' | 'text' | 'environment' | 'camerafx';

// Zoom level constants
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.0;
const DEFAULT_ZOOM = 1.0;

/**
 * Timeline Component - After Effects-style timeline with tabs
 * Shows sections as bars that can be moved, trimmed, and resized
 * Includes tabs for Sections, Presets, Camera, Text, and Environment organization
 */
export default function Timeline({
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
  onSelectSection,
  onUpdateSection,
  onAddSection,
  onSeek,
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
}: TimelineProps) {
  const [activeTab, setActiveTab] = useState<TimelineTab>('sections');
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-start' | 'resize-end' | null;
    sectionId: number | null;
    startX: number;
    initialStart: number;
    initialEnd: number;
  }>({ type: null, sectionId: null, startX: 0, initialStart: 0, initialEnd: 0 });

  // FX clip drag state
  const [fxDragState, setFxDragState] = useState<{
    type: 'move' | 'resize-start' | 'resize-end' | null;
    clipId: string | null;
    startX: number;
    initialStart: number;
    initialEnd: number;
  }>({ type: null, clipId: null, startX: 0, initialStart: 0, initialEnd: 0 });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    type: 'preset' | 'camera' | 'text' | 'environment' | null;
    keyframeId?: number;
    keyframeTime?: number;
  }>({ isOpen: false, x: 0, y: 0, type: null });

  // Edit modal state for keyframes
  const [editingKeyframe, setEditingKeyframe] = useState<{
    type: 'preset' | 'camera' | 'text' | 'environment' | null;
    data: any;
  }>({ type: null, data: null });

  const timelineRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  
  // Video editor features
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(1.0); // Snap interval in seconds
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const [showTimecode, setShowTimecode] = useState(true);
  
  // Memoize pixel calculations to prevent unnecessary recalculations
  const PIXELS_PER_SECOND = useMemo(() => 40 * zoomLevel, [zoomLevel]);
  const timelineWidth = useMemo(() => Math.max(duration * PIXELS_PER_SECOND, 1000), [duration, PIXELS_PER_SECOND]);
  
  const TIMELINE_HEIGHT = 60; // Height of each layer bar

  // Keyframe dragging state
  const [keyframeDragState, setKeyframeDragState] = useState<{
    type: 'preset' | 'text' | 'environment' | null;
    keyframeId: number | null;
    startX: number;
    initialTime: number;
  }>({ type: null, keyframeId: null, startX: 0, initialTime: 0 });

  const formatTime = (s: number) => 
    `${Math.floor(s/60)}:${(Math.floor(s%60)).toString().padStart(2,'0')}`;

  // Video editor timecode format (HH:MM:SS:FF at 30fps)
  const formatTimecode = (s: number, fps: number = 30) => {
    const totalFrames = Math.floor(s * fps);
    const hours = Math.floor(totalFrames / (fps * 3600));
    const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
    const seconds = Math.floor((totalFrames % (fps * 60)) / fps);
    const frames = totalFrames % fps;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  // Snap time to grid if enabled
  const snapTime = (time: number) => {
    if (!snapToGrid) return time;
    return Math.round(time / gridSize) * gridSize;
  };

  // CRITICAL FIX: Add playhead dragging state
  const [isPlayheadDragging, setIsPlayheadDragging] = useState(false);

  const getAnimationInfo = (animValue: string) => {
    return animationTypes.find(a => a.value === animValue) || {
      value: animValue,
      label: animValue,
      icon: '🎵'
    };
  };

  // Convert time to pixel position
  const timeToPixels = (time: number) => time * PIXELS_PER_SECOND;

  // Convert pixel position to time
  const pixelsToTime = (pixels: number) => Math.max(0, pixels / PIXELS_PER_SECOND);

  // Handle keyframe context menu
  const handleKeyframeContextMenu = (
    e: React.MouseEvent,
    type: 'preset' | 'camera' | 'text',
    keyframeId?: number,
    keyframeTime?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type,
      keyframeId,
      keyframeTime
    });
  };

  // Get context menu items for keyframes
  const getKeyframeContextMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    
    if (contextMenu.type === 'preset' && contextMenu.keyframeId !== undefined) {
      const keyframe = presetKeyframes.find(kf => kf.id === contextMenu.keyframeId);
      if (keyframe) {
        items.push({
          label: 'Edit Preset',
          icon: <Edit2 size={14} />,
          onClick: () => setEditingKeyframe({ type: 'preset', data: keyframe })
        });
        items.push({
          label: 'Delete Keyframe',
          icon: <Trash2 size={14} />,
          onClick: () => onDeletePresetKeyframe?.(contextMenu.keyframeId!)
        });
      }
    } else if (contextMenu.type === 'camera' && contextMenu.keyframeTime !== undefined) {
      const keyframe = cameraKeyframes.find(kf => kf.time === contextMenu.keyframeTime);
      if (keyframe) {
        items.push({
          label: 'Edit Camera',
          icon: <Edit2 size={14} />,
          onClick: () => setEditingKeyframe({ type: 'camera', data: keyframe })
        });
        items.push({
          label: 'Delete Keyframe',
          icon: <Trash2 size={14} />,
          onClick: () => onDeleteCameraKeyframe?.(contextMenu.keyframeTime!)
        });
      }
    } else if (contextMenu.type === 'text' && contextMenu.keyframeId !== undefined) {
      const keyframe = textKeyframes.find(kf => kf.id === contextMenu.keyframeId);
      if (keyframe) {
        items.push({
          label: 'Edit Text',
          icon: <Edit2 size={14} />,
          onClick: () => setEditingKeyframe({ type: 'text', data: keyframe })
        });
        items.push({
          label: 'Delete Keyframe',
          icon: <Trash2 size={14} />,
          onClick: () => onDeleteTextKeyframe?.(contextMenu.keyframeId!)
        });
      }
    } else if (contextMenu.type === 'environment' && contextMenu.keyframeId !== undefined) {
      const keyframe = environmentKeyframes.find(kf => kf.id === contextMenu.keyframeId);
      if (keyframe) {
        items.push({
          label: 'Edit Environment',
          icon: <Edit2 size={14} />,
          onClick: () => setEditingKeyframe({ type: 'environment', data: keyframe })
        });
        items.push({
          label: 'Delete Keyframe',
          icon: <Trash2 size={14} />,
          onClick: () => onDeleteEnvironmentKeyframe?.(contextMenu.keyframeId!)
        });
      }
    }

    return items;
  };

  // Handle playhead click/drag - CRITICAL FIX: Improved interaction like original slider
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const time = pixelsToTime(x);
    const snappedTime = snapTime(time);
    onSeek(Math.min(Math.max(0, snappedTime), duration));
    setIsPlayheadDragging(true);
  };

  // CRITICAL FIX: Add playhead drag handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPlayheadDragging && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollOffset;
        const time = pixelsToTime(x);
        const snappedTime = snapTime(time);
        onSeek(Math.min(Math.max(0, snappedTime), duration));
      }
    };

    const handleMouseUp = () => {
      setIsPlayheadDragging(false);
    };

    if (isPlayheadDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPlayheadDragging, scrollOffset, duration, onSeek, snapTime]);

  // Start dragging a section
  const handleSectionMouseDown = (
    e: React.MouseEvent,
    section: Section,
    type: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.stopPropagation();
    if (section.locked) return;

    setDragState({
      type,
      sectionId: section.id,
      startX: e.clientX,
      initialStart: section.start,
      initialEnd: section.end
    });
    onSelectSection(section.id);
  };

  // Handle mouse move during drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.type || !dragState.sectionId) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaTime = pixelsToTime(deltaX);

      const section = sections.find(s => s.id === dragState.sectionId);
      if (!section) return;

      if (dragState.type === 'move') {
        // Move the entire section
        const newStart = Math.max(0, dragState.initialStart + deltaTime);
        const duration = dragState.initialEnd - dragState.initialStart;
        const newEnd = newStart + duration;
        
        onUpdateSection(dragState.sectionId, 'start', newStart);
        onUpdateSection(dragState.sectionId, 'end', newEnd);
      } else if (dragState.type === 'resize-start') {
        // Resize from the start
        const newStart = Math.max(0, Math.min(dragState.initialStart + deltaTime, dragState.initialEnd - 1));
        onUpdateSection(dragState.sectionId, 'start', newStart);
      } else if (dragState.type === 'resize-end') {
        // Resize from the end
        const newEnd = Math.max(dragState.initialStart + 1, dragState.initialEnd + deltaTime);
        onUpdateSection(dragState.sectionId, 'end', newEnd);
      }
    };

    const handleMouseUp = () => {
      setDragState({ type: null, sectionId: null, startX: 0, initialStart: 0, initialEnd: 0 });
      // Re-enable text selection
      document.body.style.userSelect = '';
    };

    if (dragState.type) {
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, sections, onUpdateSection]);

  // Handle FX clip dragging
  useEffect(() => {
    if (!fxDragState.type || !fxDragState.clipId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const deltaX = currentX - fxDragState.startX;
      const deltaTime = (deltaX / rect.width) * duration;

      const clip = cameraFXClips.find(c => c.id === fxDragState.clipId);
      if (!clip || !fxDragState.clipId) return;

      let newStart = fxDragState.initialStart;
      let newEnd = fxDragState.initialEnd;

      if (fxDragState.type === 'move') {
        newStart = Math.max(0, fxDragState.initialStart + deltaTime);
        newEnd = Math.min(duration, fxDragState.initialEnd + deltaTime);
        const clipDuration = fxDragState.initialEnd - fxDragState.initialStart;
        
        // Keep duration constant when moving
        if (newStart + clipDuration > duration) {
          newStart = duration - clipDuration;
          newEnd = duration;
        }
      } else if (fxDragState.type === 'resize-start') {
        newStart = Math.max(0, Math.min(fxDragState.initialEnd - 0.5, fxDragState.initialStart + deltaTime));
      } else if (fxDragState.type === 'resize-end') {
        newEnd = Math.max(fxDragState.initialStart + 0.5, Math.min(duration, fxDragState.initialEnd + deltaTime));
      }

      onUpdateCameraFXClip?.(fxDragState.clipId, {
        startTime: parseFloat(newStart.toFixed(2)),
        endTime: parseFloat(newEnd.toFixed(2))
      });
    };

    const handleMouseUp = () => {
      setFxDragState({ type: null, clipId: null, startX: 0, initialStart: 0, initialEnd: 0 });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (fxDragState.type) {
      document.body.style.cursor = fxDragState.type === 'move' ? 'grabbing' : 'ew-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [fxDragState, cameraFXClips, duration, onUpdateCameraFXClip]);

  // Handle keyframe dragging
  useEffect(() => {
    if (!keyframeDragState.type || keyframeDragState.keyframeId === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current || keyframeDragState.keyframeId === null) return;
      
      const deltaX = e.clientX - keyframeDragState.startX;
      const deltaTime = pixelsToTime(deltaX);
      const rawTime = keyframeDragState.initialTime + deltaTime;
      const newTime = snapTime(Math.max(0, Math.min(duration, rawTime)));

      // Update keyframe position based on type
      if (keyframeDragState.type === 'preset' && onMovePresetKeyframe) {
        onMovePresetKeyframe(keyframeDragState.keyframeId, newTime);
      } else if (keyframeDragState.type === 'text' && onMoveTextKeyframe) {
        onMoveTextKeyframe(keyframeDragState.keyframeId, newTime);
      } else if (keyframeDragState.type === 'environment' && onMoveEnvironmentKeyframe) {
        onMoveEnvironmentKeyframe(keyframeDragState.keyframeId, newTime);
      }
    };

    const handleMouseUp = () => {
      setKeyframeDragState({ type: null, keyframeId: null, startX: 0, initialTime: 0 });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [keyframeDragState, duration, onMovePresetKeyframe, onMoveTextKeyframe, onMoveEnvironmentKeyframe, pixelsToTime, snapTime]);

  // Handle scroll wheel for horizontal scrolling - CRITICAL FIX: Updated dependencies
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Horizontal scroll with wheel
      setScrollOffset(prev => {
        const newOffset = prev + e.deltaY;
        // Clamp to reasonable bounds
        return Math.max(0, Math.min(newOffset, Math.max(0, timelineWidth - 1000)));
      });
    };

    const timelineElement = timelineRef.current?.parentElement;
    if (timelineElement) {
      timelineElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => timelineElement.removeEventListener('wheel', handleWheel);
    }
  }, [timelineWidth]); // CRITICAL FIX: Changed from [duration] to [timelineWidth]

  return (
    <>
    <div className="h-full bg-[#2B2B2B] border-t border-gray-700 flex flex-col shadow-lg">
      {/* Timeline Header */}
      <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Timeline
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {showTimecode ? formatTimecode(currentTime) : formatTime(currentTime)} / {showTimecode ? formatTimecode(duration) : formatTime(duration)}
            </p>
          </div>
          
          {/* Video Editor Controls */}
          <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
            {/* Snap to Grid */}
            <label className="flex items-center gap-1.5 cursor-pointer" title="Snap to grid">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="w-3 h-3 cursor-pointer"
              />
              <span className="text-xs text-gray-400">Snap</span>
            </label>
            
            {/* Grid Size */}
            {snapToGrid && (
              <select
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600"
                title="Grid size"
              >
                <option value="0.1">0.1s</option>
                <option value="0.5">0.5s</option>
                <option value="1.0">1s</option>
                <option value="5.0">5s</option>
              </select>
            )}
            
            {/* Timecode Toggle */}
            <button
              onClick={() => setShowTimecode(!showTimecode)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 rounded transition-colors"
              title="Toggle timecode display"
            >
              {showTimecode ? 'TC' : 'Time'}
            </button>
            
            {/* In/Out Points */}
            <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
              <button
                onClick={() => setInPoint(currentTime)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-green-400 rounded transition-colors"
                title="Set In Point (I)"
              >
                In
              </button>
              <button
                onClick={() => setOutPoint(currentTime)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-red-400 rounded transition-colors"
                title="Set Out Point (O)"
              >
                Out
              </button>
              {(inPoint !== null || outPoint !== null) && (
                <button
                  onClick={() => {
                    setInPoint(null);
                    setOutPoint(null);
                  }}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-gray-400 rounded transition-colors"
                  title="Clear In/Out"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => setZoomLevel(prev => Math.max(MIN_ZOOM, prev - 0.25))}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              title="Zoom out (-))"
            >
              −
            </button>
            <span className="text-xs text-gray-400 min-w-[50px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(MAX_ZOOM, prev + 0.25))}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              title="Zoom in (+)"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(DEFAULT_ZOOM)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors ml-1"
              title="Reset zoom (0)"
            >
              Reset
            </button>
          </div>
          <button
            onClick={onAddSection}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition-colors"
            title="Add new section"
          >
            <Plus size={14} />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* Timeline Tabs */}
      <div className="border-b border-gray-700 bg-[#2B2B2B] px-2">
        <div className="flex gap-1">
          {[
            { id: 'sections' as TimelineTab, label: 'Sections', icon: '📋' },
            { id: 'presets' as TimelineTab, label: 'Presets', icon: '🎨' },
            { id: 'camera' as TimelineTab, label: 'Camera', icon: '📷' },
            { id: 'text' as TimelineTab, label: 'Text', icon: '📝' },
            { id: 'environment' as TimelineTab, label: 'Environment', icon: '🌍' },
            { id: 'camerafx' as TimelineTab, label: 'Camera FX', icon: '🎬' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? 'text-cyan-400 bg-gray-700'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700 hover:bg-opacity-50'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto relative">
        {activeTab === 'sections' && (
          <>
        {/* Time ruler */}
        <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 h-8 flex items-center">
          <div className="relative" style={{ width: `${timelineWidth}px` }}>
            {/* Time markers */}
            {Array.from({ length: Math.ceil(duration / 5) + 1 }, (_, i) => i * 5).map(time => (
              <div
                key={time}
                className="absolute top-0 h-full flex items-center"
                style={{ left: `${timeToPixels(time)}px` }}
              >
                <div className="w-px h-2 bg-gray-600" />
                <span className="text-xs text-gray-500 ml-1 font-mono">
                  {formatTime(time)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline tracks */}
        <div 
          ref={timelineRef}
          className="relative cursor-pointer"
          style={{ width: `${timelineWidth}px`, minHeight: '100px' }}
          onClick={handleTimelineClick}
        >
          {/* Grid lines for snap points */}
          {snapToGrid && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: Math.ceil(duration / gridSize) + 1 }, (_, i) => i * gridSize).map(time => (
                <div
                  key={`grid-${time}`}
                  className="absolute top-0 bottom-0 w-px bg-gray-700 opacity-30"
                  style={{ left: `${timeToPixels(time)}px` }}
                />
              ))}
            </div>
          )}
          
          {/* Waveform background */}
          {showWaveform && audioBuffer && (
            <WaveformVisualizer
              audioBuffer={audioBuffer}
              duration={duration}
              width={timelineWidth}
              height={Math.max(sections.length * (TIMELINE_HEIGHT + 4), 100)}
              color="rgba(100, 180, 255, 0.15)"
            />
          )}

          {/* In/Out Point Markers */}
          {inPoint !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10 pointer-events-none"
              style={{ left: `${timeToPixels(inPoint)}px` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-green-500 rounded-sm" />
              <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-1 rounded">
                IN
              </div>
            </div>
          )}
          {outPoint !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10 pointer-events-none"
              style={{ left: `${timeToPixels(outPoint)}px` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-600 rounded-sm" />
              <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-1 rounded">
                OUT
              </div>
            </div>
          )}
          {/* Work Area Highlight (between In and Out) */}
          {inPoint !== null && outPoint !== null && (
            <div
              className="absolute top-0 bottom-0 bg-cyan-500 bg-opacity-10 z-0 pointer-events-none border-t-2 border-cyan-500"
              style={{
                left: `${timeToPixels(Math.min(inPoint, outPoint))}px`,
                width: `${timeToPixels(Math.abs(outPoint - inPoint))}px`
              }}
            />
          )}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ left: `${timeToPixels(currentTime)}px` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
          </div>

          {/* Section bars */}
          {sections.map((section, index) => {
            const animInfo = getAnimationInfo(section.animation);
            const isSelected = section.id === selectedSectionId;
            const isVisible = section.visible !== false;
            const isLocked = section.locked === true;
            
            const left = timeToPixels(section.start);
            const width = timeToPixels(section.end - section.start);
            const top = index * (TIMELINE_HEIGHT + 4);

            return (
              <div
                key={section.id}
                className={`absolute rounded transition-all ${
                  isSelected
                    ? 'ring-2 ring-[#4A90E2] z-10'
                    : 'hover:ring-1 hover:ring-gray-500'
                } ${!isVisible ? 'opacity-40' : ''} ${
                  isLocked ? 'cursor-not-allowed' : 'cursor-move'
                }`}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${TIMELINE_HEIGHT}px`,
                  backgroundColor: isSelected ? '#4A90E2' : '#5a5a5a',
                  backgroundImage: isSelected 
                    ? 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)'
                    : 'none'
                }}
                onMouseDown={(e) => !isLocked && handleSectionMouseDown(e, section, 'move')}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSection(section.id);
                }}
              >
                {/* Section content */}
                <div className="h-full px-2 py-1 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{animInfo.icon}</span>
                    <span className="text-xs font-semibold text-white truncate">
                      {animInfo.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 font-mono">
                    {formatTime(section.start)} - {formatTime(section.end)}
                  </div>

                  {/* Resize handles */}
                  {!isLocked && (
                    <>
                      {/* Left resize handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-cyan-400 bg-opacity-50 transition-colors"
                        onMouseDown={(e) => handleSectionMouseDown(e, section, 'resize-start')}
                        title="Resize start"
                      />
                      {/* Right resize handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-cyan-400 bg-opacity-50 transition-colors"
                        onMouseDown={(e) => handleSectionMouseDown(e, section, 'resize-end')}
                        title="Resize end"
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <>
            {/* Add Preset Keyframe Button */}
            <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">Click timeline to add preset keyframe</p>
              {onAddPresetKeyframe && (
                <button
                  onClick={() => onAddPresetKeyframe(currentTime)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                >
                  <Plus size={12} className="inline mr-1" />
                  Add at Current Time
                </button>
              )}
            </div>

            {/* Keyframe Timeline */}
            <div 
              className="relative cursor-pointer"
              style={{ width: `${timelineWidth}px`, minHeight: '100px' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left + scrollOffset;
                const clickedTime = pixelsToTime(x);
                if (onAddPresetKeyframe) {
                  onAddPresetKeyframe(clickedTime);
                }
              }}
            >
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ left: `${timeToPixels(currentTime)}px` }}
              >
                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
              </div>

              {/* Preset Keyframe Markers */}
              {presetKeyframes.map((kf) => (
                <div
                  key={kf.id}
                  className="absolute top-0 w-1 h-full bg-cyan-400 hover:bg-cyan-300 transition-colors group"
                  style={{ left: `${timeToPixels(kf.time)}px` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(kf.time);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setKeyframeDragState({
                      type: 'preset',
                      keyframeId: kf.id,
                      startX: e.clientX,
                      initialTime: kf.time
                    });
                  }}
                  onContextMenu={(e) => handleKeyframeContextMenu(e, 'preset', kf.id)}
                >
                  <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-cyan-400 rounded-full" />
                  <div className="absolute top-4 left-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30">
                    {formatTime(kf.time)} - {animationTypes.find(a => a.value === kf.preset)?.label || kf.preset}
                    {onDeletePresetKeyframe && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePresetKeyframe(kf.id);
                        }}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {presetKeyframes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
                  Click timeline to add preset keyframes
                </div>
              )}
            </div>
          </>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <>
            {/* Add Camera Keyframe Button */}
            <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">Click timeline to add camera keyframe</p>
              {onAddCameraKeyframe && (
                <button
                  onClick={() => onAddCameraKeyframe(currentTime)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                >
                  <Plus size={12} className="inline mr-1" />
                  Add at Current Time
                </button>
              )}
            </div>

            {/* Keyframe Timeline */}
            <div 
              className="relative cursor-pointer"
              style={{ width: `${timelineWidth}px`, minHeight: '100px' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left + scrollOffset;
                const clickedTime = pixelsToTime(x);
                if (onAddCameraKeyframe) {
                  onAddCameraKeyframe(clickedTime);
                }
              }}
            >
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ left: `${timeToPixels(currentTime)}px` }}
              >
                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
              </div>

              {/* Camera Keyframe Markers */}
              {cameraKeyframes.map((kf, index) => (
                <div
                  key={index}
                  className="absolute top-0 w-1 h-full bg-purple-400 hover:bg-purple-300 transition-colors cursor-pointer group"
                  style={{ left: `${timeToPixels(kf.time)}px` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(kf.time);
                  }}
                  onContextMenu={(e) => handleKeyframeContextMenu(e, 'camera', undefined, kf.time)}
                >
                  <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-purple-400 rounded-full" />
                  <div className="absolute top-4 left-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30">
                    {formatTime(kf.time)} - Dist: {kf.distance.toFixed(1)}, H: {kf.height.toFixed(1)}, Rot: {(kf.rotation * 180 / Math.PI).toFixed(0)}°
                    <br />
                    {kf.cameraId ? (
                      <>Camera: {workspaceObjects.find(obj => obj.id === kf.cameraId)?.name || 'Unknown'}<br /></>
                    ) : (
                      <>Camera: Main (Default)<br /></>
                    )}
                    Easing: {kf.easing}
                    {onDeleteCameraKeyframe && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCameraKeyframe(kf.time);
                        }}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {cameraKeyframes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
                  Click timeline to add camera keyframes
                </div>
              )}
            </div>
          </>
        )}

        {/* Text Tab */}
        {activeTab === 'text' && (
          <>
            {/* Add Text Keyframe Button */}
            <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">Click timeline to toggle text visibility keyframe</p>
              {onAddTextKeyframe && (
                <button
                  onClick={() => onAddTextKeyframe(currentTime)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                >
                  <Plus size={12} className="inline mr-1" />
                  Add at Current Time
                </button>
              )}
            </div>

            {/* Keyframe Timeline */}
            <div 
              className="relative cursor-pointer"
              style={{ width: `${timelineWidth}px`, minHeight: '100px' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left + scrollOffset;
                const clickedTime = pixelsToTime(x);
                if (onAddTextKeyframe) {
                  onAddTextKeyframe(clickedTime);
                }
              }}
            >
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ left: `${timeToPixels(currentTime)}px` }}
              >
                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
              </div>

              {/* Text Keyframe Markers */}
              {textKeyframes.map((kf) => (
                <div
                  key={kf.id}
                  className={`absolute top-0 w-1 h-full ${kf.show ? 'bg-green-400 hover:bg-green-300' : 'bg-red-400 hover:bg-red-300'} transition-colors group`}
                  style={{ left: `${timeToPixels(kf.time)}px` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(kf.time);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setKeyframeDragState({
                      type: 'text',
                      keyframeId: kf.id,
                      startX: e.clientX,
                      initialTime: kf.time
                    });
                  }}
                  onContextMenu={(e) => handleKeyframeContextMenu(e, 'text', kf.id)}
                >
                  <div className={`absolute -top-1 -left-1.5 w-3 h-3 ${kf.show ? 'bg-green-400' : 'bg-red-400'} rounded-full`} />
                  <div className="absolute top-4 left-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30">
                    {formatTime(kf.time)} - {kf.show ? 'Show' : 'Hide'} Text
                    {onDeleteTextKeyframe && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTextKeyframe(kf.id);
                        }}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {textKeyframes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
                  Click timeline to add text visibility keyframes
                </div>
              )}
            </div>
          </>
        )}

        {/* Environment Tab */}
        {activeTab === 'environment' && (
          <>
            {/* Add Environment Keyframe Button */}
            <div className="mb-3 flex items-center justify-between">
              {onAddEnvironmentKeyframe && (
                <button
                  onClick={() => onAddEnvironmentKeyframe(currentTime)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                  title="Add environment keyframe at current time"
                >
                  <Plus size={14} />
                  <span>Add Environment</span>
                </button>
              )}
            </div>

            {/* Timeline area for environment keyframes */}
            <div 
              className="relative bg-gray-750 rounded h-24 cursor-crosshair border border-gray-600"
              style={{ minHeight: '96px' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const clickedTime = (x / rect.width) * (duration || 60);
                if (onAddEnvironmentKeyframe) {
                  onAddEnvironmentKeyframe(clickedTime);
                }
              }}
            >
              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none z-10"
                style={{ left: `${(currentTime / (duration || 60)) * 100}%` }}
              />

              {/* Environment Keyframe Markers */}
              {environmentKeyframes.map(kf => (
                <div
                  key={kf.id}
                  className="absolute top-1 w-4 h-4 bg-green-500 rounded-full hover:scale-125 transition-transform flex items-center justify-center group"
                  style={{ left: `calc(${(kf.time / (duration || 60)) * 100}% - 8px)` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingKeyframe({ type: 'environment', data: kf });
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setKeyframeDragState({
                      type: 'environment',
                      keyframeId: kf.id,
                      startX: e.clientX,
                      initialTime: kf.time
                    });
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({
                      isOpen: true,
                      x: e.clientX,
                      y: e.clientY,
                      type: 'environment',
                      keyframeId: kf.id,
                      keyframeTime: kf.time
                    });
                  }}
                  title={`Environment: ${kf.type} (${formatTime(kf.time)})`}
                >
                  <span className="text-[8px]">🌍</span>
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    {formatTime(kf.time)} - {kf.type.charAt(0).toUpperCase() + kf.type.slice(1)} ({Math.round(kf.intensity * 100)}%)
                    {onDeleteEnvironmentKeyframe && (
                      <button
                        className="ml-2 text-red-400 hover:text-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEnvironmentKeyframe(kf.id);
                        }}
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {environmentKeyframes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
                  Click timeline to add environment keyframes
                </div>
              )}
            </div>
          </>
        )}

        {/* Camera FX Tab */}
        {activeTab === 'camerafx' && (
          <>
            {/* Camera FX Track */}
            <div className="relative bg-gray-800 rounded border border-gray-700 p-4" style={{ minHeight: '120px' }}>
              {/* Add FX Clip Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => onAddCameraFXClip?.('grid', currentTime)}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded transition-colors"
                  title="Add Grid Tiling FX"
                >
                  🔲 Grid
                </button>
                <button
                  onClick={() => onAddCameraFXClip?.('kaleidoscope', currentTime)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                  title="Add Kaleidoscope FX"
                >
                  🔮 Kaleidoscope
                </button>
                <button
                  onClick={() => onAddCameraFXClip?.('pip', currentTime)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  title="Add Picture-in-Picture FX"
                >
                  📺 PIP
                </button>
              </div>

              {/* FX Clips Timeline */}
              <div className="relative h-16 bg-gray-900 rounded border border-gray-700">
                {/* Time ruler marks */}
                {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => i).map(second => (
                  <div
                    key={second}
                    className="absolute top-0 bottom-0 border-l border-gray-700"
                    style={{ left: `${(second / duration) * 100}%` }}
                  >
                    <span className="absolute -top-4 -translate-x-1/2 text-[10px] text-gray-500">
                      {second}s
                    </span>
                  </div>
                ))}

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10 pointer-events-none"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />

                {/* FX Clips */}
                {cameraFXClips.map(clip => {
                  const clipLeft = (clip.startTime / duration) * 100;
                  const clipWidth = ((clip.endTime - clip.startTime) / duration) * 100;
                  const isSelected = clip.id === selectedFXClipId;
                  
                  return (
                    <div
                      key={clip.id}
                      className={`absolute top-1 bottom-1 rounded cursor-move transition-all ${
                        isSelected ? 'ring-2 ring-cyan-400' : ''
                      } ${
                        clip.type === 'grid' ? 'bg-cyan-600' :
                        clip.type === 'kaleidoscope' ? 'bg-purple-600' :
                        'bg-blue-600'
                      } hover:brightness-110 ${!clip.enabled ? 'opacity-50' : ''}`}
                      style={{
                        left: `${clipLeft}%`,
                        width: `${clipWidth}%`
                      }}
                      onClick={() => onSelectFXClip?.(clip.id)}
                      onMouseDown={(e) => {
                        if (!timelineRef.current) return;
                        const rect = timelineRef.current.getBoundingClientRect();
                        const relativeX = e.clientX - rect.left;
                        const clipElement = e.currentTarget;
                        const clipRect = clipElement.getBoundingClientRect();
                        const clipRelativeX = e.clientX - clipRect.left;
                        
                        // Determine if clicking near edges for resize
                        if (clipRelativeX < 8) {
                          // Resize start
                          setFxDragState({
                            type: 'resize-start',
                            clipId: clip.id,
                            startX: relativeX,
                            initialStart: clip.startTime,
                            initialEnd: clip.endTime
                          });
                        } else if (clipRelativeX > clipRect.width - 8) {
                          // Resize end
                          setFxDragState({
                            type: 'resize-end',
                            clipId: clip.id,
                            startX: relativeX,
                            initialStart: clip.startTime,
                            initialEnd: clip.endTime
                          });
                        } else {
                          // Move
                          setFxDragState({
                            type: 'move',
                            clipId: clip.id,
                            startX: relativeX,
                            initialStart: clip.startTime,
                            initialEnd: clip.endTime
                          });
                        }
                      }}
                    >
                      {/* Resize handles */}
                      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-20" />
                      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-20" />
                      
                      <div className="px-2 py-1 text-xs text-white truncate pointer-events-none">
                        {clip.type === 'grid' && '🔲'}
                        {clip.type === 'kaleidoscope' && '🔮'}
                        {clip.type === 'pip' && '📺'}
                        {' '}{clip.name}
                      </div>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCameraFXClip?.(clip.id);
                        }}
                        className="absolute top-0 right-0 p-1 bg-red-600 hover:bg-red-700 rounded-tr text-white opacity-0 hover:opacity-100 transition-opacity"
                        title="Delete FX Clip"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  );
                })}

                {cameraFXClips.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
                    Click buttons above to add Camera FX clips
                  </div>
                )}
              </div>

              {/* Selected FX Clip Info */}
              {(() => {
                const selectedClip = selectedFXClipId ? cameraFXClips.find(c => c.id === selectedFXClipId) : null;
                if (!selectedClip) return null;
                
                return (
                  <div className="mt-4 p-3 bg-gray-700 rounded text-xs text-gray-300">
                    <div className="font-semibold mb-1">
                      {selectedClip.name}
                    </div>
                    <div className="flex gap-4">
                      <span>Start: {selectedClip.startTime.toFixed(2)}s</span>
                      <span>End: {selectedClip.endTime.toFixed(2)}s</span>
                      <span>Duration: {(selectedClip.endTime - selectedClip.startTime).toFixed(2)}s</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        items={getKeyframeContextMenuItems()}
        onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0, type: null })}
      />

      {/* Edit Keyframe Modals */}
      {editingKeyframe.type === 'preset' && editingKeyframe.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Preset Keyframe</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Preset</label>
              <select
                value={editingKeyframe.data.preset}
                onChange={(e) => setEditingKeyframe({ 
                  ...editingKeyframe, 
                  data: { ...editingKeyframe.data, preset: e.target.value }
                })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
              >
                {animationTypes.map(anim => (
                  <option key={anim.value} value={anim.value}>
                    {anim.icon} {anim.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingKeyframe({ type: null, data: null })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onUpdatePresetKeyframe) {
                    onUpdatePresetKeyframe(editingKeyframe.data.id, editingKeyframe.data.preset);
                  }
                  setEditingKeyframe({ type: null, data: null });
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {editingKeyframe.type === 'camera' && editingKeyframe.data && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Edit Camera Keyframe</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Distance: {editingKeyframe.data.distance.toFixed(1)}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="0.5"
                value={editingKeyframe.data.distance}
                onChange={(e) => setEditingKeyframe({ 
                  ...editingKeyframe, 
                  data: { ...editingKeyframe.data, distance: Number(e.target.value) }
                })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Height: {editingKeyframe.data.height.toFixed(1)}
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={editingKeyframe.data.height}
                onChange={(e) => setEditingKeyframe({ 
                  ...editingKeyframe, 
                  data: { ...editingKeyframe.data, height: Number(e.target.value) }
                })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Rotation: {(editingKeyframe.data.rotation * 180 / Math.PI).toFixed(0)}°
              </label>
              <input
                type="range"
                min="0"
                max={2 * Math.PI}
                step="0.1"
                value={editingKeyframe.data.rotation}
                onChange={(e) => setEditingKeyframe({ 
                  ...editingKeyframe, 
                  data: { ...editingKeyframe.data, rotation: Number(e.target.value) }
                })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Camera Object</label>
              <select
                value={editingKeyframe.data.cameraId || ''}
                onChange={(e) => setEditingKeyframe({ 
                  ...editingKeyframe, 
                  data: { ...editingKeyframe.data, cameraId: e.target.value || undefined }
                })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
              >
                <option value="">Default Main Camera</option>
                {workspaceObjects
                  .filter(obj => obj.type === 'camera')
                  .map(cam => (
                    <option key={cam.id} value={cam.id}>
                      {cam.name}
                    </option>
                  ))
                }
              </select>
              <p className="text-xs text-gray-500 mt-1">Select which camera to use at this keyframe</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Easing</label>
              <select
                value={editingKeyframe.data.easing}
                onChange={(e) => setEditingKeyframe({ 
                  ...editingKeyframe, 
                  data: { ...editingKeyframe.data, easing: e.target.value }
                })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
              >
                {EASING_CATEGORY_ORDER.map(category => {
                  const options = EASING_BY_CATEGORY[category];
                  if (!options) return null;
                  return (
                    <optgroup key={category} label={category}>
                      {options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {EASING_FUNCTIONS.find(opt => opt.value === editingKeyframe.data.easing)?.description || 'Select easing function'}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingKeyframe({ type: null, data: null })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onUpdateCameraKeyframe) {
                    const { time, ...updates } = editingKeyframe.data;
                    onUpdateCameraKeyframe(time, updates);
                  }
                  setEditingKeyframe({ type: null, data: null });
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {editingKeyframe.type === 'text' && editingKeyframe.data && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Edit Text Keyframe</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Visibility</label>
              <select
                value={editingKeyframe.data.show ? 'show' : 'hide'}
                onChange={(e) => setEditingKeyframe({ 
                  ...editingKeyframe, 
                  data: { ...editingKeyframe.data, show: e.target.value === 'show' }
                })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
              >
                <option value="show">Show Text</option>
                <option value="hide">Hide Text</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Custom Text (Optional)</label>
              <input
                type="text"
                value={editingKeyframe.data.text || ''}
                onChange={(e) => setEditingKeyframe({ 
                  ...editingKeyframe, 
                  data: { ...editingKeyframe.data, text: e.target.value }
                })}
                placeholder="Leave empty to use default"
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingKeyframe({ type: null, data: null })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onUpdateTextKeyframe) {
                    onUpdateTextKeyframe(editingKeyframe.data.id, editingKeyframe.data.show, editingKeyframe.data.text);
                  }
                  setEditingKeyframe({ type: null, data: null });
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Edit Environment Keyframe Modal */}
      {editingKeyframe.type === 'environment' && editingKeyframe.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Environment Keyframe</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Environment Type</label>
                <select
                  value={editingKeyframe.data.type}
                  onChange={(e) => setEditingKeyframe({ 
                    ...editingKeyframe, 
                    data: { ...editingKeyframe.data, type: e.target.value }
                  })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                >
                  <option value="none">⚫ None</option>
                  <option value="ocean">🌊 Ocean</option>
                  <option value="forest">🌲 Forest</option>
                  <option value="space">🌌 Space</option>
                  <option value="city">🏙️ City</option>
                  <option value="abstract">🔷 Abstract</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Intensity: {Math.round((editingKeyframe.data.intensity || 0.5) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={editingKeyframe.data.intensity || 0.5}
                  onChange={(e) => setEditingKeyframe({ 
                    ...editingKeyframe, 
                    data: { ...editingKeyframe.data, intensity: parseFloat(e.target.value) }
                  })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Controls density and visibility of environment elements</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Color Override (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editingKeyframe.data.color || '#ffffff'}
                    onChange={(e) => setEditingKeyframe({ 
                      ...editingKeyframe, 
                      data: { ...editingKeyframe.data, color: e.target.value }
                    })}
                    className="w-12 h-10 bg-gray-700 rounded border border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingKeyframe.data.color || ''}
                    onChange={(e) => setEditingKeyframe({ 
                      ...editingKeyframe, 
                      data: { ...editingKeyframe.data, color: e.target.value }
                    })}
                    placeholder="#ffffff (leave empty for default)"
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditingKeyframe({ type: null, data: null })}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onUpdateEnvironmentKeyframe) {
                      onUpdateEnvironmentKeyframe(
                        editingKeyframe.data.id, 
                        editingKeyframe.data.type, 
                        editingKeyframe.data.intensity,
                        editingKeyframe.data.color
                      );
                    }
                    setEditingKeyframe({ type: null, data: null });
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
