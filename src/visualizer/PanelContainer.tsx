import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type PanelContainerProps = {
  name: string;
  defaultCollapsed?: boolean;
  children?: React.ReactNode;
  className?: string;
  icon?: string;
};

export default function PanelContainer({ name, defaultCollapsed = false, children, icon }: PanelContainerProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="panel-container h-full flex flex-col">
      {/* Panel header - clickable to expand/collapse */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800/80 to-gray-800/40 border-b border-gray-700/50 cursor-pointer hover:bg-gray-800/60 transition-colors flex-shrink-0"
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-200 tracking-wide">
            {name}
          </h3>
        </div>
        <button
          aria-expanded={!collapsed}
          className="p-1 rounded hover:bg-gray-700/50 transition-colors"
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(v => !v);
          }}
        >
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : 'rotate-0'}`}
          />
        </button>
      </div>

      {/* Panel content - shown when expanded */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      )}
    </div>
  );
}
