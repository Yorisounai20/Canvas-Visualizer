import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

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
  // Letterbox props
  showLetterbox: boolean;
  letterboxSize: number;
  setShowLetterbox: (show: boolean) => void;
  setLetterboxSize: (size: number) => void;
  useLetterboxAnimation: boolean;
  setUseLetterboxAnimation: (use: boolean) => void;
  letterboxKeyframes: Array<{
    id: number;
    time: number;
    targetSize: number;
    invert: boolean;
  }>;
  setLetterboxKeyframes: (keyframes: Array<{
    id: number;
    time: number;
    targetSize: number;
    invert: boolean;
  }>) => void;
  currentTime: number;
  duration: number;
  nextLetterboxKeyframeId: React.MutableRefObject<number>;
}

/**
 * Effects Tab Component - Visual Effects & Background
 * Extracted from visualizer-software-COMPREHENSIVE-BACKUP.tsx lines 9740-9917 (178 lines)
 * 
 * Features:
 * - Background Type (Solid, Gradient, Image, Stars, Galaxy, Nebula)
 * - Background Color
 * - Border Color
 * - Letterbox Keyframe Controls (Issue #5)
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
  setBorderColor,
  showLetterbox,
  letterboxSize,
  setShowLetterbox,
  setLetterboxSize,
  useLetterboxAnimation,
  setUseLetterboxAnimation,
  letterboxKeyframes,
  setLetterboxKeyframes,
  currentTime,
  duration,
  nextLetterboxKeyframeId
}: EffectsTabProps) {
  const [letterboxExpanded, setLetterboxExpanded] = useState(false);
  const [newKeyframeTime, setNewKeyframeTime] = useState('0:00');
  
  const addLetterboxKeyframe = () => {
    const time = parseTimeInput(newKeyframeTime);
    if (isNaN(time) || time < 0 || time > duration) return;
    
    const newKeyframe = {
      id: nextLetterboxKeyframeId.current++,
      time,
      targetSize: letterboxSize,
      invert: false
    };
    setLetterboxKeyframes([...letterboxKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
    setNewKeyframeTime('0:00');
  };
  
  const deleteLetterboxKeyframe = (id: number) => {
    setLetterboxKeyframes(letterboxKeyframes.filter(k => k.id !== id));
  };
  
  const updateLetterboxKeyframe = (id: number, updates: Partial<{targetSize: number; invert: boolean}>) => {
    setLetterboxKeyframes(letterboxKeyframes.map(k => k.id === id ? {...k, ...updates} : k));
  };
  
  const parseTimeInput = (input: string): number => {
    const parts = input.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      
      {/* Letterbox Controls Section */}
      <div className="bg-gray-700 rounded-lg p-3 mt-3">
        <div 
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={() => setLetterboxExpanded(!letterboxExpanded)}
        >
          <h3 className="text-sm font-semibold text-cyan-400">🎬 Letterbox</h3>
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform ${letterboxExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
        
        {letterboxExpanded && (
          <div className="space-y-3">
            {/* Enable/Disable */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showLetterbox"
                checked={showLetterbox}
                onChange={(e) => setShowLetterbox(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showLetterbox" className="text-xs text-gray-300">
                Enable Letterbox
              </label>
            </div>
            
            {showLetterbox && (
              <>
                {/* Animation Mode Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseLetterboxAnimation(false)}
                    className={`flex-1 px-3 py-2 rounded text-xs ${
                      !useLetterboxAnimation
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    ⏱️ Manual
                  </button>
                  <button
                    onClick={() => setUseLetterboxAnimation(true)}
                    className={`flex-1 px-3 py-2 rounded text-xs ${
                      useLetterboxAnimation
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    🎬 Animated
                  </button>
                </div>
                
                {/* Manual Mode - Direct Size Control */}
                {!useLetterboxAnimation && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Size: {letterboxSize}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={letterboxSize}
                      onChange={(e) => setLetterboxSize(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
                    />
                  </div>
                )}
                
                {/* Animated Mode - Keyframe Management */}
                {useLetterboxAnimation && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">
                      Add keyframes to animate letterbox over time
                    </p>
                    
                    {/* Add Keyframe */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyframeTime}
                        onChange={(e) => setNewKeyframeTime(e.target.value)}
                        placeholder="0:00"
                        className="flex-1 px-2 py-1 bg-gray-600 text-white text-xs rounded"
                      />
                      <button
                        onClick={addLetterboxKeyframe}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex items-center gap-1"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    
                    {/* Keyframe List */}
                    {letterboxKeyframes.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {letterboxKeyframes.map((kf) => (
                          <div key={kf.id} className="bg-gray-800 rounded p-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-300 font-mono">
                                {formatTime(kf.time)}
                              </span>
                              <button
                                onClick={() => deleteLetterboxKeyframe(kf.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">
                                Target Size: {kf.targetSize}px
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={kf.targetSize}
                                onChange={(e) =>
                                  updateLetterboxKeyframe(kf.id, {
                                    targetSize: Number(e.target.value)
                                  })
                                }
                                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`invert-${kf.id}`}
                                checked={kf.invert}
                                onChange={(e) =>
                                  updateLetterboxKeyframe(kf.id, {
                                    invert: e.target.checked
                                  })
                                }
                                className="w-4 h-4"
                              />
                              <label
                                htmlFor={`invert-${kf.id}`}
                                className="text-xs text-gray-300"
                              >
                                Invert (curtain mode)
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {letterboxKeyframes.length === 0 && (
                      <p className="text-xs text-gray-500 italic text-center py-2">
                        No keyframes yet. Add one to start animating.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
