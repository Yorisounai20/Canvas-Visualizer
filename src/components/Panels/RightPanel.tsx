import React, { useState } from 'react';
import { Section, AnimationType, PresetParameters, CameraFXClip, CameraFXKeyframe, CameraFXAudioModulation } from '../../types';

interface RightPanelProps {
  selectedSection: Section | null;
  selectedFXClip?: CameraFXClip | null;
  cameraFXKeyframes?: CameraFXKeyframe[];
  cameraFXAudioModulations?: CameraFXAudioModulation[];
  currentTime?: number;
  showFXOverlays?: boolean;
  animationTypes: AnimationType[];
  bassColor: string;
  midsColor: string;
  highsColor: string;
  backgroundColor: string;
  borderColor: string;
  cameraDistance: number;
  cameraHeight: number;
  cameraRotation: number;
  cameraAutoRotate: boolean;
  showLetterbox: boolean;
  letterboxSize: number;
  showBorder: boolean;
  showSongName: boolean;
  customSongName: string;
  fontLoaded: boolean;
  manualMode: boolean;
  onUpdateSection: (id: number, field: string, value: any) => void;
  onUpdateSectionParameters: (id: number, params: Partial<PresetParameters>) => void; // PHASE 4
  onApplyPreset?: (presetType: string) => void; // NEW REQUIREMENT: Create workspace objects from preset
  onSetBassColor: (color: string) => void;
  onSetMidsColor: (color: string) => void;
  onSetHighsColor: (color: string) => void;
  onSetBackgroundColor: (color: string) => void;
  onSetBorderColor: (color: string) => void;
  onSetCameraDistance: (distance: number) => void;
  onSetCameraHeight: (height: number) => void;
  onSetCameraRotation: (rotation: number) => void;
  onSetCameraAutoRotate: (autoRotate: boolean) => void;
  onSetShowLetterbox: (show: boolean) => void;
  onSetLetterboxSize: (size: number) => void;
  onSetShowBorder: (show: boolean) => void;
  onSetShowSongName: (show: boolean) => void;
  onSetCustomSongName: (name: string) => void;
  onSetManualMode: (mode: boolean) => void;
  onSetShowFXOverlays?: (show: boolean) => void;
  // Camera FX handlers
  onUpdateCameraFXClip?: (id: string, updates: Partial<CameraFXClip>) => void;
  onAddCameraFXKeyframe?: (clipId: string, time: number, parameter: string, value: number) => void;
  onUpdateCameraFXKeyframe?: (id: string, updates: Partial<CameraFXKeyframe>) => void;
  onDeleteCameraFXKeyframe?: (id: string) => void;
  onAddCameraFXAudioModulation?: (clipId: string, parameter: string, audioTrack: 'bass' | 'mids' | 'highs', amount: number) => void;
  onUpdateCameraFXAudioModulation?: (id: string, updates: Partial<CameraFXAudioModulation>) => void;
  onDeleteCameraFXAudioModulation?: (id: string) => void;
}

type RightPanelTab = 'layer' | 'canvas' | 'camerafx';

/**
 * RightPanel Component - Properties/Effects panel (After Effects-style)
 * Shows controls for the selected layer/section
 * Displays preset picker, color controls, and animation properties
 */
export default function RightPanel({
  selectedSection,
  selectedFXClip,
  cameraFXKeyframes,
  cameraFXAudioModulations,
  currentTime,
  showFXOverlays,
  animationTypes,
  bassColor,
  midsColor,
  highsColor,
  backgroundColor,
  borderColor,
  cameraDistance,
  cameraHeight,
  cameraRotation,
  cameraAutoRotate,
  showLetterbox,
  letterboxSize,
  showBorder,
  showSongName,
  customSongName,
  fontLoaded,
  manualMode,
  onUpdateSection,
  onUpdateSectionParameters, // PHASE 4
  onApplyPreset, // NEW REQUIREMENT
  onSetBassColor,
  onSetMidsColor,
  onSetHighsColor,
  onSetBackgroundColor,
  onSetBorderColor,
  onSetCameraDistance,
  onSetCameraHeight,
  onSetCameraRotation,
  onSetCameraAutoRotate,
  onSetShowLetterbox,
  onSetLetterboxSize,
  onSetShowBorder,
  onSetShowSongName,
  onSetCustomSongName,
  onSetManualMode,
  onSetShowFXOverlays,
  onUpdateCameraFXClip,
  onAddCameraFXKeyframe,
  onUpdateCameraFXKeyframe,
  onDeleteCameraFXKeyframe,
  onAddCameraFXAudioModulation,
  onUpdateCameraFXAudioModulation,
  onDeleteCameraFXAudioModulation
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('layer');
  const formatTime = (s: number) => 
    `${Math.floor(s/60)}:${(Math.floor(s%60)).toString().padStart(2,'0')}`;

  return (
    <div className="h-full bg-[#2B2B2B] border-l border-gray-700 flex flex-col shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Properties / Effects
        </h2>
        {selectedSection && activeTab === 'layer' && (
          <p className="text-xs text-cyan-400 mt-1">
            {animationTypes.find(a => a.value === selectedSection.animation)?.label || 'Unknown'}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => setActiveTab('layer')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'layer'
              ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Layer
        </button>
        <button
          onClick={() => setActiveTab('canvas')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'canvas'
              ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Canvas
        </button>
        <button
          onClick={() => setActiveTab('camerafx')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'camerafx'
              ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Camera FX
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'layer' ? (
          selectedSection ? (
          <div className="p-4 space-y-4">
            {/* Layer Properties */}
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Layer Properties
              </h3>

              {/* Animation Preset */}
              <div className="mb-3">
                <label className="text-xs text-gray-400 block mb-1">
                  Animation Preset
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedSection.animation}
                    onChange={(e) => onUpdateSection(selectedSection.id, 'animation', e.target.value)}
                    className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  >
                    {animationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  {onApplyPreset && (
                    <button
                      onClick={() => onApplyPreset(selectedSection.animation)}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded font-medium transition-colors whitespace-nowrap"
                      title="Create preset objects in workspace"
                    >
                      Create
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Click "Create" to generate workspace objects from this preset</p>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={formatTime(selectedSection.start)}
                    onChange={(e) => {
                      const [m, s] = e.target.value.split(':').map(Number);
                      onUpdateSection(selectedSection.id, 'start', m * 60 + s);
                    }}
                    className="w-full bg-gray-800 text-white text-sm px-2 py-1.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={formatTime(selectedSection.end)}
                    onChange={(e) => {
                      const [m, s] = e.target.value.split(':').map(Number);
                      onUpdateSection(selectedSection.id, 'end', m * 60 + s);
                    }}
                    className="w-full bg-gray-800 text-white text-sm px-2 py-1.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Duration (Read-only) */}
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Duration: {(selectedSection.end - selectedSection.start).toFixed(2)}s
                </p>
              </div>
            </div>

            {/* Color Controls */}
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Colors
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Bass Color
                  </label>
                  <input
                    type="color"
                    value={bassColor}
                    onChange={(e) => onSetBassColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Mids Color
                  </label>
                  <input
                    type="color"
                    value={midsColor}
                    onChange={(e) => onSetMidsColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Highs Color
                  </label>
                  <input
                    type="color"
                    value={highsColor}
                    onChange={(e) => onSetHighsColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            {/* PHASE 4: Preset Parameters */}
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Preset Parameters
              </h3>
              <div className="space-y-3">
                {/* Density */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Density: {selectedSection.parameters?.density || 30}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={selectedSection.parameters?.density || 30}
                    onChange={(e) => onUpdateSectionParameters(selectedSection.id, { density: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Object/particle count</p>
                </div>
                
                {/* Speed */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Speed: {selectedSection.parameters?.speed?.toFixed(1) || '1.0'}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={selectedSection.parameters?.speed || 1.0}
                    onChange={(e) => onUpdateSectionParameters(selectedSection.id, { speed: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Animation speed multiplier</p>
                </div>
                
                {/* Intensity */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Intensity: {selectedSection.parameters?.intensity?.toFixed(1) || '1.0'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={selectedSection.parameters?.intensity || 1.0}
                    onChange={(e) => onUpdateSectionParameters(selectedSection.id, { intensity: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Audio reactivity strength</p>
                </div>
                
                {/* Spread */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Spread: {selectedSection.parameters?.spread || 15}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={selectedSection.parameters?.spread || 15}
                    onChange={(e) => onUpdateSectionParameters(selectedSection.id, { spread: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Spatial distribution/radius</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            Select a layer to view properties
          </div>
        )
      ) : (
        /* Canvas Tab */
        <div className="p-4 space-y-4">
          {/* Background & Border */}
          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Background & Border
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Background Color
                </label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => onSetBackgroundColor(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showBorder"
                  checked={showBorder}
                  onChange={(e) => onSetShowBorder(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="showBorder" className="text-sm text-white cursor-pointer">
                  Show Border
                </label>
              </div>

              {showBorder && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Border Color
                  </label>
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => onSetBorderColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Camera Controls */}
          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Camera
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRotate"
                  checked={cameraAutoRotate}
                  onChange={(e) => onSetCameraAutoRotate(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="autoRotate" className="text-sm text-white cursor-pointer">
                  Auto-Rotate
                </label>
              </div>

              {/* NOTE: Camera position settings moved to Workspace mode 
                  Select a camera object in workspace mode to edit Distance, Height, Rotation */}
              <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
                <p className="mb-1">💡 <strong>Camera settings moved:</strong></p>
                <p>Switch to Workspace mode (W key) and select a camera object to adjust Distance, Height, and Rotation.</p>
              </div>
            </div>
          </div>

          {/* Note about Letterbox */}
          <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              💡 <strong>Letterbox moved to Camera Properties</strong>
            </p>
            <p className="text-xs text-blue-400 mt-1">
              Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">W</kbd> for Workspace mode, select a camera object to access letterbox (curtain) controls.
            </p>
          </div>

          {/* 3D Text Overlay Controls */}
          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              3D Text Overlay
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showSongName"
                  checked={showSongName}
                  onChange={(e) => onSetShowSongName(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                  disabled={!fontLoaded}
                />
                <label htmlFor="showSongName" className={`text-sm cursor-pointer ${fontLoaded ? 'text-white' : 'text-gray-500'}`}>
                  Show 3D Text
                </label>
              </div>

              {!fontLoaded && (
                <p className="text-xs text-yellow-400">
                  Loading font...
                </p>
              )}

              {fontLoaded && showSongName && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Custom Text
                  </label>
                  <input
                    type="text"
                    value={customSongName}
                    onChange={(e) => onSetCustomSongName(e.target.value)}
                    placeholder="Enter custom text (or leave empty for song name)"
                    className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Text color follows bass color
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Manual Control Mode */}
          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Manual Control
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="manualMode"
                  checked={manualMode}
                  onChange={(e) => onSetManualMode(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="manualMode" className="text-sm text-white cursor-pointer">
                  Manual Mode
                </label>
              </div>

              <p className="text-xs text-gray-500">
                When enabled, animations are controlled by keyframes instead of audio frequency
              </p>

              {manualMode && (
                <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded p-2">
                  <p className="text-xs text-yellow-400">
                    ⚠️ Manual mode active: Use timeline keyframes to control camera, presets, and text
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'camerafx' ? (
        /* Camera FX Tab */
        <div className="p-4 space-y-4">
          {/* FX Overlays Toggle */}
          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showFXOverlays"
                checked={showFXOverlays ?? true}
                onChange={(e) => onSetShowFXOverlays?.(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="showFXOverlays" className="text-sm text-white cursor-pointer">
                Show FX Overlays (Grid/Symmetry/Bounds)
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Visual guides for Camera FX editing (hidden during export)
            </p>
          </div>

          {selectedFXClip ? (
            <>
              {/* FX Clip Info */}
              <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  FX Clip Properties
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedFXClip.name}
                      onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { name: e.target.value })}
                      className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Type</label>
                    <div className="text-sm text-white bg-gray-800 px-3 py-2 rounded border border-gray-600">
                      {selectedFXClip.type === 'grid' && '🔲 Grid Tiling'}
                      {selectedFXClip.type === 'kaleidoscope' && '🔮 Kaleidoscope'}
                      {selectedFXClip.type === 'pip' && '📺 Picture-in-Picture'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fxEnabled"
                      checked={selectedFXClip.enabled}
                      onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { enabled: e.target.checked })}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="fxEnabled" className="text-sm text-white cursor-pointer">
                      Enabled
                    </label>
                  </div>
                </div>
              </div>

              {/* Grid Tiling Parameters */}
              {selectedFXClip.type === 'grid' && (
                <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                    Grid Tiling
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Rows: {selectedFXClip.gridRows || 2}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={selectedFXClip.gridRows || 2}
                        onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { gridRows: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Columns: {selectedFXClip.gridColumns || 2}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={selectedFXClip.gridColumns || 2}
                        onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { gridColumns: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (currentTime !== undefined) {
                          onAddCameraFXKeyframe?.(selectedFXClip.id, currentTime, 'gridRows', selectedFXClip.gridRows || 2);
                        }
                      }}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      Add Rows Keyframe
                    </button>

                    <button
                      onClick={() => {
                        if (currentTime !== undefined) {
                          onAddCameraFXKeyframe?.(selectedFXClip.id, currentTime, 'gridColumns', selectedFXClip.gridColumns || 2);
                        }
                      }}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      Add Columns Keyframe
                    </button>
                  </div>
                </div>
              )}

              {/* Kaleidoscope Parameters */}
              {selectedFXClip.type === 'kaleidoscope' && (
                <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                    Kaleidoscope
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Segments: {selectedFXClip.kaleidoscopeSegments || 6}
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="12"
                        value={selectedFXClip.kaleidoscopeSegments || 6}
                        onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { kaleidoscopeSegments: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Rotation: {selectedFXClip.kaleidoscopeRotation?.toFixed(1) || '0.0'}°
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={selectedFXClip.kaleidoscopeRotation || 0}
                        onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { kaleidoscopeRotation: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (currentTime !== undefined) {
                          onAddCameraFXKeyframe?.(selectedFXClip.id, currentTime, 'kaleidoscopeSegments', selectedFXClip.kaleidoscopeSegments || 6);
                        }
                      }}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      Add Segments Keyframe
                    </button>

                    <button
                      onClick={() => {
                        if (currentTime !== undefined) {
                          onAddCameraFXKeyframe?.(selectedFXClip.id, currentTime, 'kaleidoscopeRotation', selectedFXClip.kaleidoscopeRotation || 0);
                        }
                      }}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      Add Rotation Keyframe
                    </button>
                  </div>
                </div>
              )}

              {/* Picture-in-Picture Parameters */}
              {selectedFXClip.type === 'pip' && (
                <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                    Picture-in-Picture
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Scale: {(selectedFXClip.pipScale || 0.25).toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={selectedFXClip.pipScale || 0.25}
                        onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { pipScale: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Position X: {(selectedFXClip.pipPositionX || 0.65).toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.05"
                        value={selectedFXClip.pipPositionX || 0.65}
                        onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { pipPositionX: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Position Y: {(selectedFXClip.pipPositionY || 0.65).toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.05"
                        value={selectedFXClip.pipPositionY || 0.65}
                        onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { pipPositionY: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Border Width: {selectedFXClip.pipBorderWidth || 2}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={selectedFXClip.pipBorderWidth || 2}
                        onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { pipBorderWidth: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Border Color</label>
                      <input
                        type="color"
                        value={selectedFXClip.pipBorderColor || '#ffffff'}
                        onChange={(e) => onUpdateCameraFXClip?.(selectedFXClip.id, { pipBorderColor: e.target.value })}
                        className="w-full h-10 bg-gray-800 rounded border border-gray-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Modulation */}
              <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  Audio Reactivity
                </h3>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Add audio modulation to parameters for dynamic effects
                  </p>
                  
                  {cameraFXAudioModulations?.filter(mod => mod.clipId === selectedFXClip.id).map(mod => (
                    <div key={mod.id} className="bg-gray-800 bg-opacity-50 rounded p-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white">{mod.parameter}</span>
                        <button
                          onClick={() => onDeleteCameraFXAudioModulation?.(mod.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Track</label>
                        <select
                          value={mod.audioTrack}
                          onChange={(e) => onUpdateCameraFXAudioModulation?.(mod.id, { audioTrack: e.target.value as 'bass' | 'mids' | 'highs' })}
                          className="w-full bg-gray-900 text-white text-xs px-2 py-1 rounded border border-gray-600"
                        >
                          <option value="bass">Bass</option>
                          <option value="mids">Mids</option>
                          <option value="highs">Highs</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">
                          Amount: {mod.amount.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={mod.amount}
                          onChange={(e) => onUpdateCameraFXAudioModulation?.(mod.id, { amount: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              Select a Camera FX clip from the timeline to view properties
            </div>
          )}
        </div>
      ) : null}
      </div>
    </div>
  );
}
