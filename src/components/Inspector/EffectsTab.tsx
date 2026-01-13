import React from 'react';

interface EffectsTabProps {
  skyboxType: 'color' | 'gradient' | 'image' | 'stars' | 'galaxy' | 'nebula';
  backgroundColor: string;
  skyboxGradientTop: string;
  skyboxGradientBottom: string;
  skyboxImageUrl: string;
  starCount: number;
  galaxyColor: string;
  nebulaColor1: string;
  nebulaColor2: string;
  borderColor: string;
  setSkyboxType: (type: 'color' | 'gradient' | 'image' | 'stars' | 'galaxy' | 'nebula') => void;
  setBackgroundColor: (color: string) => void;
  setSkyboxGradientTop: (color: string) => void;
  setSkyboxGradientBottom: (color: string) => void;
  setSkyboxImageUrl: (url: string) => void;
  setStarCount: (count: number) => void;
  setGalaxyColor: (color: string) => void;
  setNebulaColor1: (color: string) => void;
  setNebulaColor2: (color: string) => void;
  setBorderColor: (color: string) => void;
}

/**
 * Effects Tab Component - Visual Effects & Background
 * Extracted from visualizer-software-COMPREHENSIVE-BACKUP.tsx lines 9740-9917 (178 lines)
 * 
 * Features:
 * - Background Type (Solid, Gradient, Image, Stars, Galaxy, Nebula)
 * - Background Color
 * - Border Color
 */
export default function EffectsTab({
  skyboxType,
  backgroundColor,
  skyboxGradientTop,
  skyboxGradientBottom,
  skyboxImageUrl,
  starCount,
  galaxyColor,
  nebulaColor1,
  nebulaColor2,
  borderColor,
  setSkyboxType,
  setBackgroundColor,
  setSkyboxGradientTop,
  setSkyboxGradientBottom,
  setSkyboxImageUrl,
  setStarCount,
  setGalaxyColor,
  setNebulaColor1,
  setNebulaColor2,
  setBorderColor
}: EffectsTabProps) {
  return (
    <div>
      <div className="bg-gray-700 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎨 Visual Effects</h3>
        <p className="text-xs text-gray-400 mb-3">Customize the look and feel of the visualization.</p>
        <div className="space-y-3">
          {/* Skybox Type Selection */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Background Type</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button 
                onClick={() => setSkyboxType('color')}
                className={`px-2 py-2 rounded text-xs ${skyboxType === 'color' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                Solid Color
              </button>
              <button 
                onClick={() => setSkyboxType('gradient')}
                className={`px-2 py-2 rounded text-xs ${skyboxType === 'gradient' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                Gradient
              </button>
              <button 
                onClick={() => setSkyboxType('image')}
                className={`px-2 py-2 rounded text-xs ${skyboxType === 'image' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                Image
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setSkyboxType('stars')}
                className={`px-2 py-2 rounded text-xs ${skyboxType === 'stars' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                ✨ Stars
              </button>
              <button 
                onClick={() => setSkyboxType('galaxy')}
                className={`px-2 py-2 rounded text-xs ${skyboxType === 'galaxy' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                🌌 Galaxy
              </button>
              <button 
                onClick={() => setSkyboxType('nebula')}
                className={`px-2 py-2 rounded text-xs ${skyboxType === 'nebula' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                🌠 Nebula
              </button>
            </div>
          </div>
          
          {/* Color Mode Controls */}
          {skyboxType === 'color' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Background Color</label>
              <input 
                type="color" 
                value={backgroundColor} 
                onChange={(e) => setBackgroundColor(e.target.value)} 
                className="w-full h-10 rounded cursor-pointer" 
              />
            </div>
          )}
          
          {/* Gradient Mode Controls */}
          {skyboxType === 'gradient' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Top Color (Sky)</label>
                <input 
                  type="color" 
                  value={skyboxGradientTop} 
                  onChange={(e) => setSkyboxGradientTop(e.target.value)} 
                  className="w-full h-10 rounded cursor-pointer" 
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Bottom Color (Ground)</label>
                <input 
                  type="color" 
                  value={skyboxGradientBottom} 
                  onChange={(e) => setSkyboxGradientBottom(e.target.value)} 
                  className="w-full h-10 rounded cursor-pointer" 
                />
              </div>
            </div>
          )}
          
          {/* Image Mode Controls */}
          {skyboxType === 'image' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Equirectangular Image URL</label>
                <input 
                  type="text" 
                  value={skyboxImageUrl} 
                  onChange={(e) => setSkyboxImageUrl(e.target.value)} 
                  placeholder="https://example.com/skybox.jpg"
                  className="w-full bg-gray-600 text-white text-xs px-3 py-2 rounded" 
                />
              </div>
              <p className="text-xs text-gray-500 italic">
                Use equirectangular (360°) panoramic images. Try free resources like <a href="https://polyhaven.com/hdris" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Poly Haven</a>.
              </p>
            </div>
          )}
          
          {/* Stars Mode Controls */}
          {skyboxType === 'stars' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Star Count: {starCount}</label>
                <input 
                  type="range" 
                  min="1000" 
                  max="10000" 
                  step="500" 
                  value={starCount} 
                  onChange={(e) => setStarCount(Number(e.target.value))} 
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                />
              </div>
              <p className="text-xs text-gray-500 italic">
                Procedurally generated star field with random distribution.
              </p>
            </div>
          )}
          
          {/* Galaxy Mode Controls */}
          {skyboxType === 'galaxy' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Star Count: {starCount}</label>
                <input 
                  type="range" 
                  min="1000" 
                  max="10000" 
                  step="500" 
                  value={starCount} 
                  onChange={(e) => setStarCount(Number(e.target.value))} 
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Galaxy Color</label>
                <input 
                  type="color" 
                  value={galaxyColor} 
                  onChange={(e) => setGalaxyColor(e.target.value)} 
                  className="w-full h-10 rounded cursor-pointer" 
                />
              </div>
              <p className="text-xs text-gray-500 italic">
                Spiral galaxy with colored star clusters.
              </p>
            </div>
          )}
          
          {/* Nebula Mode Controls */}
          {skyboxType === 'nebula' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Star Count: {starCount}</label>
                <input 
                  type="range" 
                  min="1000" 
                  max="10000" 
                  step="500" 
                  value={starCount} 
                  onChange={(e) => setStarCount(Number(e.target.value))} 
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nebula Color 1</label>
                <input 
                  type="color" 
                  value={nebulaColor1} 
                  onChange={(e) => setNebulaColor1(e.target.value)} 
                  className="w-full h-10 rounded cursor-pointer" 
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nebula Color 2</label>
                <input 
                  type="color" 
                  value={nebulaColor2} 
                  onChange={(e) => setNebulaColor2(e.target.value)} 
                  className="w-full h-10 rounded cursor-pointer" 
                />
              </div>
              <p className="text-xs text-gray-500 italic">
                Colorful nebula with gas clouds and stars.
              </p>
            </div>
          )}
          
          <div>
            <label className="text-xs text-gray-400 block mb-1">Border Color</label>
            <input 
              type="color" 
              value={borderColor} 
              onChange={(e) => setBorderColor(e.target.value)} 
              className="w-full h-10 rounded cursor-pointer" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
