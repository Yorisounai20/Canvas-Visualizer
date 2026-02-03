import React, { useState } from 'react';
import { Settings, FileText, Save } from 'lucide-react';
import ObjectPropertiesPanel from './ObjectPropertiesPanel';
import TemplatesPanel from './TemplatesPanel';
import PosesPanel from './PosesPanel';
import { WorkspaceActions } from './WorkspaceActions';
import { WorkspaceObject, PoseSnapshot } from '../../types';

/**
 * Workspace Right Panel
 * Contains tabbed interface: Properties, Templates, Poses
 */

type RightPanelTab = 'properties' | 'templates' | 'poses';

interface WorkspaceRightPanelProps {
  // Object properties
  workspaceObjects: WorkspaceObject[];
  selectedObjectId: string | null;
  selectedObject: WorkspaceObject | null;
  onUpdateObject: (id: string, updates: Partial<WorkspaceObject>) => void;
  onDeleteObject: (id: string) => void;
  
  // Camera settings
  cameraDistance?: number;
  cameraHeight?: number;
  cameraRotation?: number;
  onSetCameraDistance?: (value: number) => void;
  onSetCameraHeight?: (value: number) => void;
  onSetCameraRotation?: (value: number) => void;
  
  // Letterbox settings
  showLetterbox?: boolean;
  letterboxSize?: number;
  onSetShowLetterbox?: (value: boolean) => void;
  onSetLetterboxSize?: (value: number) => void;
  
  // Actions
  onDuplicateObject?: () => void;
  onDeleteSelectedObject?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onToggleObjectVisibility?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  
  // Templates/Authoring Mode
  presetAuthoringMode?: boolean;
  onTogglePresetAuthoring?: () => void;
  selectedPreset?: string;
  onSelectPreset?: (preset: string) => void;
  
  // Poses
  onApplyPose?: (pose: PoseSnapshot) => void;
}

export default function WorkspaceRightPanel({
  workspaceObjects,
  selectedObjectId,
  selectedObject,
  onUpdateObject,
  onDeleteObject,
  cameraDistance,
  cameraHeight,
  cameraRotation,
  onSetCameraDistance,
  onSetCameraHeight,
  onSetCameraRotation,
  showLetterbox,
  letterboxSize,
  onSetShowLetterbox,
  onSetLetterboxSize,
  onDuplicateObject,
  onDeleteSelectedObject,
  onSelectAll,
  onDeselectAll,
  onToggleObjectVisibility,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  presetAuthoringMode,
  onTogglePresetAuthoring,
  selectedPreset,
  onSelectPreset,
  onApplyPose
}: WorkspaceRightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-800 bg-gray-850">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'properties'
              ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title="Object Properties"
        >
          <Settings size={14} />
          <span>Properties</span>
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
        
        <button
          onClick={() => setActiveTab('poses')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'poses'
              ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title="Pose Snapshots"
        >
          <Save size={14} />
          <span>Poses</span>
        </button>
      </div>

      {/* Actions Bar - only show on properties tab */}
      {activeTab === 'properties' && (
        <div className="border-b border-gray-800 p-2">
          <WorkspaceActions
            selectedObjectId={selectedObjectId}
            workspaceObjects={workspaceObjects || []}
            canUndo={canUndo || false}
            canRedo={canRedo || false}
            onDuplicate={onDuplicateObject || (() => {})}
            onDelete={onDeleteSelectedObject || (() => {})}
            onUndo={onUndo || (() => {})}
            onRedo={onRedo || (() => {})}
            onSelectAll={onSelectAll || (() => {})}
            onDeselectAll={onDeselectAll || (() => {})}
            onToggleVisibility={onToggleObjectVisibility || (() => {})}
            onShowHelp={() => {}}
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'properties' && (
          <ObjectPropertiesPanel
            selectedObject={selectedObject}
            onUpdateObject={onUpdateObject}
            onDeleteObject={onDeleteObject}
            cameraDistance={cameraDistance}
            cameraHeight={cameraHeight}
            cameraRotation={cameraRotation}
            onSetCameraDistance={onSetCameraDistance}
            onSetCameraHeight={onSetCameraHeight}
            onSetCameraRotation={onSetCameraRotation}
            showLetterbox={showLetterbox}
            letterboxSize={letterboxSize}
            onSetShowLetterbox={onSetShowLetterbox}
            onSetLetterboxSize={onSetLetterboxSize}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesPanel
            workspaceObjects={workspaceObjects || []}
            presetAuthoringMode={presetAuthoringMode}
            onTogglePresetAuthoring={onTogglePresetAuthoring}
            selectedPreset={selectedPreset}
            onSelectPreset={onSelectPreset}
          />
        )}

        {activeTab === 'poses' && (
          <PosesPanel
            workspaceObjects={workspaceObjects || []}
            onApplyPose={onApplyPose}
          />
        )}
      </div>
    </div>
  );
}
