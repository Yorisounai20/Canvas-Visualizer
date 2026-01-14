import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';
import { Section, AnimationType, PresetKeyframe, CameraKeyframe, TextKeyframe, EnvironmentKeyframe, WorkspaceObject, CameraFXClip } from '../../types';
import WaveformVisualizer from './WaveformVisualizer';

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Placeholder: Will be implemented in chunks
  return (
    <div className="timeline-v2 flex flex-col h-full bg-gray-900 text-white">
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
          {formatTimeDisplay(currentTime)} / {formatTimeDisplay(duration)}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">Zoom: {Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            className="p-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setZoom(Math.min(4.0, zoom + 0.25))}
            className="p-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Timeline content */}
      <div
        ref={containerRef}
        className="timeline-content flex-1 overflow-auto relative"
      >
        <div className="timeline-placeholder p-8 text-center text-gray-500">
          <p className="text-lg font-semibold mb-2">🚧 New Timeline (TimelineV2) - Under Construction</p>
          <p className="text-sm">This is the new scrollable per-track timeline.</p>
          <p className="text-sm mt-2">Current time: {formatTimeDisplay(currentTime)}</p>
          <p className="text-sm">Duration: {formatTimeDisplay(duration)}</p>
          <p className="text-sm">Zoom: {Math.round(zoom * 100)}%</p>
          <p className="text-xs mt-4 text-gray-600">
            To disable this new timeline, run in browser console:
            <br />
            <code className="bg-gray-800 px-2 py-1 rounded mt-1 inline-block">
              localStorage.setItem('cv_use_scrollable_timeline', 'false')
            </code>
            <br />
            Then reload the page.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Format time in MM:SS.mmm format
 */
function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
