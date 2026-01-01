import React from 'react';
import { Terminal, X } from 'lucide-react';
import { LogEntry } from '../../types';

interface DebugConsoleProps {
  logs: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * DebugConsole Component - Collapsible debug log panel
 * Displays timestamped log entries with color-coded types
 * Shows last 10 messages
 */
export default function DebugConsole({ logs, isOpen, onToggle }: DebugConsoleProps) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Show Debug Console"
      >
        <Terminal size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-200">Debug Console</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
          title="Hide Debug Console"
        >
          <X size={16} />
        </button>
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No log entries</p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 p-2 rounded ${
                log.type === 'error'
                  ? 'bg-red-900 bg-opacity-20 text-red-300'
                  : log.type === 'success'
                  ? 'bg-green-900 bg-opacity-20 text-green-300'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
              <span className="flex-1 break-words">{log.message}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 bg-gray-800">
        <p className="text-xs text-gray-500">
          Showing last {Math.min(logs.length, 10)} messages
        </p>
      </div>
    </div>
  );
}
