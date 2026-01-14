import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type PanelContainerProps = {
  name: string;
  defaultCollapsed?: boolean;
  children?: React.ReactNode;
  className?: string;
  icon?: string;
  onCollapseChange?: (collapsed: boolean) => void;
};

export default function PanelContainer({ name, defaultCollapsed = false, children, icon, onCollapseChange }: PanelContainerProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  return (
    <div className={`panel-container h-full flex flex-col ${collapsed ? 'w-auto' : 'w-full'}`}>
      {/* Panel header - clickable to expand/collapse - reduced padding from py-3 to py-1.5, reduced text size */}
      <div 
        className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-gray-800/80 to-gray-800/40 border-b border-gray-700/50 cursor-pointer hover:bg-gray-800/60 transition-colors flex-shrink-0"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-gray-200 tracking-wide">
            {name}
          </h3>
        </div>
        <button
          aria-expanded={!collapsed}
          className="p-0.5 rounded hover:bg-gray-700/50 transition-colors"
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
        >
          <ChevronDown 
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : 'rotate-0'}`}
          />
        </button>
      </div>

      {/* Panel content - only shown when expanded */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      )}
    </div>
  );
}
