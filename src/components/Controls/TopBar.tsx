import React from 'react';
import { Play, Square, Video, Undo2, Redo2, Upload } from 'lucide-react';

interface TopBarProps {
  isPlaying: boolean;
  audioReady: boolean;
  currentTime: number;
  duration: number;
  currentPreset: string | null;
  audioFileName: string;
  projectName?: string; // PHASE 2: Optional project name
  onPlay: () => void;
  onStop: () => void;
  onExport: () => void;
  onAudioFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

/**
 * TopBar Component - After Effects-style top control bar
 * Contains playback controls, current section info, export button, and undo/redo
 * PHASE 2: Now displays project name from project settings
 */
export default function TopBar({
  isPlaying,
  audioReady,
  currentTime,
  duration,
  currentPreset,
  audioFileName,
  projectName = '3D Music Visualizer Editor', // PHASE 2: Default name if not provided
  onPlay,
  onStop,
  onExport,
  onAudioFileChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}: TopBarProps) {
  const formatTime = (s: number) => 
    `${Math.floor(s/60)}:${(Math.floor(s%60)).toString().padStart(2,'0')}`;

  return (
    <div className="bg-[#2B2B2B] border-b border-gray-700 px-4 py-3 flex items-center justify-between shadow-lg">
      {/* Left: Title and Current Info */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-purple-400">{projectName}</h1>
        <div className="text-sm text-gray-400">
          {currentPreset && (
            <span className="px-2 py-1 bg-gray-700 rounded text-cyan-400">
              {currentPreset}
            </span>
          )}
        </div>
      </div>

      {/* Center: Playback Controls and Time */}
      <div className="flex items-center gap-4">
        {/* Time Display */}
        <div className="text-white font-mono text-sm bg-gray-700 px-3 py-1.5 rounded">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Audio Upload Button */}
        <label
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold cursor-pointer transition-colors"
          title="Upload Audio File"
        >
          <Upload size={16} />
          <span>{audioFileName || 'Upload Audio'}</span>
          <input
            type="file"
            accept="audio/*"
            onChange={onAudioFileChange}
            className="hidden"
          />
        </label>

        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={isPlaying ? onStop : onPlay}
            disabled={!audioReady}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              !audioReady
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : isPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title={isPlaying ? 'Stop (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <>
                <Square size={16} />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Play</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right: Undo/Redo and Export */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo Buttons */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded transition-colors ${
            canUndo
              ? 'hover:bg-gray-700 text-gray-300'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded transition-colors ${
            canRedo
              ? 'hover:bg-gray-700 text-gray-300'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={18} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700 mx-2" />

        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          title="Export Video"
        >
          <Video size={18} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
