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
  return (
    <div className="cv-layout flex flex-col h-screen w-full bg-gray-900 overflow-hidden">
      {/* Top bar - fixed height */}
      <header className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-20">
        {top ?? <TopBarPlaceholder />}
      </header>

      {/* Main content area - full width, panels overlay on top */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Center content - main canvas takes full space */}
        <main className="absolute inset-0 overflow-hidden flex flex-col">
          {children}
        </main>

        {/* Left sidebar - overlay with internal scroll */}
        <aside className="absolute left-0 top-0 bottom-0 w-64 border-r border-gray-800 bg-gray-900/95 backdrop-blur-sm flex flex-col z-10 shadow-2xl">
          <PanelContainer name="🎨 Toolbox" defaultCollapsed={false} icon="🎨">
            {left}
          </PanelContainer>
        </aside>

        {/* Right sidebar - overlay with internal scroll */}
        <aside className="absolute right-0 top-0 bottom-0 w-80 border-l border-gray-800 bg-gray-900/95 backdrop-blur-sm flex flex-col z-10 shadow-2xl">
          <PanelContainer name="🔍 Inspector" defaultCollapsed={false} icon="🔍">
            {inspector}
          </PanelContainer>
        </aside>
      </div>

      {/* Bottom timeline - overlay with internal scroll */}
      <footer className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 max-h-64 z-20 shadow-2xl">
        <PanelContainer name="⏱️ Timeline" defaultCollapsed={false} icon="⏱️">
          {timeline}
        </PanelContainer>
      </footer>
    </div>
  );
}
