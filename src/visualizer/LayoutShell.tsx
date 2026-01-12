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
      <header className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        {top ?? <TopBarPlaceholder />}
      </header>

      {/* Main content area - takes remaining height */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left sidebar - with internal scroll */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900/50 flex flex-col">
          <PanelContainer name="🎨 Toolbox" defaultCollapsed={false} icon="🎨">
            {left}
          </PanelContainer>
        </aside>

        {/* Center content - main canvas (no scroll, canvas is fixed) */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>

        {/* Right sidebar - with internal scroll */}
        <aside className="w-80 flex-shrink-0 border-l border-gray-800 bg-gray-900/50 flex flex-col">
          <PanelContainer name="🔍 Inspector" defaultCollapsed={false} icon="🔍">
            {inspector}
          </PanelContainer>
        </aside>
      </div>

      {/* Bottom timeline - fixed height with internal scroll */}
      <footer className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 max-h-64">
        <PanelContainer name="⏱️ Timeline" defaultCollapsed={false} icon="⏱️">
          {timeline}
        </PanelContainer>
      </footer>
    </div>
  );
}
