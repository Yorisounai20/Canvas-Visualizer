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
    <div className="cv-layout h-screen w-full grid" style={{
      gridTemplateRows: 'auto 1fr auto',
      gridTemplateColumns: '260px 1fr 360px',
      gap: '12px',
      height: '100vh',
    }}>
      {/* Top bar spans all columns */}
      <div style={{ gridColumn: '1 / -1', padding: 8 }}>
        {top ?? <TopBarPlaceholder />}
      </div>

      {/* Left toolbox */}
      <aside style={{ gridRow: 2, gridColumn: 1, overflow: 'auto', padding: 8 }}>
        <PanelContainer name="Left Toolbox" defaultCollapsed={false}>
          {left}
        </PanelContainer>
      </aside>

      {/* Center canvas area */}
      <main style={{ gridRow: 2, gridColumn: 2, overflow: 'hidden', position: 'relative' }}>
        {children}
      </main>

      {/* Right inspector */}
      <aside style={{ gridRow: 2, gridColumn: 3, overflow: 'auto', padding: 8 }}>
        <PanelContainer name="Inspector" defaultCollapsed={true}>
          {inspector}
        </PanelContainer>
      </aside>

      {/* Bottom timeline spans all columns */}
      <footer style={{ gridRow: 3, gridColumn: '1 / -1', padding: 8 }}>
        <PanelContainer name="Timeline" defaultCollapsed={false}>
          {timeline}
        </PanelContainer>
      </footer>
    </div>
  );
}
