import React, { useState } from 'react';
import { Section, AnimationType, PresetParameters } from '../../types';

interface RightPanelProps {
  selectedSection: Section | null;
  animationTypes: AnimationType[];
  bassColor: string;
  midsColor: string;
  highsColor: string;
  backgroundColor: string;
  borderColor: string;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
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
  onSetAmbientLight: (intensity: number) => void;
  onSetDirectionalLight: (intensity: number) => void;
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
}

type RightPanelTab = 'layer' | 'canvas';

/**
 * RightPanel Component - Properties/Effects panel (After Effects-style)
 * Shows controls for the selected layer/section
 * Displays preset picker, color controls, and animation properties
 */
export default function RightPanel({
  selectedSection,
  animationTypes,
  bassColor,
  midsColor,
  highsColor,
  backgroundColor,
  borderColor,
  ambientLightIntensity,
  directionalLightIntensity,
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
  onSetAmbientLight,
  onSetDirectionalLight,
  onSetCameraDistance,
  onSetCameraHeight,
  onSetCameraRotation,
  onSetCameraAutoRotate,
  onSetShowLetterbox,
  onSetLetterboxSize,
  onSetShowBorder,
  onSetShowSongName,
  onSetCustomSongName,
  onSetManualMode
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

          {/* Lighting */}
          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Lighting
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Ambient: {(ambientLightIntensity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={ambientLightIntensity}
                  onChange={(e) => onSetAmbientLight(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Directional: {(directionalLightIntensity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={directionalLightIntensity}
                  onChange={(e) => onSetDirectionalLight(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
                />
              </div>
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

          {/* Letterbox Controls */}
          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Letterbox
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showLetterbox"
                  checked={showLetterbox}
                  onChange={(e) => onSetShowLetterbox(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="showLetterbox" className="text-sm text-white cursor-pointer">
                  Show Letterbox
                </label>
              </div>

              {showLetterbox && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Size: {letterboxSize}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={letterboxSize}
                    onChange={(e) => onSetLetterboxSize(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use keyframes in timeline for animated letterbox
                  </p>
                </div>
              )}
            </div>
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
      )}
      </div>
    </div>
  );
}
