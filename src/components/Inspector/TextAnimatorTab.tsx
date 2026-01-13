import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface TextAnimatorKeyframe {
  id: number;
  time: number;
  text: string;
  animation: string;
  direction?: string;
  stagger: number;
  duration: number;
  visible: boolean;
}

interface TextAnimatorTabProps {
  customFontName: string;
  customSongName: string;
  textColor: string;
  textMaterialType: string;
  textWireframe: boolean;
  textOpacity: number;
  textMetalness: number;
  textRoughness: number;
  showSongName: boolean;
  fontLoaded: boolean;
  currentTime: number;
  textAnimatorKeyframes: TextAnimatorKeyframe[];
  loadCustomFont: (file: File) => void;
  setCustomSongName: (name: string) => void;
  toggleSongName: () => void;
  setTextColor: (color: string) => void;
  setTextMaterialType: (type: string) => void;
  setTextWireframe: (wireframe: boolean) => void;
  setTextOpacity: (opacity: number) => void;
  setTextMetalness: (metalness: number) => void;
  setTextRoughness: (roughness: number) => void;
  createTextAnimatorKeyframe: (time: number) => void;
  deleteTextAnimatorKeyframe: (id: number) => void;
  updateTextAnimatorKeyframe: (id: number, updates: Partial<TextAnimatorKeyframe>) => void;
  formatTime: (time: number) => string;
}

/**
 * Text Animator Tab Component - 3D Text with Effects
 * Extracted from visualizer-software-COMPREHENSIVE-BACKUP.tsx lines 10924-11112 (189 lines)
 * 
 * Features:
 * - 3D Text controls
 * - Text animation settings
 * - Font and style options
 */
export default function TextAnimatorTab({
  customFontName,
  customSongName,
  textColor,
  textMaterialType,
  textWireframe,
  textOpacity,
  textMetalness,
  textRoughness,
  showSongName,
  fontLoaded,
  currentTime,
  textAnimatorKeyframes,
  loadCustomFont,
  setCustomSongName,
  toggleSongName,
  setTextColor,
  setTextMaterialType,
  setTextWireframe,
  setTextOpacity,
  setTextMetalness,
  setTextRoughness,
  createTextAnimatorKeyframe,
  deleteTextAnimatorKeyframe,
  updateTextAnimatorKeyframe,
  formatTime
}: TextAnimatorTabProps) {
  return (
    <div>
      {/* Song Name Overlay Section */}
      <div className="mb-4 bg-gray-700 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎤 Song Name Overlay</h3>
        <div className="mb-3 pb-3 border-b border-gray-600">
          <label className="text-xs text-gray-400 block mb-2">Custom Font (.typeface.json)</label>
          <input 
            type="file" 
            accept=".json,.typeface.json" 
            onChange={(e) => { if (e.target.files && e.target.files[0]) loadCustomFont(e.target.files[0]); }} 
            className="block flex-1 text-sm text-gray-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer" 
          />
          <p className="text-xs text-gray-500 mt-1">Current: {customFontName}</p>
        </div>
        <div className="flex gap-2 mb-2">
          <input 
            type="text" 
            value={customSongName} 
            onChange={(e) => setCustomSongName(e.target.value)} 
            placeholder="Enter song name" 
            className="flex-1 bg-gray-600 text-white text-sm px-3 py-2 rounded" 
          />
          <button 
            onClick={toggleSongName} 
            disabled={!fontLoaded} 
            className={`px-4 py-2 rounded font-semibold ${fontLoaded ? (showSongName ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700') : 'bg-gray-500 cursor-not-allowed'} text-white`}
          >
            {!fontLoaded ? 'Loading...' : showSongName ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="flex gap-2 mb-2 items-center">
          <label className="text-xs text-gray-400">Text Color</label>
          <input 
            type="color" 
            value={textColor} 
            onChange={(e) => setTextColor(e.target.value)} 
            className="w-12 h-8 rounded cursor-pointer" 
          />
          <span className="text-xs text-gray-500 font-mono">{textColor}</span>
        </div>
        
        {/* Text Material Controls */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Material Type</label>
            <select 
              value={textMaterialType} 
              onChange={(e) => setTextMaterialType(e.target.value)} 
              className="w-full bg-gray-600 text-white text-xs px-2 py-1.5 rounded cursor-pointer"
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard (PBR)</option>
              <option value="phong">Phong (Shiny)</option>
              <option value="lambert">Lambert (Matte)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Wireframe</label>
            <input 
              type="checkbox" 
              checked={textWireframe} 
              onChange={(e) => setTextWireframe(e.target.checked)} 
              className="w-4 h-4 rounded cursor-pointer" 
            />
          </div>
        </div>
        
        <div className="mb-2">
          <label className="text-xs text-gray-400 block mb-1">Opacity: {textOpacity.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={textOpacity} 
            onChange={(e) => setTextOpacity(parseFloat(e.target.value))} 
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" 
          />
        </div>
        
        {textMaterialType === 'standard' && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Metalness: {textMetalness.toFixed(2)}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={textMetalness} 
                onChange={(e) => setTextMetalness(parseFloat(e.target.value))} 
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" 
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Roughness: {textRoughness.toFixed(2)}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={textRoughness} 
                onChange={(e) => setTextRoughness(parseFloat(e.target.value))} 
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" 
              />
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-400">3D text that bounces to the music!</p>
      </div>

      {/* Text Animator Section */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-purple-400 mb-2">📝 Text Animator</h3>
        <p className="text-sm text-gray-400 mb-4">Create per-character animated text with customizable offsets and stagger timing</p>
        
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => createTextAnimatorKeyframe(currentTime)} 
            disabled={!fontLoaded}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={16} /> Add Text Keyframe
          </button>
        </div>

        {!fontLoaded && (
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-sm">⚠️ Font not loaded. Upload a font file to use text animator.</p>
          </div>
        )}

        {/* Text Keyframes List */}
        <div className="space-y-3">
          {textAnimatorKeyframes.map(kf => (
            <div key={kf.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-mono text-sm">{formatTime(kf.time)}</span>
                  <span className="text-white font-semibold">{kf.text}</span>
                </div>
                <button 
                  onClick={() => deleteTextAnimatorKeyframe(kf.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Text</label>
                  <input 
                    type="text" 
                    value={kf.text}
                    onChange={(e) => updateTextAnimatorKeyframe(kf.id, { text: e.target.value })}
                    className="w-full bg-gray-600 text-white text-sm px-3 py-1 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Animation</label>
                  <select 
                    value={kf.animation}
                    onChange={(e) => updateTextAnimatorKeyframe(kf.id, { animation: e.target.value })}
                    className="w-full bg-gray-600 text-white text-sm px-3 py-1 rounded"
                  >
                    <option value="fade">Fade In</option>
                    <option value="slide">Slide In</option>
                    <option value="scale">Scale In</option>
                    <option value="bounce">Bounce</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              {kf.animation === 'slide' && (
                <div className="mb-3">
                  <label className="text-xs text-gray-400 block mb-1">Direction</label>
                  <select 
                    value={kf.direction}
                    onChange={(e) => updateTextAnimatorKeyframe(kf.id, { direction: e.target.value })}
                    className="w-full bg-gray-600 text-white text-sm px-3 py-1 rounded"
                  >
                    <option value="up">Up</option>
                    <option value="down">Down</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Stagger (s)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="1"
                    value={kf.stagger}
                    onChange={(e) => updateTextAnimatorKeyframe(kf.id, { stagger: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-600 text-white text-sm px-3 py-1 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Duration (s)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    max="5"
                    value={kf.duration}
                    onChange={(e) => updateTextAnimatorKeyframe(kf.id, { duration: parseFloat(e.target.value) || 0.5 })}
                    className="w-full bg-gray-600 text-white text-sm px-3 py-1 rounded"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input 
                    type="checkbox" 
                    checked={kf.visible}
                    onChange={(e) => updateTextAnimatorKeyframe(kf.id, { visible: e.target.checked })}
                    className="rounded"
                  />
                  Visible
                </label>
              </div>
            </div>
          ))}

          {textAnimatorKeyframes.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No text keyframes yet. Click "Add Text Keyframe" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
