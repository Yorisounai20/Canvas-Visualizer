/**
 * ProjectContextMenu Component
 * Context menu for project actions
 */

import { useEffect, useRef } from 'react';
import { FolderOpen, Edit3, Copy, Clock, Trash2 } from 'lucide-react';

interface ProjectContextMenuProps {
  projectId: string;
  position: { x: number; y: number };
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onVersionHistory: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ProjectContextMenu({
  position,
  onOpen,
  onRename,
  onDuplicate,
  onVersionHistory,
  onDelete,
  onClose,
}: ProjectContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [onClose]);

  const menuItems = [
    { icon: FolderOpen, label: 'Open', onClick: onOpen },
    { icon: Edit3, label: 'Rename', onClick: onRename },
    { icon: Copy, label: 'Duplicate', onClick: onDuplicate },
    { icon: Clock, label: 'Version History', onClick: onVersionHistory },
    { icon: Trash2, label: 'Delete', onClick: onDelete, danger: true },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-2 min-w-[200px] z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
            item.danger
              ? 'text-red-400 hover:bg-red-900 hover:bg-opacity-30'
              : 'text-white hover:bg-gray-700'
          }`}
        >
          <item.icon size={16} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
