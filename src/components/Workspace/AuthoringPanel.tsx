import React from 'react';
import { Sparkles, Play, Pause, Volume2 } from 'lucide-react';
import { getAvailableSolvers } from '../../lib/workspaceExport';

/**
 * Authoring Mode Panel
 * Live preset preview and testing controls
 */

interface AuthoringPanelProps {
  presetAuthoringMode: boolean;
  onTogglePresetAuthoring: () => void;
  selectedPreset?: string;
  onSelectPreset?: (preset: string) => void;
  mockTime?: number;
  onMockTimeChange?: (time: number) => void;
  mockAudio?: { bass: number; mids: number; highs: number };
  onMockAudioChange?: (audio: { bass: number; mids: number; highs: number }) => void;
}

export default function AuthoringPanel({
  presetAuthoringMode,
  onTogglePresetAuthoring,
  selectedPreset,
  onSelectPreset,
  mockTime = 0,
  onMockTimeChange,
  mockAudio = { bass: 0, mids: 0, highs: 0 },
  onMockAudioChange
}: AuthoringPanelProps) {
  const availableSolvers = getAvailableSolvers();

  return (
    <div className="p-3 space-y-3">
      {/* Authoring Mode Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={presetAuthoringMode}
            onChange={onTogglePresetAuthoring}
            className="w-4 h-4 rounded"
          />
          <Sparkles size={14} className="text-orange-400" />
          <span className="font-medium">Enable Authoring Mode</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          Preview preset animations on workspace objects in real-time
        </p>
      </div>

      {presetAuthoringMode && (
        <>
          {/* Preset Selection */}
          {onSelectPreset && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Preset to Preview</label>
              <select
                value={selectedPreset || ''}
                onChange={(e) => onSelectPreset(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-gray-800 text-white rounded border border-gray-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select preset...</option>
                {availableSolvers.map(solver => (
                  <option key={solver} value={solver}>
                    {solver.charAt(0).toUpperCase() + solver.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mock Time Control */}
          {onMockTimeChange && (
            <div>
              <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1">
                <Play size={12} />
                Mock Time: {mockTime.toFixed(2)}s
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={mockTime}
                onChange={(e) => onMockTimeChange(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Simulates timeline position for testing
              </p>
            </div>
          )}

          {/* Mock Audio Controls */}
          {onMockAudioChange && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400 block flex items-center gap-1">
                <Volume2 size={12} />
                Mock Audio Levels
              </label>
              
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Bass</span>
                  <span>{(mockAudio.bass * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mockAudio.bass}
                  onChange={(e) => onMockAudioChange({
                    ...mockAudio,
                    bass: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Mids</span>
                  <span>{(mockAudio.mids * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mockAudio.mids}
                  onChange={(e) => onMockAudioChange({
                    ...mockAudio,
                    mids: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Highs</span>
                  <span>{(mockAudio.highs * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mockAudio.highs}
                  onChange={(e) => onMockAudioChange({
                    ...mockAudio,
                    highs: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Simulates audio reactivity for testing
              </p>
            </div>
          )}
        </>
      )}

      {!presetAuthoringMode && (
        <div className="text-center text-gray-500 py-6">
          <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">Enable authoring mode to preview presets</p>
        </div>
      )}
    </div>
  );
}
