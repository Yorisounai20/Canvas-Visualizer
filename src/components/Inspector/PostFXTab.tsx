import React from 'react';

interface PostFXTabProps {
  blendMode: string;
  vignetteStrength: number;
  vignetteSoftness: number;
  colorSaturation: number;
  colorContrast: number;
  colorGamma: number;
  colorTintR: number;
  colorTintG: number;
  colorTintB: number;
  setBlendMode: (mode: string) => void;
  setVignetteStrength: (value: number) => void;
  setVignetteSoftness: (value: number) => void;
  setColorSaturation: (value: number) => void;
  setColorContrast: (value: number) => void;
  setColorGamma: (value: number) => void;
  setColorTintR: (value: number) => void;
  setColorTintG: (value: number) => void;
  setColorTintB: (value: number) => void;
}

/**
 * Post-FX Tab Component - Blend Mode, Vignette, Color Grading, Tint
 * Extracted from visualizer-software-COMPREHENSIVE-BACKUP.tsx lines 10386-10575 (190 lines)
 * 
 * Features:
 * - 🎭 Blend Mode dropdown
 * - 🌫️ Vignette (Strength, Softness, Reset)
 * - 🎨 Color Grading (Saturation, Contrast, Gamma, Reset)
 * - 🌈 Color Tint (Red, Green, Blue multipliers)
 */
export default function PostFXTab({
  blendMode,
  vignetteStrength,
  vignetteSoftness,
  colorSaturation,
  colorContrast,
  colorGamma,
  colorTintR,
  colorTintG,
  colorTintB,
  setBlendMode,
  setVignetteStrength,
  setVignetteSoftness,
  setColorSaturation,
  setColorContrast,
  setColorGamma,
  setColorTintR,
  setColorTintG,
  setColorTintB
}: PostFXTabProps) {
  return (
    <div>
      {/* Blend Mode Section */}
      <div className="mb-4 bg-gray-700 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎭 Blend Mode</h3>
        <p className="text-xs text-gray-400 mb-3">Layer blending affects how objects combine visually</p>
        <select 
          value={blendMode} 
          onChange={(e) => setBlendMode(e.target.value)}
          className="w-full bg-gray-600 text-white text-sm px-3 py-2 rounded"
        >
          <option value="normal">Normal (Standard)</option>
          <option value="additive">Additive (Brighten)</option>
          <option value="multiply">Multiply (Darken)</option>
          <option value="screen">Screen (Lighten)</option>
        </select>
      </div>

      {/* Vignette Section */}
      <div className="mb-4 bg-gray-700 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">🌫️ Vignette</h3>
        <p className="text-xs text-gray-400 mb-3">Edge darkening effect for cinematic look</p>
        
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400">Strength</label>
            <span className="text-xs text-cyan-300">{vignetteStrength.toFixed(2)}</span>
          </div>
          <input 
            type="range"
            min="0" 
            max="1" 
            step="0.01" 
            value={vignetteStrength} 
            onChange={(e) => setVignetteStrength(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400">Softness</label>
            <span className="text-xs text-cyan-300">{vignetteSoftness.toFixed(2)}</span>
          </div>
          <input 
            type="range"
            min="0" 
            max="1" 
            step="0.01" 
            value={vignetteSoftness} 
            onChange={(e) => setVignetteSoftness(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <button 
          onClick={() => { 
            setVignetteStrength(0); 
            setVignetteSoftness(0.5); 
          }}
          className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-white w-full"
        >
          Reset Vignette
        </button>
      </div>

      {/* Color Grading Section */}
      <div className="mb-4 bg-gray-700 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎨 Color Grading</h3>
        <p className="text-xs text-gray-400 mb-3">Adjust overall image tone and color</p>
        
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400">Saturation</label>
            <span className="text-xs text-cyan-300">{colorSaturation.toFixed(2)}x</span>
          </div>
          <input 
            type="range"
            min="0" 
            max="2" 
            step="0.01" 
            value={colorSaturation} 
            onChange={(e) => setColorSaturation(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">0 = grayscale, 1 = normal, 2 = vivid</p>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400">Contrast</label>
            <span className="text-xs text-cyan-300">{colorContrast.toFixed(2)}x</span>
          </div>
          <input 
            type="range"
            min="0.5" 
            max="2" 
            step="0.01" 
            value={colorContrast} 
            onChange={(e) => setColorContrast(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Lower = flat, higher = punchy</p>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400">Gamma</label>
            <span className="text-xs text-cyan-300">{colorGamma.toFixed(2)}</span>
          </div>
          <input 
            type="range"
            min="0.5" 
            max="2" 
            step="0.01" 
            value={colorGamma} 
            onChange={(e) => setColorGamma(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Brightness curve adjustment</p>
        </div>

        <button 
          onClick={() => { 
            setColorSaturation(1.0); 
            setColorContrast(1.0); 
            setColorGamma(1.0); 
          }}
          className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-white w-full mb-3"
        >
          Reset Color Grading
        </button>
      </div>

      {/* Color Tint Section */}
      <div className="mb-4 bg-gray-700 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">🌈 Color Tint</h3>
        <p className="text-xs text-gray-400 mb-3">Apply color cast for mood and atmosphere</p>
        
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-red-400">Red Tint</label>
            <span className="text-xs text-cyan-300">{colorTintR.toFixed(2)}x</span>
          </div>
          <input 
            type="range"
            min="0" 
            max="2" 
            step="0.01" 
            value={colorTintR} 
            onChange={(e) => setColorTintR(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-green-400">Green Tint</label>
            <span className="text-xs text-cyan-300">{colorTintG.toFixed(2)}x</span>
          </div>
          <input 
            type="range"
            min="0" 
            max="2" 
            step="0.01" 
            value={colorTintG} 
            onChange={(e) => setColorTintG(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-blue-400">Blue Tint</label>
            <span className="text-xs text-cyan-300">{colorTintB.toFixed(2)}x</span>
          </div>
          <input 
            type="range"
            min="0" 
            max="2" 
            step="0.01" 
            value={colorTintB} 
            onChange={(e) => setColorTintB(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <button 
          onClick={() => { 
            setColorTintR(1.0); 
            setColorTintG(1.0); 
            setColorTintB(1.0); 
          }}
          className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-white w-full"
        >
          Reset Color Tint
        </button>
      </div>
    </div>
  );
}
