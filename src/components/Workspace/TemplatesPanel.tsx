import React, { useState } from 'react';
import { FileText, Download, Upload, Sparkles, Info } from 'lucide-react';
import { WorkspaceObject } from '../../types';
import { exportWorkspaceAsPreset, canExportWorkspace, getAvailableSolvers } from '../../lib/workspaceExport';
import { getDescriptorBySolver, listDescriptors, updateDescriptorParameters } from '../../lib/descriptorStore';

/**
 * Templates Panel - Animation Templates and Presets
 * Manages preset descriptors and workspace export
 */

interface TemplatesPanelProps {
  workspaceObjects: WorkspaceObject[];
  presetAuthoringMode?: boolean;
  onTogglePresetAuthoring?: () => void;
  selectedPreset?: string;
  onSelectPreset?: (preset: string) => void;
}

export default function TemplatesPanel({
  workspaceObjects,
  presetAuthoringMode = false,
  onTogglePresetAuthoring,
  selectedPreset,
  onSelectPreset
}: TemplatesPanelProps) {
  const [exportName, setExportName] = useState('');
  const [exportSolver, setExportSolver] = useState('orbit');
  const availableSolvers = getAvailableSolvers();
  const canExport = canExportWorkspace(workspaceObjects).valid;
  const descriptors = listDescriptors();

  const handleExportWorkspace = () => {
    if (!exportName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    if (!canExport) {
      alert('Cannot export: workspace must have at least one object');
      return;
    }

    try {
      const result = exportWorkspaceAsPreset(workspaceObjects, {
        presetName: exportName.trim(),
        solverName: exportSolver,
        includeParameters: true
      });

      alert(`Exported preset: ${result.descriptor.name}\nPose ID: ${result.poseId}`);
      setExportName('');
      console.log('Workspace export successful:', result);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Export Workspace Section */}
      <div className="p-3 border-b border-gray-800">
        <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
          <Upload size={14} />
          Export as Preset
        </div>
        
        <div className="space-y-2">
          <input
            type="text"
            value={exportName}
            onChange={(e) => setExportName(e.target.value)}
            placeholder="Preset name..."
            className="w-full px-2 py-1.5 text-xs bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
          />
          
          <select
            value={exportSolver}
            onChange={(e) => setExportSolver(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
          >
            {availableSolvers.map(solver => (
              <option key={solver} value={solver}>
                {solver.charAt(0).toUpperCase() + solver.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportWorkspace}
            disabled={!canExport || !exportName.trim()}
            className="w-full px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs rounded transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={14} />
            Export Workspace
          </button>

          {!canExport && (
            <div className="text-xs text-yellow-500 flex items-start gap-1 mt-1">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>Add at least one object to export</span>
            </div>
          )}
        </div>
      </div>

      {/* Preset Authoring Mode */}
      {onTogglePresetAuthoring && (
        <div className="p-3 border-b border-gray-800">
          <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
            <Sparkles size={14} />
            Authoring Mode
          </div>
          
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={presetAuthoringMode}
              onChange={onTogglePresetAuthoring}
              className="w-4 h-4 rounded"
            />
            <span>Enable Live Preview</span>
          </label>
          
          <p className="text-xs text-gray-500 mt-2">
            Preview preset animations on workspace objects in real-time
          </p>

          {presetAuthoringMode && onSelectPreset && (
            <select
              value={selectedPreset || ''}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="w-full mt-2 px-2 py-1.5 text-xs bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Select preset...</option>
              {availableSolvers.map(solver => (
                <option key={solver} value={solver}>
                  {solver.charAt(0).toUpperCase() + solver.slice(1)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Saved Descriptors */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
          <FileText size={14} />
          Preset Descriptors ({descriptors.length})
        </div>

        {descriptors.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-xs">No preset descriptors yet</p>
            <p className="text-xs mt-1">Export your workspace to create reusable presets</p>
          </div>
        ) : (
          <div className="space-y-2">
            {descriptors.map((descriptor) => (
              <div
                key={descriptor.id}
                className="bg-gray-800 rounded p-2 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{descriptor.name}</div>
                    <div className="text-xs text-gray-500">
                      Solver: {descriptor.solver}
                    </div>
                    {descriptor.basePose && (
                      <div className="text-xs text-gray-500">
                        Base Pose: {descriptor.basePose}
                      </div>
                    )}
                  </div>
                </div>

                {/* Parameters */}
                {Object.keys(descriptor.parameters).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="text-xs text-gray-500 mb-1">Parameters:</div>
                    <div className="text-xs text-gray-400 space-y-0.5">
                      {Object.entries(descriptor.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-3 border-t border-gray-800 bg-gray-850">
        <div className="text-xs text-gray-500">
          <Info size={12} className="inline mr-1" />
          Templates are reusable animation presets with parameters
        </div>
      </div>
    </div>
  );
}
