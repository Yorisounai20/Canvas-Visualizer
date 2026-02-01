import React from 'react';
import { X } from 'lucide-react';
import { WORKSPACE_SHORTCUTS, getShortcutsByCategory, getShortcutDisplay } from '../../lib/workspaceShortcuts';

/**
 * Keyboard Shortcuts Help Modal
 * Blender-style shortcuts reference
 */

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  const shortcutsByCategory = getShortcutsByCategory();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4">
          {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
            <div key={category} className="bg-gray-800 rounded-lg p-3">
              <h3 className="text-sm font-bold text-purple-400 mb-2">{category}</h3>
              <div className="space-y-1">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded font-mono text-xs">
                      {getShortcutDisplay(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Tips */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3">
            <h3 className="text-sm font-bold text-blue-400 mb-2">💡 Pro Tips</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Use Shift+D for quick duplication</li>
              <li>• Press Esc to deselect objects</li>
              <li>• Ctrl+Z/Y for undo/redo anytime</li>
              <li>• Press ? to show this help</li>
              <li>• Hold Shift to multi-select (coming soon)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-850 text-center text-xs text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-700 rounded">Esc</kbd> or <kbd className="px-1 py-0.5 bg-gray-700 rounded">?</kbd> to close
        </div>
      </div>
    </div>
  );
}
