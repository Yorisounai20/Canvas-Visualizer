import React from 'react';
import { Copy, Trash2, Undo2, Redo2, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { WorkspaceObject } from '../../types';

/**
 * Workspace Actions Component
 * Blender-like action buttons for workspace operations
 */

interface WorkspaceActionsProps {
  selectedObjectId: string | null;
  workspaceObjects: WorkspaceObject[];
  canUndo: boolean;
  canRedo: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleVisibility: () => void;
  onShowHelp: () => void;
}

export function WorkspaceActions({
  selectedObjectId,
  workspaceObjects,
  canUndo,
  canRedo,
  onDuplicate,
  onDelete,
  onUndo,
  onRedo,
  onSelectAll,
  onDeselectAll,
  onToggleVisibility,
  onShowHelp
}: WorkspaceActionsProps) {
  const selectedObject = workspaceObjects.find(obj => obj.id === selectedObjectId);
  const hasSelection = selectedObjectId !== null;

  return (
    <div className="mb-3 pb-3 border-b border-gray-700">
      <div className="text-xs font-semibold text-gray-400 mb-2">
        Actions
      </div>

      {/* Edit Actions */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex-1 px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
            canUndo
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3 h-3" />
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex-1 px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
            canRedo
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3 h-3" />
          Redo
        </button>
      </div>

      {/* Object Actions */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={onDuplicate}
          disabled={!hasSelection}
          className={`flex-1 px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
            hasSelection
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          title="Duplicate (Shift+D)"
        >
          <Copy className="w-3 h-3" />
          Duplicate
        </button>
        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className={`flex-1 px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
            hasSelection
              ? 'bg-red-600 text-white hover:bg-red-500'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          title="Delete (X or Delete)"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>

      {/* Selection Actions */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={onSelectAll}
          disabled={workspaceObjects.length === 0}
          className={`flex-1 px-2 py-1 rounded text-xs ${
            workspaceObjects.length > 0
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          title="Select All (Ctrl+A)"
        >
          Select All
        </button>
        <button
          onClick={onDeselectAll}
          disabled={!hasSelection}
          className={`flex-1 px-2 py-1 rounded text-xs ${
            hasSelection
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          title="Deselect (Esc)"
        >
          Deselect
        </button>
      </div>

      {/* Visibility Toggle */}
      {hasSelection && (
        <button
          onClick={onToggleVisibility}
          className="w-full px-2 py-1 rounded text-xs flex items-center justify-center gap-1 bg-gray-700 text-white hover:bg-gray-600 mb-2"
          title="Toggle Visibility (H)"
        >
          {selectedObject?.visible ? (
            <>
              <EyeOff className="w-3 h-3" />
              Hide
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              Show
            </>
          )}
        </button>
      )}

      {/* Help Button */}
      <button
        onClick={onShowHelp}
        className="w-full px-2 py-1 rounded text-xs flex items-center justify-center gap-1 bg-purple-600 text-white hover:bg-purple-500"
        title="Keyboard Shortcuts (?)"
      >
        <HelpCircle className="w-3 h-3" />
        Shortcuts (?)
      </button>

      {/* Quick Tips */}
      <div className="mt-2 text-xs text-gray-500 italic space-y-1">
        <div>💡 Shift+D to duplicate</div>
        <div>💡 X or Del to delete</div>
        <div>💡 Ctrl+Z/Y for undo/redo</div>
      </div>
    </div>
  );
}
