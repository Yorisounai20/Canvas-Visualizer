import React from 'react';
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
  const [timelineCollapsed, setTimelineCollapsed] = React.useState(false);
  
  // Calculate timeline height: collapsed = 40px (header only), expanded = 128px
  const timelineHeight = timelineCollapsed ? '40px' : '128px';
  const canvasBottom = timelineCollapsed ? 'calc(40px+0.5px)' : 'calc(8rem+0.5px)';
  const panelHeight = timelineCollapsed ? 'calc(100%-40px-10px-0.5px)' : 'calc(100%-8rem-10px-0.5px)';
  
  return (
    <div className="cv-layout flex flex-col h-screen w-full bg-gray-900 overflow-hidden">
      {/* Top bar - fixed height */}
      <header className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-20 relative">
        {top ?? <TopBarPlaceholder />}
      </header>

      {/* Main content area - full width, panels as thin collapsed tabs by default */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Center content - main canvas with 10px gap from top */}
        <main 
          className="absolute left-0 right-0 top-[10px] overflow-hidden flex flex-col transition-all duration-200"
          style={{ bottom: canvasBottom }}
        >
          {children}
        </main>

        {/* Left sidebar - shortened to align with canvas bottom */}
        <aside 
          className="absolute left-0 top-[10px] w-24 border-r border-gray-800 bg-gray-900/95 backdrop-blur-sm flex flex-col z-10 shadow-2xl overflow-y-auto transition-all duration-200"
          style={{ height: panelHeight }}
        >
          <PanelContainer name="🎨 Toolbox" defaultCollapsed={true} icon="🎨">
            {left}
          </PanelContainer>
        </aside>

        {/* Right sidebar - shortened to align with canvas bottom */}
        <aside 
          className="absolute right-0 top-[10px] w-64 border-l border-gray-800 bg-gray-900/95 backdrop-blur-sm flex flex-col z-10 shadow-2xl overflow-y-auto transition-all duration-200"
          style={{ height: panelHeight }}
        >
          <PanelContainer name="🔍 Inspector" defaultCollapsed={true} icon="🔍">
            {inspector}
          </PanelContainer>
        </aside>
      </div>

      {/* Bottom timeline - moved up with 0.5px gap from panels */}
      <footer 
        className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-20 shadow-2xl transition-all duration-200"
        style={{ height: timelineHeight }}
      >
        <PanelContainer name="⏱️ Timeline" defaultCollapsed={false} icon="⏱️" onCollapseChange={setTimelineCollapsed}>
          {timeline}
        </PanelContainer>
      </footer>
    </div>
  );
}
