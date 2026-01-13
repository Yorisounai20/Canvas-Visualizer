import React from 'react';
import { RotateCcw } from 'lucide-react';

type MaterialType = 'basic' | 'standard' | 'phong' | 'lambert';

interface ControlsTabProps {
  // Background Controls (optional - moved from Effects tab per user request)
  skyboxType?: 'color' | 'gradient' | 'image' | 'stars' | 'galaxy' | 'nebula';
  backgroundColor?: string;
  borderColor?: string;
  setSkyboxType?: (type: 'color' | 'gradient' | 'image' | 'stars' | 'galaxy' | 'nebula') => void;
  setBackgroundColor?: (color: string) => void;
  setBorderColor?: (color: string) => void;
  
  // Global Colors (DEPRECATED - keeping for backwards compatibility but hidden from UI)
  bassColor: string;
  midsColor: string;
  highsColor: string;
  setBassColor: (color: string) => void;
  setMidsColor: (color: string) => void;
  setHighsColor: (color: string) => void;
  
  // Cube Materials
  cubeWireframe: boolean;
  cubeOpacity: number;
  cubeColor: string;
  cubeMaterialType: MaterialType;
  cubeMetalness: number;
  cubeRoughness: number;
  setCubeWireframe: (wireframe: boolean) => void;
  setCubeOpacity: (opacity: number) => void;
  setCubeColor: (color: string) => void;
  setCubeMaterialType: (type: MaterialType) => void;
  setCubeMetalness: (metalness: number) => void;
  setCubeRoughness: (roughness: number) => void;
  
  // Octahedron Materials
  octahedronWireframe: boolean;
  octahedronOpacity: number;
  octahedronColor: string;
  octahedronMaterialType: MaterialType;
  octahedronMetalness: number;
  octahedronRoughness: number;
  setOctahedronWireframe: (wireframe: boolean) => void;
  setOctahedronOpacity: (opacity: number) => void;
  setOctahedronColor: (color: string) => void;
  setOctahedronMaterialType: (type: MaterialType) => void;
  setOctahedronMetalness: (metalness: number) => void;
  setOctahedronRoughness: (roughness: number) => void;
  
  // Tetrahedron Materials
  tetrahedronWireframe: boolean;
  tetrahedronOpacity: number;
  tetrahedronColor: string;
  tetrahedronMaterialType: MaterialType;
  tetrahedronMetalness: number;
  tetrahedronRoughness: number;
  setTetrahedronWireframe: (wireframe: boolean) => void;
  setTetrahedronOpacity: (opacity: number) => void;
  setTetrahedronColor: (color: string) => void;
  setTetrahedronMaterialType: (type: MaterialType) => void;
  setTetrahedronMetalness: (metalness: number) => void;
  setTetrahedronRoughness: (roughness: number) => void;
  
  // Sphere Materials
  sphereWireframe: boolean;
  sphereOpacity: number;
  sphereColor: string;
  sphereMaterialType: MaterialType;
  sphereMetalness: number;
  sphereRoughness: number;
  setSphereWireframe: (wireframe: boolean) => void;
  setSphereOpacity: (opacity: number) => void;
  setSphereColor: (color: string) => void;
  setSphereMaterialType: (type: MaterialType) => void;
  setSphereMetalness: (metalness: number) => void;
  setSphereRoughness: (roughness: number) => void;
}

/**
 * Controls Tab Component - Shape Materials and Global Colors
 * 
 * Features:
 * - Shape Material controls for Cubes, Octahedrons, Tetrahedrons, Sphere
 * - Material Type selection (Basic, Standard, Phong, Lambert)
 * - Color, Opacity, Wireframe controls
 * - PBR properties (Metalness, Roughness) for Standard materials
 * - Reset button to restore defaults
 * - Global color controls (Bass, Mids, Highs)
 */
export default function ControlsTab(props: ControlsTabProps) {
  const resetToDefaults = () => {
    // Cubes
    props.setCubeWireframe(true);
    props.setCubeOpacity(0.6);
    props.setCubeColor('#8a2be2');
    props.setCubeMaterialType('basic');
    props.setCubeMetalness(0.5);
    props.setCubeRoughness(0.5);
    
    // Octahedrons
    props.setOctahedronWireframe(true);
    props.setOctahedronOpacity(0.5);
    props.setOctahedronColor('#40e0d0');
    props.setOctahedronMaterialType('basic');
    props.setOctahedronMetalness(0.5);
    props.setOctahedronRoughness(0.5);
    
    // Tetrahedrons
    props.setTetrahedronWireframe(false);
    props.setTetrahedronOpacity(0.7);
    props.setTetrahedronColor('#c8b4ff');
    props.setTetrahedronMaterialType('basic');
    props.setTetrahedronMetalness(0.5);
    props.setTetrahedronRoughness(0.5);
    
    // Sphere
    props.setSphereWireframe(true);
    props.setSphereOpacity(0.4);
    props.setSphereColor('#8a2be2');
    props.setSphereMaterialType('basic');
    props.setSphereMetalness(0.5);
    props.setSphereRoughness(0.5);
  };

  const renderMaterialControls = (
    shapeName: string,
    wireframe: boolean,
    opacity: number,
    color: string,
    materialType: MaterialType,
    metalness: number,
    roughness: number,
    setWireframe: (v: boolean) => void,
    setOpacity: (v: number) => void,
    setColor: (v: string) => void,
    setMaterialType: (v: MaterialType) => void,
    setMetalness: (v: number) => void,
    setRoughness: (v: number) => void
  ) => (
    <div className="bg-gray-700 rounded-lg p-3 space-y-3">
      <h4 className="text-sm font-semibold text-cyan-400">{shapeName}</h4>
      
      {/* Material Type */}
      <div>
        <label className="text-xs text-gray-400 block mb-2">Material Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(['basic', 'standard', 'phong', 'lambert'] as MaterialType[]).map((type) => (
            <button
              key={type}
              onClick={() => setMaterialType(type)}
              className={`px-3 py-1.5 rounded text-xs capitalize ${
                materialType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      {/* Color */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Color</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>
      
      {/* Opacity */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">
          Opacity: {(opacity * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      
      {/* Wireframe */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`${shapeName}-wireframe`}
          checked={wireframe}
          onChange={(e) => setWireframe(e.target.checked)}
          className="cursor-pointer"
        />
        <label htmlFor={`${shapeName}-wireframe`} className="text-xs text-gray-400 cursor-pointer">
          Wireframe Mode
        </label>
      </div>
      
      {/* PBR Properties (only for Standard material) */}
      {materialType === 'standard' && (
        <>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Metalness: {(metalness * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={metalness}
              onChange={(e) => setMetalness(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Roughness: {(roughness * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={roughness}
              onChange={(e) => setRoughness(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Background Controls (moved from Effects tab per user request) */}
      {props.skyboxType !== undefined && (
        <div className="bg-gray-700 rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-semibold text-cyan-400">🎨 Background</h4>
          
          <div>
            <label className="text-xs text-gray-400 block mb-2">Background Type</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button 
                onClick={() => props.setSkyboxType!('color')}
                className={`px-2 py-2 rounded text-xs ${props.skyboxType === 'color' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                Solid Color
              </button>
              <button 
                onClick={() => props.setSkyboxType!('gradient')}
                className={`px-2 py-2 rounded text-xs ${props.skyboxType === 'gradient' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                Gradient
              </button>
              <button 
                onClick={() => props.setSkyboxType!('image')}
                className={`px-2 py-2 rounded text-xs ${props.skyboxType === 'image' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                Image
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => props.setSkyboxType!('stars')}
                className={`px-2 py-2 rounded text-xs ${props.skyboxType === 'stars' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                ✨ Stars
              </button>
              <button 
                onClick={() => props.setSkyboxType!('galaxy')}
                className={`px-2 py-2 rounded text-xs ${props.skyboxType === 'galaxy' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                🌌 Galaxy
              </button>
              <button 
                onClick={() => props.setSkyboxType!('nebula')}
                className={`px-2 py-2 rounded text-xs ${props.skyboxType === 'nebula' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
              >
                🌠 Nebula
              </button>
            </div>
          </div>
          
          {/* Background Color (for solid mode) */}
          {props.skyboxType === 'color' && props.backgroundColor !== undefined && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Background Color</label>
              <input 
                type="color" 
                value={props.backgroundColor} 
                onChange={(e) => props.setBackgroundColor!(e.target.value)} 
                className="w-full h-10 rounded cursor-pointer" 
              />
            </div>
          )}
          
          {/* Border Color */}
          {props.borderColor !== undefined && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Border Color</label>
              <input 
                type="color" 
                value={props.borderColor} 
                onChange={(e) => props.setBorderColor!(e.target.value)} 
                className="w-full h-10 rounded cursor-pointer" 
              />
            </div>
          )}
        </div>
      )}
      
      {/* Shape Materials Header with Reset */}
      <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-white">🎭 Shape Materials</h3>
        <button
          onClick={resetToDefaults}
          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded flex items-center gap-1"
          title="Reset all materials to defaults"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>
      
      {/* Cubes */}
      {renderMaterialControls(
        '🟪 Cubes',
        props.cubeWireframe,
        props.cubeOpacity,
        props.cubeColor,
        props.cubeMaterialType,
        props.cubeMetalness,
        props.cubeRoughness,
        props.setCubeWireframe,
        props.setCubeOpacity,
        props.setCubeColor,
        props.setCubeMaterialType,
        props.setCubeMetalness,
        props.setCubeRoughness
      )}
      
      {/* Octahedrons */}
      {renderMaterialControls(
        '💠 Octahedrons',
        props.octahedronWireframe,
        props.octahedronOpacity,
        props.octahedronColor,
        props.octahedronMaterialType,
        props.octahedronMetalness,
        props.octahedronRoughness,
        props.setOctahedronWireframe,
        props.setOctahedronOpacity,
        props.setOctahedronColor,
        props.setOctahedronMaterialType,
        props.setOctahedronMetalness,
        props.setOctahedronRoughness
      )}
      
      {/* Tetrahedrons */}
      {renderMaterialControls(
        '🔷 Tetrahedrons',
        props.tetrahedronWireframe,
        props.tetrahedronOpacity,
        props.tetrahedronColor,
        props.tetrahedronMaterialType,
        props.tetrahedronMetalness,
        props.tetrahedronRoughness,
        props.setTetrahedronWireframe,
        props.setTetrahedronOpacity,
        props.setTetrahedronColor,
        props.setTetrahedronMaterialType,
        props.setTetrahedronMetalness,
        props.setTetrahedronRoughness
      )}
      
      {/* Sphere */}
      {renderMaterialControls(
        '🔮 Sphere',
        props.sphereWireframe,
        props.sphereOpacity,
        props.sphereColor,
        props.sphereMaterialType,
        props.sphereMetalness,
        props.sphereRoughness,
        props.setSphereWireframe,
        props.setSphereOpacity,
        props.setSphereColor,
        props.setSphereMaterialType,
        props.setSphereMetalness,
        props.setSphereRoughness
      )}
    </div>
  );
}
