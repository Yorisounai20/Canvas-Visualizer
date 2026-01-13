import React from 'react';
import { Plus } from 'lucide-react';

interface CameraTabProps {
  // Global Camera Controls
  cameraDistance: number;
  cameraHeight: number;
  cameraRotation: number;
  cameraAutoRotate: boolean;
  setCameraDistance: (distance: number) => void;
  setCameraHeight: (height: number) => void;
  setCameraRotation: (rotation: number) => void;
  setCameraAutoRotate: (autoRotate: boolean) => void;
  
  // HUD Display Options
  showFilename: boolean;
  borderColor: string;
  setShowFilename: (show: boolean) => void;
  setBorderColor: (color: string) => void;
  
  // Letterbox (Cinematic Bars)
  showLetterbox: boolean;
  letterboxSize: number;
  setShowLetterbox: (show: boolean) => void;
  setLetterboxSize: (size: number) => void;
  
  // Camera Keyframe
  addKeyframe: () => void;
}

/**
 * Camera Tab Component - Global Controls, HUD Display, Letterbox
 * 
 * Features:
 * - Global Camera Controls (distance, height, rotation, auto-rotate)
 * - HUD Display Options (filename display, border color)
 * - Letterbox (Cinematic Bars) with size control
 * - Camera keyframe addition
 */
export default function CameraTab(props: CameraTabProps) {
  return (
    <div className="space-y-3">
      {/* Global Camera Controls */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <h4 className="text-sm font-semibold text-cyan-400">📷 Camera Position</h4>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Distance: {props.cameraDistance.toFixed(1)}
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="0.5"
            value={props.cameraDistance}
            onChange={(e) => props.setCameraDistance(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Close (5)</span>
            <span>Far (50)</span>
          </div>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Height: {props.cameraHeight.toFixed(1)}
          </label>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={props.cameraHeight}
            onChange={(e) => props.setCameraHeight(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low (-10)</span>
            <span>High (+10)</span>
          </div>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Rotation: {props.cameraRotation.toFixed(1)}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={props.cameraRotation}
            onChange={(e) => props.setCameraRotation(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0°</span>
            <span>360°</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
          <input
            type="checkbox"
            id="camera-auto-rotate"
            checked={props.cameraAutoRotate}
            onChange={(e) => props.setCameraAutoRotate(e.target.checked)}
            className="cursor-pointer"
          />
          <label htmlFor="camera-auto-rotate" className="text-xs text-gray-400 cursor-pointer">
            Auto-rotate camera
          </label>
        </div>
      </div>
      
      {/* HUD Display Options */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <h4 className="text-sm font-semibold text-cyan-400">🖥️ HUD Display</h4>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-filename"
            checked={props.showFilename}
            onChange={(e) => props.setShowFilename(e.target.checked)}
            className="cursor-pointer"
          />
          <label htmlFor="show-filename" className="text-xs text-gray-400 cursor-pointer">
            Show filename overlay
          </label>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">Border Color</label>
          <input
            type="color"
            value={props.borderColor}
            onChange={(e) => props.setBorderColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>
      </div>
      
      {/* Letterbox (Cinematic Bars) */}
      <div className="bg-gray-700 rounded-lg p-3 space-y-3">
        <h4 className="text-sm font-semibold text-cyan-400">🎬 Letterbox (Cinematic Bars)</h4>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-letterbox"
            checked={props.showLetterbox}
            onChange={(e) => props.setShowLetterbox(e.target.checked)}
            className="cursor-pointer"
          />
          <label htmlFor="show-letterbox" className="text-xs text-gray-400 cursor-pointer">
            Enable letterbox bars
          </label>
        </div>
        
        {props.showLetterbox && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Bar Size: {props.letterboxSize.toFixed(0)}px
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={props.letterboxSize}
              onChange={(e) => props.setLetterboxSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>None (0)</span>
              <span>Full (100)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              Black bars at top and bottom of the canvas for cinematic effect
            </p>
          </div>
        )}
      </div>
      
      {/* Add Camera Keyframe Button */}
      <button
        onClick={props.addKeyframe}
        className="w-full bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-white text-sm font-medium flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Camera Keyframe
      </button>
      
      <p className="text-xs text-gray-500 text-center italic">
        Keyframes are managed in the timeline
      </p>
    </div>
  );
}
