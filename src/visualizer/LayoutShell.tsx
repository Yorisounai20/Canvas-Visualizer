import React, { useState } from 'react';
import TopBarPlaceholder from './TopBarPlaceholder';
import PanelContainer from './PanelContainer';
import { Menu, Info, Clock } from 'lucide-react';

type LayoutShellProps = {
  left?: React.ReactNode;
  inspector?: React.ReactNode;
  timeline?: React.ReactNode;
  top?: React.ReactNode;
  children: React.ReactNode; // canvas / main content
};

export default function LayoutShell({ left, inspector, timeline, top, children }: LayoutShellProps) {
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  return (
    <div className="cv-layout flex flex-col h-screen w-full bg-gray-900 overflow-hidden">
      {/* Top bar - fixed height */}
      <header className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-20 relative">
        {top ?? <TopBarPlaceholder />}
      </header>

      {/* Main content area - full width, canvas completely unobstructed */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Center content - main canvas takes full space */}
        <main className="absolute inset-0 overflow-hidden flex flex-col">
          {children}
        </main>

        {/* Floating toggle buttons - small, at edges, don't obstruct canvas */}
        {!showLeftPanel && (
          <button
            onClick={() => setShowLeftPanel(true)}
            className="absolute left-2 top-2 p-2 bg-gray-800/90 hover:bg-gray-700 text-gray-300 rounded-lg shadow-lg z-30 transition-colors"
            title="Show Toolbox"
          >
            <Menu size={20} />
          </button>
        )}

        {!showInspector && (
          <button
            onClick={() => setShowInspector(true)}
            className="absolute right-2 top-2 p-2 bg-gray-800/90 hover:bg-gray-700 text-gray-300 rounded-lg shadow-lg z-30 transition-colors"
            title="Show Inspector"
          >
            <Info size={20} />
          </button>
        )}

        {!showTimeline && (
          <button
            onClick={() => setShowTimeline(true)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 p-2 bg-gray-800/90 hover:bg-gray-700 text-gray-300 rounded-lg shadow-lg z-30 transition-colors"
            title="Show Timeline"
          >
            <Clock size={20} />
          </button>
        )}

        {/* Left sidebar - only shown when toggled on */}
        {showLeftPanel && (
          <aside className="absolute left-0 top-0 bottom-0 w-24 border-r border-gray-800 bg-gray-900 flex flex-col z-40 shadow-2xl">
            <div className="flex items-center justify-between px-2 py-2 bg-gray-800 border-b border-gray-700">
              <span className="text-xs font-semibold text-gray-300">🎨 Toolbox</span>
              <button
                onClick={() => setShowLeftPanel(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                title="Hide panel"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {left}
            </div>
          </aside>
        )}

        {/* Right sidebar - only shown when toggled on */}
        {showInspector && (
          <aside className="absolute right-0 top-0 bottom-0 w-80 border-l border-gray-800 bg-gray-900 flex flex-col z-40 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
              <span className="text-sm font-semibold text-gray-300">🔍 Inspector</span>
              <button
                onClick={() => setShowInspector(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                title="Hide panel"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {inspector}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom timeline - only shown when toggled on */}
      {showTimeline && (
        <footer className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 max-h-64 z-40 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
            <span className="text-sm font-semibold text-gray-300">⏱️ Timeline</span>
            <button
              onClick={() => setShowTimeline(false)}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
              title="Hide panel"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto p-4">
            {timeline}
          </div>
        </footer>
      )}
    </div>
  );
}
