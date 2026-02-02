import React from 'react';
import { Activity, Cpu, Eye } from 'lucide-react';
import { WorkspaceObject } from '../../types';

/**
 * Workspace Status Bar
 * Displays guardrails, performance metrics, and workspace status
 */

interface WorkspaceStatusBarProps {
  workspaceObjects: WorkspaceObject[];
  selectedObjectId: string | null;
  fps?: number;
  memoryUsage?: number;
  performanceMode?: 'high' | 'balanced' | 'low';
}

export default function WorkspaceStatusBar({
  workspaceObjects,
  selectedObjectId,
  fps = 60,
  memoryUsage = 0,
  performanceMode = 'balanced'
}: WorkspaceStatusBarProps) {
  const visibleObjects = workspaceObjects.filter(obj => obj.visible).length;
  const selectedObject = workspaceObjects.find(obj => obj.id === selectedObjectId);

  // Calculate performance status
  const getPerformanceStatus = () => {
    if (fps >= 55) return { color: 'text-green-400', label: 'Good' };
    if (fps >= 30) return { color: 'text-yellow-400', label: 'Fair' };
    return { color: 'text-red-400', label: 'Poor' };
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <div className="px-3 py-1.5 flex items-center justify-between text-xs text-gray-400 bg-gray-900">
      {/* Left: Object Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Eye size={12} />
          <span>
            {visibleObjects}/{workspaceObjects.length} visible
          </span>
        </div>

        {selectedObject && (
          <div className="flex items-center gap-2 text-cyan-400">
            <span>•</span>
            <span className="font-medium">{selectedObject.name}</span>
            <span className="text-gray-500">({selectedObject.type})</span>
          </div>
        )}
      </div>

      {/* Center: Performance Guardrails */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity size={12} className={performanceStatus.color} />
          <span className={performanceStatus.color}>
            {fps.toFixed(0)} FPS
          </span>
          <span className="text-gray-600">•</span>
          <span className={performanceStatus.color}>
            {performanceStatus.label}
          </span>
        </div>

        {memoryUsage > 0 && (
          <div className="flex items-center gap-2">
            <Cpu size={12} />
            <span>{memoryUsage.toFixed(1)} MB</span>
          </div>
        )}
      </div>

      {/* Right: Mode Indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          performanceMode === 'high' ? 'bg-green-400' :
          performanceMode === 'balanced' ? 'bg-yellow-400' :
          'bg-red-400'
        }`} />
        <span className="capitalize">{performanceMode} Quality</span>
      </div>
    </div>
  );
}
