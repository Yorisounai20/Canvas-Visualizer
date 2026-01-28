import React, { useState } from 'react';
import { Save, Trash2, Download } from 'lucide-react';
import { PoseSnapshot, WorkspaceObject } from '../../types';
import { savePose, listPoses, deletePose } from '../../lib/poseStore';

/**
 * PR 1: Poses Panel
 * UI for creating, viewing, and managing pose snapshots
 */

interface PosesPanelProps {
  workspaceObjects: WorkspaceObject[];
  onApplyPose?: (pose: PoseSnapshot) => void; // For future PR 3
}

export default function PosesPanel({
  workspaceObjects,
  onApplyPose
}: PosesPanelProps) {
  const [poseName, setPoseName] = useState('');
  const [poses, setPoses] = useState<PoseSnapshot[]>(listPoses());

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

    savePose(poseName.trim(), snapshot);
    setPoses(listPoses());
    setPoseName('');
  };

  const handleDeletePose = (name: string) => {
    if (window.confirm(`Delete pose "${name}"?`)) {
      deletePose(name);
      setPoses(listPoses());
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Save size={18} />
          Pose Snapshots
        </h2>

        {/* Save New Pose */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Save Current Pose</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={poseName}
              onChange={(e) => setPoseName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePose()}
              placeholder="Pose name..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleSavePose}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-medium transition-colors"
              title="Save current workspace state as a pose"
            >
              <Save size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {workspaceObjects.length} object{workspaceObjects.length !== 1 ? 's' : ''} in workspace
          </p>
        </div>
      </div>

      {/* Saved Poses List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">
          Saved Poses ({poses.length})
        </h3>

        {poses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Save size={32} className="mx-auto mb-2 opacity-50" />
            <p>No poses saved yet</p>
            <p className="text-xs mt-1">Create workspace objects and save a pose</p>
          </div>
        ) : (
          <div className="space-y-2">
            {poses.map((pose) => (
              <div
                key={pose.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{pose.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {pose.objects.length} object{pose.objects.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatDate(pose.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePose(pose.name)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete pose"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Preview of objects in pose */}
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Objects:</p>
                  <div className="flex flex-wrap gap-1">
                    {pose.objects.slice(0, 5).map((obj, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-1 bg-gray-700 rounded text-xs"
                        style={{ color: obj.color }}
                      >
                        {obj.objectId.split('_')[0]}
                      </span>
                    ))}
                    {pose.objects.length > 5 && (
                      <span className="inline-block px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
                        +{pose.objects.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Future: Apply pose button (PR 3) */}
                {onApplyPose && (
                  <button
                    onClick={() => onApplyPose(pose)}
                    className="w-full mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs font-medium transition-colors"
                  >
                    <Download size={12} className="inline mr-1" />
                    Apply Pose
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-3 border-t border-gray-800 bg-gray-950">
        <p className="text-xs text-gray-500">
          💡 Poses capture the current position, rotation, and scale of all workspace objects.
        </p>
      </div>
    </div>
  );
}
