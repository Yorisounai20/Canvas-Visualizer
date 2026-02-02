import React, { useState } from 'react';
import { Box, Circle, Square, Torus, Grid3x3, Layers, Clock, FileText } from 'lucide-react';
import { SceneExplorer } from './SceneExplorer';
import SequencerPanel from './SequencerPanel';
import TemplatesPanel from './TemplatesPanel';
import { WorkspaceObject } from '../../types';

/**
 * Workspace Left Panel with Tab System
 * Three tabs: Objects, Sequencer, Templates
 */

type WorkspaceTab = 'objects' | 'sequencer' | 'templates';

interface WorkspaceLeftPanelProps {
  // Objects Tab
  workspaceObjects: WorkspaceObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onDeleteObject: (id: string) => void;
  onCreateObject: (type: 'sphere' | 'box' | 'plane' | 'torus' | 'instances') => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showAxes: boolean;
  onToggleAxes: () => void;
  useWorkspaceObjects: boolean;
  onToggleVisualizationSource: () => void;
  onUpdateObjects: (objects: WorkspaceObject[]) => void;
  
  // Templates/Authoring Mode
  presetAuthoringMode?: boolean;
  onTogglePresetAuthoring?: () => void;
  selectedPreset?: string;
  onSelectPreset?: (preset: string) => void;
  
  // Sequencer
  currentTime?: number;
}

export default function WorkspaceLeftPanel({
  workspaceObjects,
  selectedObjectId,
  onSelectObject,
  onDeleteObject,
  onCreateObject,
  showGrid,
  onToggleGrid,
  showAxes,
  onToggleAxes,
  useWorkspaceObjects,
  onToggleVisualizationSource,
  onUpdateObjects,
  presetAuthoringMode,
  onTogglePresetAuthoring,
  selectedPreset,
  onSelectPreset,
  currentTime
}: WorkspaceLeftPanelProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('objects');

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-800 bg-gray-850">
        <button
          onClick={() => setActiveTab('objects')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'objects'
              ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title="Scene Objects"
        >
          <Layers size={14} />
          <span>Objects</span>
        </button>
        
        <button
          onClick={() => setActiveTab('sequencer')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'sequencer'
              ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title="Pose Sequencer"
        >
          <Clock size={14} />
          <span>Sequencer</span>
        </button>
        
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title="Animation Templates"
        >
          <FileText size={14} />
          <span>Templates</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'objects' && (
          <div className="flex flex-col h-full">
            {/* Object Creation Toolbar */}
            <div className="p-3 border-b border-gray-800 bg-gray-900">
              <div className="text-xs font-semibold text-gray-400 mb-2">Create Objects</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onCreateObject('sphere')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
                  title="Add Sphere"
                >
                  <Circle size={14} />
                  <span>Sphere</span>
                </button>
                <button
                  onClick={() => onCreateObject('box')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
                  title="Add Box"
                >
                  <Box size={14} />
                  <span>Box</span>
                </button>
                <button
                  onClick={() => onCreateObject('plane')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
                  title="Add Plane"
                >
                  <Square size={14} />
                  <span>Plane</span>
                </button>
                <button
                  onClick={() => onCreateObject('torus')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
                  title="Add Torus"
                >
                  <Torus size={14} />
                  <span>Torus</span>
                </button>
              </div>

              {/* Grid and Axes Toggles */}
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={onToggleGrid}
                    className="w-4 h-4 rounded"
                  />
                  <Grid3x3 size={14} />
                  <span>Show Grid</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAxes}
                    onChange={onToggleAxes}
                    className="w-4 h-4 rounded"
                  />
                  <span>Show Axes</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useWorkspaceObjects}
                    onChange={onToggleVisualizationSource}
                    className="w-4 h-4 rounded"
                  />
                  <span>Use Workspace Objects</span>
                </label>
              </div>
            </div>

            {/* Scene Explorer */}
            <div className="flex-1 overflow-y-auto">
              <SceneExplorer
                objects={workspaceObjects}
                selectedObjectId={selectedObjectId}
                onSelectObject={onSelectObject}
                onDeleteObject={onDeleteObject}
              />
            </div>
          </div>
        )}

        {activeTab === 'sequencer' && (
          <SequencerPanel
            workspaceObjects={workspaceObjects}
            onUpdateObjects={onUpdateObjects}
            currentTime={currentTime}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesPanel
            workspaceObjects={workspaceObjects}
            presetAuthoringMode={presetAuthoringMode}
            onTogglePresetAuthoring={onTogglePresetAuthoring}
            selectedPreset={selectedPreset}
            onSelectPreset={onSelectPreset}
          />
        )}
      </div>
    </div>
  );
}
