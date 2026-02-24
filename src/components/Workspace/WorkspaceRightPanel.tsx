import React from 'react';
import ObjectPropertiesPanel from './ObjectPropertiesPanel';
import { WorkspaceActions } from './WorkspaceActions';
import { WorkspaceObject } from '../../types';

/**
 * Workspace Right Panel
 * Contains object properties editor and action buttons
 */

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
  onRedo
}: WorkspaceRightPanelProps) {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Actions Bar */}
      <div className="border-b border-gray-800 p-2">
        <WorkspaceActions
            selectedObjectId={selectedObjectId}
            workspaceObjects={workspaceObjects}
            canUndo={!!canUndo}
            canRedo={!!canRedo}
            onDuplicate={onDuplicateObject ?? (() => {})}
            onDelete={onDeleteSelectedObject ?? (() => {})}
            onSelectAll={onSelectAll ?? (() => {})}
            onDeselectAll={onDeselectAll ?? (() => {})}
            onToggleVisibility={onToggleObjectVisibility ?? (() => {})}
            onUndo={onUndo ?? (() => {})}
            onRedo={onRedo ?? (() => {})}          onShowHelp={() => console.log('Help requested')}        />
      </div>

      {/* Object Properties */}
      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}
