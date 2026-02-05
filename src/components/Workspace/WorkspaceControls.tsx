import React, { useState } from 'react';
import { Plus, Box, Circle, Square, Torus, Grid3x3, Copy, Sparkles, Cuboid, Save, Play, Palette, Sliders, Download, Type } from 'lucide-react';
import { PoseSnapshot, WorkspaceObject } from '../../types';
import { savePose as savePoseToStore, listPoses } from '../../lib/poseStore';
import { getDescriptorBySolver, updateDescriptorParameters } from '../../lib/descriptorStore';
import { exportWorkspaceAsPreset, canExportWorkspace, getAvailableSolvers } from '../../lib/workspaceExport';
import { WorkspaceActions } from './WorkspaceActions';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

/**
 * PHASE 3: Workspace Controls Component
 * Provides UI for manual object creation in the 3D workspace
 * PR 1: Added pose snapshot controls
 */

interface WorkspaceControlsProps {
  onCreateObject: (type: 'sphere' | 'box' | 'plane' | 'torus' | 'instances' | 'text') => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showAxes: boolean;
  onToggleAxes: () => void;
  gridSize?: number;
  gridDivisions?: number;
  onGridSizeChange?: (size: number) => void;
  onGridDivisionsChange?: (divisions: number) => void;
  useWorkspaceObjects: boolean;
  onToggleVisualizationSource: () => void;
  workspaceObjects: WorkspaceObject[]; // PR 1: For pose snapshots
  // PR 5: Preset Authoring Mode
  presetAuthoringMode?: boolean;
  onTogglePresetAuthoring?: () => void;
  selectedPreset?: string;
  onSelectPreset?: (preset: string) => void;
  mockTime?: number;
  onMockTimeChange?: (time: number) => void;
  mockAudio?: { bass: number; mids: number; highs: number };
  onMockAudioChange?: (audio: { bass: number; mids: number; highs: number }) => void;
  // Blender-like Actions
  selectedObjectId?: string | null;
  onDuplicateObject?: () => void;
  onDeleteObject?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onToggleObjectVisibility?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

/**
 * PR 6: Preset Parameters Editor Component
 * Allows editing preset descriptor parameters in real-time
 */
interface PresetParametersEditorProps {
  presetName: string;
}

function PresetParametersEditor({ presetName }: PresetParametersEditorProps) {
  const descriptor = getDescriptorBySolver(presetName);
  
  if (!descriptor) {
    return null;
  }

  const handleParameterChange = (paramName: string, value: number) => {
    updateDescriptorParameters(descriptor.id, { [paramName]: value });
  };

  // Define parameter ranges (could be stored in descriptor metadata in future)
  const parameterRanges: Record<string, { min: number; max: number; step: number }> = {
    speed: { min: 0.1, max: 5.0, step: 0.1 },
    radius: { min: 1, max: 50, step: 1 },
    planetScale: { min: 0.1, max: 3.0, step: 0.1 },
    moonScale: { min: 0.1, max: 2.0, step: 0.1 },
    asteroidSpeed: { min: 0.1, max: 10.0, step: 0.1 },
    sunPulse: { min: 0, max: 3.0, step: 0.1 },
    audioReactivity: { min: 0, max: 3.0, step: 0.1 }
  };

  return (
    <div className="mb-3 pb-3 border-b border-gray-700">
      <div className="text-xs font-semibold text-gray-400 mb-2">
        <Sliders className="w-3 h-3 inline mr-1" />
        Preset Parameters
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        {descriptor.name}
      </div>

      <div className="space-y-2">
        {Object.entries(descriptor.parameters).map(([paramName, paramValue]) => {
          const range = parameterRanges[paramName] || { min: 0, max: 10, step: 0.1 };
          
          return (
            <div key={paramName}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span className="capitalize">{paramName.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span>{paramValue.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={paramValue}
                onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-500 italic mt-2">
        🎨 Adjust parameters to customize preset motion
      </div>
    </div>
  );
}

export default function WorkspaceControls({
  onCreateObject,
  showGrid,
  onToggleGrid,
  showAxes,
  onToggleAxes,
  gridSize = 40,
  gridDivisions = 40,
  onGridSizeChange,
  onGridDivisionsChange,
  useWorkspaceObjects,
  onToggleVisualizationSource,
  workspaceObjects,
  // PR 5: Preset Authoring Mode props
  presetAuthoringMode = false,
  onTogglePresetAuthoring,
  selectedPreset = 'orbit',
  onSelectPreset,
  mockTime = 0,
  onMockTimeChange,
  mockAudio = { bass: 128, mids: 128, highs: 128 },
  onMockAudioChange,
  // Blender-like Actions
  selectedObjectId = null,
  onDuplicateObject,
  onDeleteObject,
  onSelectAll,
  onDeselectAll,
  onToggleObjectVisibility,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo
}: WorkspaceControlsProps) {
  const [poseName, setPoseName] = useState('');
  // PR 8: Export state
  const [exportPresetName, setExportPresetName] = useState('');
  const [exportSolver, setExportSolver] = useState('orbit');
  // Keyboard shortcuts help
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Available presets for authoring mode
  const availablePresets = [
    { value: 'orbit', label: '🌀 Orbital Dance' },
    { value: 'explosion', label: '💥 Explosion' },
    { value: 'tunnel', label: '🚀 Tunnel Rush' },
    { value: 'wave', label: '🌊 Wave Motion' },
    { value: 'spiral', label: '🌌 Spiral Galaxy' },
    { value: 'chill', label: '🎵 Chill Vibes' },
    { value: 'pulse', label: '⚡ Pulse Grid' },
    { value: 'vortex', label: '🌪️ Vortex Storm' },
  ];

  const handleSavePose = () => {
    if (!poseName.trim()) {
      alert('Please enter a pose name');
      return;
    }

    if (workspaceObjects.length === 0) {
      alert('No workspace objects to save. Create some objects first.');
      return;
    }

    // Create snapshot from current workspace objects
    const snapshot: PoseSnapshot = {
      id: `pose_${Date.now()}`,
      name: poseName.trim(),
      timestamp: new Date().toISOString(),
      objects: workspaceObjects.map(obj => ({
        objectId: obj.id,
        position: [obj.position.x, obj.position.y, obj.position.z],
        rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z],
        visible: obj.visible,
        material: obj.materialType || 'basic',
        color: obj.color,
        opacity: obj.opacity || 1.0
      }))
    };

    savePoseToStore(poseName.trim(), snapshot);
    setPoseName('');
    alert(`Pose "${poseName.trim()}" saved! (${workspaceObjects.length} objects)`);
  };

  // PR 8: Handle preset export
  const handleExportPreset = () => {
    const result = exportWorkspaceAsPreset(workspaceObjects, {
      presetName: exportPresetName.trim(),
      solverName: exportSolver,
      includeParameters: true
    });

    if (result.success) {
      alert(result.message);
      setExportPresetName('');
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700 overflow-y-auto">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          🔨 Workspace Controls
        </h3>
      </div>
      <div className="p-3 space-y-2">{/* Content container */}
      
      {/* Blender-like Actions */}
      {onDuplicateObject && onDeleteObject && onUndo && onRedo && (
        <WorkspaceActions
          selectedObjectId={selectedObjectId}
          workspaceObjects={workspaceObjects}
          canUndo={canUndo}
          canRedo={canRedo}
          onDuplicate={onDuplicateObject}
          onDelete={onDeleteObject}
          onUndo={onUndo}
          onRedo={onRedo}
          onSelectAll={onSelectAll || (() => {})}
          onDeselectAll={onDeselectAll || (() => {})}
          onToggleVisibility={onToggleObjectVisibility || (() => {})}
          onShowHelp={() => setShowShortcutsHelp(true)}
        />
      )}
      
      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsHelp && (
        <KeyboardShortcutsHelp onClose={() => setShowShortcutsHelp(false)} />
      )}
      
      {/* Visualization Source Toggle */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Visualization Source</div>
        <button
          onClick={onToggleVisualizationSource}
          className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors flex items-center justify-between ${
            useWorkspaceObjects
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title={useWorkspaceObjects ? "Using Workspace Objects" : "Using Preset Shapes"}
        >
          <span className="flex items-center gap-2">
            {useWorkspaceObjects ? <Cuboid className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {useWorkspaceObjects ? 'Workspace' : 'Presets'}
          </span>
          <span className="text-xs opacity-75">
            {useWorkspaceObjects ? 'Manual' : 'Auto'}
          </span>
        </button>
      </div>
      
      {/* Grid and Axes toggles */}
      <div className="flex gap-2 mb-3 pb-3 border-b border-gray-700">
        <button
          onClick={onToggleGrid}
          className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
            showGrid 
              ? 'bg-cyan-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Toggle Grid"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleAxes}
          className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
            showAxes 
              ? 'bg-cyan-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Toggle Axes Helper"
        >
          XYZ
        </button>
      </div>

      {/* Grid size controls */}
      {showGrid && onGridSizeChange && onGridDivisionsChange && (
        <div className="mb-3 pb-3 border-b border-gray-700 space-y-2">
          <div className="text-xs font-semibold text-gray-400 mb-2">Grid Settings</div>
          
          {/* Grid Size */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Size</span>
              <span>{gridSize}</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={gridSize}
              onChange={(e) => onGridSizeChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
            />
          </div>
          
          {/* Grid Divisions */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Divisions</span>
              <span>{gridDivisions}</span>
            </div>
            <input
              type="range"
              min="4"
              max="1024"
              step="4"
              value={gridDivisions}
              onChange={(e) => onGridDivisionsChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
            />
          </div>
        </div>
      )}

      {/* PR 1: Save Pose Section */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-xs font-semibold text-gray-400 mb-2">
          <Save className="w-3 h-3 inline mr-1" />
          Save Pose
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={poseName}
            onChange={(e) => setPoseName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSavePose()}
            placeholder="Pose name..."
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleSavePose}
            className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-xs font-medium text-white transition-colors flex items-center justify-center gap-2"
            title="Save current workspace state as a pose"
          >
            <Save className="w-3 h-3" />
            Save ({workspaceObjects.length} obj)
          </button>
          <div className="text-xs text-gray-500 text-center">
            {listPoses().length} pose{listPoses().length !== 1 ? 's' : ''} saved
          </div>
        </div>
      </div>

      {/* PR 8: Export as Preset */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-xs font-semibold text-gray-400 mb-2">
          <Download className="w-3 h-3 inline mr-1" />
          Export as Preset
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={exportPresetName}
            onChange={(e) => setExportPresetName(e.target.value)}
            placeholder="Preset name..."
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <select
            value={exportSolver}
            onChange={(e) => setExportSolver(e.target.value)}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-purple-500"
          >
            {getAvailableSolvers().map(solver => (
              <option key={solver} value={solver}>
                {solver.charAt(0).toUpperCase() + solver.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportPreset}
            disabled={!exportPresetName.trim() || !canExportWorkspace(workspaceObjects).valid}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded text-xs font-medium text-white transition-colors flex items-center justify-center gap-2"
            title="Create reusable preset from workspace"
          >
            <Download className="w-3 h-3" />
            Export Preset
          </button>
          {!canExportWorkspace(workspaceObjects).valid && (
            <div className="text-xs text-red-400 text-center">
              {canExportWorkspace(workspaceObjects).reason}
            </div>
          )}
        </div>
      </div>

      {/* PR 5: Preset Authoring Mode */}
      {onTogglePresetAuthoring && (
        <div className="mb-3 pb-3 border-b border-gray-700">
          <div className="text-xs font-semibold text-gray-400 mb-2">
            <Palette className="w-3 h-3 inline mr-1" />
            Preset Authoring Mode
          </div>
          
          {/* Toggle */}
          <button
            onClick={onTogglePresetAuthoring}
            className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors mb-2 ${
              presetAuthoringMode
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Preview preset animations in workspace"
          >
            {presetAuthoringMode ? '✓ Authoring Active' : 'Enable Authoring'}
          </button>

          {presetAuthoringMode && (
            <div className="space-y-2 mt-2">
              {/* Preset Selector */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Preset</div>
                <select
                  value={selectedPreset}
                  onChange={(e) => onSelectPreset?.(e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {availablePresets.map(preset => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slider */}
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  Time: {mockTime.toFixed(1)}s
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="0.1"
                  value={mockTime}
                  onChange={(e) => onMockTimeChange?.(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Audio Mock Sliders */}
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Audio Mock</div>
                
                {/* Bass */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-12">Bass</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={mockAudio.bass}
                    onChange={(e) => onMockAudioChange?.({ ...mockAudio, bass: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 w-8">{mockAudio.bass}</span>
                </div>

                {/* Mids */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-12">Mids</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={mockAudio.mids}
                    onChange={(e) => onMockAudioChange?.({ ...mockAudio, mids: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 w-8">{mockAudio.mids}</span>
                </div>

                {/* Highs */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-12">Highs</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={mockAudio.highs}
                    onChange={(e) => onMockAudioChange?.({ ...mockAudio, highs: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 w-8">{mockAudio.highs}</span>
                </div>
              </div>

              {/* Info */}
              <div className="text-xs text-gray-500 italic mt-2">
                💡 Adjust sliders to preview motion. Changes are NOT saved to timeline.
              </div>
            </div>
          )}
        </div>
      )}

      {/* PR 6: Preset Parameters Editor */}
      {presetAuthoringMode && selectedPreset && (
        <PresetParametersEditor
          presetName={selectedPreset}
        />
      )}

      {/* Object creation buttons */}
      <div className="text-xs font-semibold text-gray-400 mb-2">
        <Plus className="w-3 h-3 inline mr-1" />
        Add Object
      </div>
      
      <button
        onClick={() => onCreateObject('sphere')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add Sphere"
      >
        <Circle className="w-4 h-4" />
        Sphere
      </button>

      <button
        onClick={() => onCreateObject('box')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add Box"
      >
        <Box className="w-4 h-4" />
        Box
      </button>

      <button
        onClick={() => onCreateObject('plane')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add Plane"
      >
        <Square className="w-4 h-4" />
        Plane
      </button>

      <button
        onClick={() => onCreateObject('torus')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add Torus"
      >
        <Torus className="w-4 h-4" />
        Torus
      </button>

      <button
        onClick={() => onCreateObject('instances')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add Instanced Mesh (creates multiple copies efficiently)"
      >
        <Copy className="w-4 h-4" />
        Instances
      </button>

      <button
        onClick={() => onCreateObject('text')}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium text-gray-200 transition-colors flex items-center gap-2"
        title="Add 3D Text"
      >
        <Type className="w-4 h-4" />
        Text
      </button>
      </div>{/* End content container */}
    </div>
  );
}
