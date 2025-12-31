import React from 'react';
import { Section, AnimationType } from '../../types';

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
  onUpdateSection: (id: number, field: string, value: any) => void;
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
}

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
  onUpdateSection,
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
  onSetLetterboxSize
}: RightPanelProps) {
  const formatTime = (s: number) => 
    `${Math.floor(s/60)}:${(Math.floor(s%60)).toString().padStart(2,'0')}`;

  return (
    <div className="w-80 bg-[#2B2B2B] border-l border-gray-700 flex flex-col shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Properties / Effects
        </h2>
        {selectedSection && (
          <p className="text-xs text-cyan-400 mt-1">
            {animationTypes.find(a => a.value === selectedSection.animation)?.label || 'Unknown'}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedSection ? (
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
                <select
                  value={selectedSection.animation}
                  onChange={(e) => onUpdateSection(selectedSection.id, 'animation', e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                >
                  {animationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
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

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Distance: {cameraDistance.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="0.5"
                    value={cameraDistance}
                    onChange={(e) => onSetCameraDistance(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Height: {cameraHeight.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={cameraHeight}
                    onChange={(e) => onSetCameraHeight(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Rotation: {(cameraRotation * 180 / Math.PI).toFixed(0)}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={Math.PI * 2}
                    step="0.05"
                    value={cameraRotation}
                    onChange={(e) => onSetCameraRotation(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Visual Effects */}
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Effects
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
                    Letterbox
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
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Background
                  </label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => onSetBackgroundColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

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
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            Select a layer to view properties
          </div>
        )}
      </div>
    </div>
  );
}
