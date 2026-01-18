import React, { useState, useRef, useEffect } from 'react';
import TopBarPlaceholder from './TopBarPlaceholder';
import PanelContainer from './PanelContainer';

type LayoutShellProps = {
  left?: React.ReactNode;
  inspector?: React.ReactNode;
  timeline?: React.ReactNode;
  top?: React.ReactNode;
  children: React.ReactNode; // canvas / main content
};

export default function LayoutShell({ left, inspector, timeline, top, children }: LayoutShellProps) {
  const [timelineHeight, setTimelineHeight] = useState(450); // Default 450px - increased for better visibility
  const [isResizing, setIsResizing] = useState(false);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      // Constrain between 300px and 800px - increased minimum for better visibility
      setTimelineHeight(Math.max(300, Math.min(800, newHeight)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    document.body.style.cursor = 'ns-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const toggleFullHeight = () => {
    setIsFullHeight(!isFullHeight);
  };

  const effectiveTimelineHeight = isFullHeight ? 'calc(100vh - 4rem)' : `${timelineHeight}px`;

  return (
    <div className="cv-layout flex flex-col h-screen w-full bg-gray-900 overflow-hidden">
      {/* Top bar - fixed height */}
      <header className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-20 relative">
        {top ?? <TopBarPlaceholder />}
      </header>

      {/* Main content area - full width, panels as thin collapsed tabs by default */}
      <div 
        className="flex-1 relative overflow-hidden min-h-0"
        style={{ marginBottom: effectiveTimelineHeight }}
      >
        {/* Center content - main canvas */}
        <main 
          className="absolute inset-0 overflow-hidden flex flex-col"
        >
          {children}
        </main>

        {/* Left sidebar - 45% vertical space, expanded by default */}
        <aside className="absolute left-0 top-0 h-[45vh] w-24 border-r border-gray-800 bg-gray-900/95 backdrop-blur-sm flex flex-col z-10 shadow-2xl">
          <PanelContainer name="🎨 Toolbox" defaultCollapsed={false} icon="🎨">
            {left}
          </PanelContainer>
        </aside>

        {/* Right sidebar - 45% vertical space, expanded by default */}
        <aside className="absolute right-0 top-0 h-[45vh] w-56 border-l border-gray-800 bg-gray-900/95 backdrop-blur-sm flex flex-col z-10 shadow-2xl">
          <PanelContainer name="🔍 Inspector" defaultCollapsed={false} icon="🔍">
            {inspector}
          </PanelContainer>
        </aside>
      </div>

      {/* Bottom timeline - resizable with controls */}
      <footer 
        className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-20 shadow-2xl"
        style={{ height: effectiveTimelineHeight }}
      >
        {/* Resize handle */}
        <div
          ref={resizeRef}
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-cyan-500/50 transition-colors z-30"
          onMouseDown={handleResizeStart}
          title="Drag to resize timeline"
        />
        
        {/* Full-height toggle button */}
        <button
          onClick={toggleFullHeight}
          className="absolute top-2 right-2 z-30 px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
          title={isFullHeight ? 'Restore timeline size' : 'Maximize timeline'}
        >
          {isFullHeight ? '⬇ Restore' : '⬆ Maximize'}
        </button>

        <PanelContainer name="⏱️ Timeline" defaultCollapsed={false} icon="⏱️">
          {timeline}
        </PanelContainer>
      </footer>
    </div>
  );
}
