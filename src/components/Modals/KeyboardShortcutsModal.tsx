import React from 'react';
import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * PHASE 5: Keyboard Shortcuts Modal
 * Displays all available keyboard shortcuts in a clean, organized modal
 */
export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { category: 'Playback', items: [
      { keys: ['Space'], description: 'Play/Pause audio' },
    ]},
    { category: 'Timeline', items: [
      { keys: ['←', '→'], description: 'Navigate timeline (1 second)' },
      { keys: ['Shift', '+', '←/→'], description: 'Navigate timeline (5 seconds)' },
    ]},
    { category: 'Tools & Modes', items: [
      { keys: ['W'], description: 'Toggle Workspace Mode' },
      { keys: ['`'], description: 'Toggle Debug Console' },
      { keys: ['Esc'], description: 'Close modals/panels' },
    ]},
    { category: 'Editing', items: [
      { keys: ['Ctrl/Cmd', '+', 'Z'], description: 'Undo' },
      { keys: ['Ctrl/Cmd', '+', 'Shift', '+', 'Z'], description: 'Redo' },
      { keys: ['Ctrl/Cmd', '+', 'Y'], description: 'Redo (alternative)' },
    ]},
    { category: 'Workspace (W Mode)', items: [
      { keys: ['Left Click'], description: 'Select object' },
      { keys: ['Left Drag'], description: 'Rotate camera' },
      { keys: ['Right Drag'], description: 'Pan camera' },
      { keys: ['Scroll'], description: 'Zoom camera' },
      { keys: ['T'], description: 'Translate mode' },
      { keys: ['R'], description: 'Rotate mode' },
      { keys: ['S'], description: 'Scale mode' },
    ]},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 rounded-lg w-[600px] max-h-[80vh] overflow-hidden border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] custom-scrollbar">
          {shortcuts.map((category) => (
            <div key={category.category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors">
                    <span className="text-gray-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          {keyIdx > 0 && (
                            <span className="text-gray-500 text-xs mx-1">+</span>
                          )}
                          <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm min-w-[28px] text-center">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400 text-center">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
