import React, { useState, useEffect } from 'react';
import { X, Save, Clock, AlertCircle } from 'lucide-react';
import { autosaveService } from '../../lib/autosaveService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Settings Modal
 * Allows users to configure application settings like autosave
 */
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [autosaveInterval, setAutosaveInterval] = useState(3); // in minutes
  const [hasChanges, setHasChanges] = useState(false);

  // Load current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const settings = autosaveService.getSettings();
      setAutosaveEnabled(settings.enabled);
      setAutosaveInterval(settings.intervalMs / 60000); // Convert ms to minutes
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    // Update autosave settings
    autosaveService.updateSettings({
      enabled: autosaveEnabled,
      intervalMs: autosaveInterval * 60000, // Convert minutes to ms
    });
    
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    // Reset to current settings
    const settings = autosaveService.getSettings();
    setAutosaveEnabled(settings.enabled);
    setAutosaveInterval(settings.intervalMs / 60000);
    setHasChanges(false);
    onClose();
  };

  const handleAutosaveToggle = (enabled: boolean) => {
    setAutosaveEnabled(enabled);
    setHasChanges(true);
  };

  const handleIntervalChange = (minutes: number) => {
    // Clamp between 1 and 30 minutes
    const clampedMinutes = Math.max(1, Math.min(30, minutes));
    setAutosaveInterval(clampedMinutes);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#2B2B2B] border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-cyan-600 px-5 py-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ⚙️ Settings
          </h2>
          <button
            onClick={handleCancel}
            className="p-1 rounded hover:bg-white/20 transition-colors text-white"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {/* Autosave Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Save size={18} className="text-cyan-400" />
                <h3 className="text-base font-semibold text-white">Autosave</h3>
              </div>
            </div>

            {/* Enable/Disable Autosave */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-300">
                  Enable Autosave
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically save your project at regular intervals
                </p>
              </div>
              <button
                onClick={() => handleAutosaveToggle(!autosaveEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autosaveEnabled ? 'bg-cyan-600' : 'bg-gray-600'
                }`}
                role="switch"
                aria-checked={autosaveEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autosaveEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Autosave Interval */}
            {autosaveEnabled && (
              <div className="space-y-2 pl-4 border-l-2 border-cyan-600/30">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <label className="text-sm font-medium text-gray-300">
                    Autosave Interval
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={autosaveInterval}
                    onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgb(8, 145, 178) 0%, rgb(8, 145, 178) ${((autosaveInterval - 1) / 29) * 100}%, rgb(55, 65, 81) ${((autosaveInterval - 1) / 29) * 100}%, rgb(55, 65, 81) 100%)`
                    }}
                  />
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={autosaveInterval}
                      onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                      className="w-14 px-2 py-1 text-sm bg-[#1E1E1E] border border-gray-600 rounded text-white text-center focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="text-sm text-gray-400">min</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Project will be auto-saved every {autosaveInterval} minute{autosaveInterval !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="flex gap-3 p-3 bg-blue-950/30 border border-blue-800/40 rounded-lg">
              <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-300 space-y-1">
                <p>
                  {autosaveEnabled 
                    ? 'Autosave creates version snapshots without requiring manual saves. You can restore previous versions from the project history.'
                    : 'With autosave disabled, you must manually save your project to preserve changes. Use Ctrl+S or the File menu to save.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#1E1E1E] px-5 py-3 flex justify-end gap-3 border-t border-gray-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              hasChanges
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700 shadow-lg'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
