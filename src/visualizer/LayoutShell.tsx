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
    <div className="cv-layout flex flex-col min-h-screen w-full bg-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        {top ?? <TopBarPlaceholder />}
      </header>

      {/* Main content area with flexible layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - collapsible */}
        <aside className="w-72 border-r border-gray-800 overflow-y-auto bg-gray-900/50">
          <PanelContainer name="🎨 Toolbox" defaultCollapsed={false} icon="🎨">
            {left}
          </PanelContainer>
        </aside>

        {/* Center content - main canvas and controls */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Right sidebar - inspector */}
        <aside className="w-80 border-l border-gray-800 overflow-y-auto bg-gray-900/50">
          <PanelContainer name="🔍 Inspector" defaultCollapsed={false} icon="🔍">
            {inspector}
          </PanelContainer>
        </aside>
      </div>

      {/* Bottom timeline - sticky */}
      <footer className="sticky bottom-0 z-40 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
        <PanelContainer name="⏱️ Timeline" defaultCollapsed={false} icon="⏱️">
          {timeline}
        </PanelContainer>
      </footer>
    </div>
  );
}
