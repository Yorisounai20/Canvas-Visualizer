import React, { useState } from 'react';

type PanelContainerProps = {
  name: string;
  defaultCollapsed?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export default function PanelContainer({ name, defaultCollapsed = false, children }: PanelContainerProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`panel-container ${collapsed ? 'collapsed' : 'expanded'}`} style={{
      background: 'rgba(17,24,39,0.6)',
      borderRadius: 8,
      border: '1px solid rgba(148,163,184,0.06)',
      padding: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ color: '#e6edf3' }}>{name}</strong>
        <div style={{ marginLeft: 'auto' }}>
          <button
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(v => !v)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer'
            }}
            title={collapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {collapsed ? '▸' : '▾'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="panel-content" style={{ color: '#cbd5e1' }}>
          {children}
        </div>
      )}
    </div>
  );
}
