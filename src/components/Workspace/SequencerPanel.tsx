import React, { useState } from 'react';
import { Save, Play, Trash2, Plus, Clock, Blend } from 'lucide-react';
import { PoseSnapshot, WorkspaceObject } from '../../types';
import { savePose as savePoseToStore, listPoses, deletePose } from '../../lib/poseStore';
import { applyPose } from '../../lib/poseReader';

/**
 * Sequencer Panel - Pose Animation Timeline
 * Manages pose snapshots and timeline-based pose animation
 */

interface SequencerPanelProps {
  workspaceObjects: WorkspaceObject[];
  onUpdateObjects: (objects: WorkspaceObject[]) => void;
  currentTime?: number;
}

export default function SequencerPanel({
  workspaceObjects,
  onUpdateObjects,
  currentTime = 0
}: SequencerPanelProps) {
  const [poseName, setPoseName] = useState('');
  const [poses, setPoses] = useState<PoseSnapshot[]>(listPoses());
  const [blendAmount, setBlendAmount] = useState(1.0);

  const handleSavePose = () => {
    if (!poseName.trim()) {
      alert('Please enter a pose name');
      return;
    }

    const pose: PoseSnapshot = {
      id: `pose-${Date.now()}`,
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
        opacity: obj.opacity || 1
      }))
    };

    savePoseToStore(pose.name, pose);
    setPoses(listPoses());
    setPoseName('');
    console.log(`Saved pose: ${pose.name} with ${pose.objects.length} objects`);
  };

  const handleLoadPose = (pose: PoseSnapshot) => {
    const updatedCount = applyPose(pose, blendAmount, workspaceObjects);
    onUpdateObjects([...workspaceObjects]);
    console.log(`Loaded pose: ${pose.name}, applied to ${updatedCount} objects`);
  };

  const handleDeletePose = (poseId: string) => {
    if (confirm('Are you sure you want to delete this pose?')) {
      deletePose(poseId);
      setPoses(listPoses());
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Save Pose Section */}
      <div className="p-3 border-b border-gray-800">
        <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
          <Save size={14} />
          Save Current Pose
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={poseName}
            onChange={(e) => setPoseName(e.target.value)}
            placeholder="Pose name..."
            className="flex-1 px-2 py-1.5 text-xs bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSavePose()}
          />
          <button
            onClick={handleSavePose}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded transition-colors"
            disabled={!poseName.trim()}
          >
            <Save size={14} />
          </button>
        </div>
      </div>

      {/* Blend Control */}
      <div className="p-3 border-b border-gray-800">
        <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
          <Blend size={14} />
          Blend Amount
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={blendAmount}
            onChange={(e) => setBlendAmount(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-gray-400 w-12 text-right">
            {(blendAmount * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Controls how much of the pose is applied (0% = current, 100% = full pose)
        </p>
      </div>

      {/* Poses List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
          <Clock size={14} />
          Saved Poses ({poses.length})
        </div>

        {poses.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Clock size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-xs">No poses saved yet</p>
            <p className="text-xs mt-1">Create objects and save their arrangement as a pose</p>
          </div>
        ) : (
          <div className="space-y-2">
            {poses.map((pose) => (
              <div
                key={pose.id}
                className="bg-gray-800 rounded p-2 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{pose.name}</div>
                    <div className="text-xs text-gray-500">
                      {pose.objects.length} objects • {new Date(pose.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleLoadPose(pose)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="Load Pose"
                    >
                      <Play size={14} className="text-green-400" />
                    </button>
                    <button
                      onClick={() => handleDeletePose(pose.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="Delete Pose"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Future: Timeline will go here */}
      <div className="p-3 border-t border-gray-800 bg-gray-850">
        <div className="text-xs text-gray-500 text-center">
          <Clock size={14} className="inline mr-1" />
          Timeline sequencing coming soon
        </div>
      </div>
    </div>
  );
}
