import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

/**
 * ContextMenu Component - Right-click context menu
 * Shows menu items at cursor position
 */
export default function ContextMenu({ isOpen, x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-1 min-w-[180px]"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {items.map((item, index) => (
        item.separator ? (
          <div key={index} className="border-t border-gray-600 my-1" />
        ) : (
          <button
            key={index}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
              item.disabled
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-white hover:bg-gray-700'
            }`}
          >
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        )
      ))}
    </div>
  );
}
