import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Workspace Layout - Multi-Panel System
 * Provides categorized panels for the 9 workspace systems
 */

interface WorkspaceLayoutProps {
  // Left Side
  scenePanel: React.ReactNode;
  posesPanel: React.ReactNode;
  
  // Right Side
  propertiesPanel: React.ReactNode;
  templatesPanel: React.ReactNode;
  authoringPanel: React.ReactNode;
  
  // Bottom
  timelinePanel?: React.ReactNode;
  statusBar: React.ReactNode;
  
  // Main Content
  children: React.ReactNode;
}

export default function WorkspaceLayout({
  scenePanel,
  posesPanel,
  propertiesPanel,
  templatesPanel,
  authoringPanel,
  timelinePanel,
  statusBar,
  children
}: WorkspaceLayoutProps) {
  // Panel visibility states
  const [leftPanelsVisible, setLeftPanelsVisible] = useState(true);
  const [rightPanelsVisible, setRightPanelsVisible] = useState(true);
  const [bottomPanelVisible, setBottomPanelVisible] = useState(true);
  
  // Panel sizes (percentage based for responsiveness)
  const leftPanelWidth = leftPanelsVisible ? 'w-80' : 'w-0';
  const rightPanelWidth = rightPanelsVisible ? 'w-80' : 'w-0';
  const bottomPanelHeight = bottomPanelVisible ? 'h-64' : 'h-0';

  return (
    <div className="flex flex-col h-full w-full bg-gray-900">
      {/* Main horizontal split */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDE - Scene + Poses */}
        <div className={`${leftPanelWidth} flex flex-col border-r border-gray-800 transition-all duration-300 overflow-hidden`}>
          {leftPanelsVisible && (
            <>
              {/* Scene Panel - Top */}
              <div className="flex-1 flex flex-col border-b border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-850 border-b border-gray-800">
                  <h3 className="text-xs font-semibold text-cyan-400 flex items-center gap-2">
                    🎬 Scene
                  </h3>
                  <button
                    onClick={() => setLeftPanelsVisible(false)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Collapse left panels"
                  >
                    <ChevronLeft size={14} className="text-gray-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {scenePanel}
                </div>
              </div>

              {/* Poses Panel - Bottom */}
              <div className="h-64 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-850 border-b border-gray-800">
                  <h3 className="text-xs font-semibold text-purple-400 flex items-center gap-2">
                    💾 Poses
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {posesPanel}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Toggle button for left panels when collapsed */}
        {!leftPanelsVisible && (
          <button
            onClick={() => setLeftPanelsVisible(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-r transition-colors z-20"
            title="Show left panels"
          >
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        )}

        {/* CENTER - Canvas + Status */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Canvas Area */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>

          {/* Status Bar */}
          <div className="flex-shrink-0 border-t border-gray-800 bg-gray-850">
            {statusBar}
          </div>
        </div>

        {/* RIGHT SIDE - Properties + Templates + Authoring */}
        <div className={`${rightPanelWidth} flex flex-col border-l border-gray-800 transition-all duration-300 overflow-hidden`}>
          {rightPanelsVisible && (
            <>
              {/* Properties Panel - Top */}
              <div className="flex-1 flex flex-col border-b border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-850 border-b border-gray-800">
                  <h3 className="text-xs font-semibold text-cyan-400 flex items-center gap-2">
                    ⚙️ Properties
                  </h3>
                  <button
                    onClick={() => setRightPanelsVisible(false)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Collapse right panels"
                  >
                    <ChevronRight size={14} className="text-gray-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {propertiesPanel}
                </div>
              </div>

              {/* Templates Panel - Middle */}
              <div className="h-64 flex flex-col border-b border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-850 border-b border-gray-800">
                  <h3 className="text-xs font-semibold text-green-400 flex items-center gap-2">
                    📄 Templates
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {templatesPanel}
                </div>
              </div>

              {/* Authoring Panel - Bottom */}
              <div className="h-48 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-850 border-b border-gray-800">
                  <h3 className="text-xs font-semibold text-orange-400 flex items-center gap-2">
                    ✨ Authoring
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {authoringPanel}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Toggle button for right panels when collapsed */}
        {!rightPanelsVisible && (
          <button
            onClick={() => setRightPanelsVisible(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-l transition-colors z-20"
            title="Show right panels"
          >
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* BOTTOM - Timeline/Sequencer */}
      {timelinePanel && (
        <>
          <div className={`${bottomPanelHeight} flex flex-col border-t border-gray-800 transition-all duration-300 overflow-hidden`}>
            {bottomPanelVisible && (
              <>
                <div className="flex items-center justify-between px-3 py-2 bg-gray-850 border-b border-gray-800">
                  <h3 className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                    🎞️ Timeline / Sequencer
                  </h3>
                  <button
                    onClick={() => setBottomPanelVisible(false)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Collapse timeline"
                  >
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {timelinePanel}
                </div>
              </>
            )}
          </div>

          {/* Toggle button for timeline when collapsed */}
          {!bottomPanelVisible && (
            <button
              onClick={() => setBottomPanelVisible(true)}
              className="flex items-center justify-center w-full p-2 bg-gray-800 hover:bg-gray-700 border-t border-gray-700 transition-colors"
              title="Show timeline"
            >
              <ChevronUp size={16} className="text-gray-400" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
