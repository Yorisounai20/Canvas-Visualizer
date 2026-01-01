import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy } from 'lucide-react';
import { Section, AnimationType } from '../../types';
import ContextMenu, { ContextMenuItem } from '../Common/ContextMenu';

interface LeftPanelProps {
  sections: Section[];
  selectedSectionId: number | null;
  animationTypes: AnimationType[];
  onSelectSection: (id: number) => void;
  onToggleVisibility: (id: number) => void;
  onToggleLock: (id: number) => void;
  onDeleteSection: (id: number) => void;
  onReorderSections: (sections: Section[]) => void;
  onDuplicateSection?: (id: number) => void;
}

/**
 * LeftPanel Component - Layers/Sections panel (After Effects-style)
 * Shows sections as layers with visibility, lock, and color tags
 * Supports drag-and-drop reordering and right-click context menu
 */
export default function LeftPanel({
  sections,
  selectedSectionId,
  animationTypes,
  onSelectSection,
  onToggleVisibility,
  onToggleLock,
  onDeleteSection,
  onReorderSections,
  onDuplicateSection
}: LeftPanelProps) {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    sectionId: number | null;
  }>({ isOpen: false, x: 0, y: 0, sectionId: null });

  const formatTime = (s: number) => 
    `${Math.floor(s/60)}:${(Math.floor(s%60)).toString().padStart(2,'0')}`;

  const getAnimationInfo = (animValue: string) => {
    return animationTypes.find(a => a.value === animValue) || {
      value: animValue,
      label: animValue,
      icon: '🎵'
    };
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (sourceIndex === targetIndex) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(sourceIndex, 1);
    newSections.splice(targetIndex, 0, movedSection);
    
    onReorderSections(newSections);
  };

  const handleContextMenu = (e: React.MouseEvent, sectionId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      sectionId
    });
  };

  const getContextMenuItems = (): ContextMenuItem[] => {
    if (!contextMenu.sectionId) return [];
    
    const section = sections.find(s => s.id === contextMenu.sectionId);
    if (!section) return [];

    return [
      {
        label: section.visible !== false ? 'Hide Layer' : 'Show Layer',
        icon: section.visible !== false ? <EyeOff size={16} /> : <Eye size={16} />,
        onClick: () => onToggleVisibility(section.id)
      },
      {
        label: section.locked ? 'Unlock Layer' : 'Lock Layer',
        icon: section.locked ? <Unlock size={16} /> : <Lock size={16} />,
        onClick: () => onToggleLock(section.id)
      },
      { separator: true } as ContextMenuItem,
      {
        label: 'Duplicate Layer',
        icon: <Copy size={16} />,
        onClick: () => onDuplicateSection && onDuplicateSection(section.id),
        disabled: !onDuplicateSection
      },
      { separator: true } as ContextMenuItem,
      {
        label: 'Delete Layer',
        icon: <Trash2 size={16} />,
        onClick: () => onDeleteSection(section.id)
      }
    ];
  };

  return (
    <div className="h-full bg-[#2B2B2B] border-r border-gray-700 flex flex-col shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Layers / Sections
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {sections.length} {sections.length === 1 ? 'layer' : 'layers'}
        </p>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {sections.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No layers yet.<br/>
            Add sections in the timeline panel below.
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {sections.map((section, index) => {
              const animInfo = getAnimationInfo(section.animation);
              const isSelected = section.id === selectedSectionId;
              const isVisible = section.visible !== false;
              const isLocked = section.locked === true;

              return (
                <div
                  key={section.id}
                  draggable={!isLocked}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => !isLocked && onSelectSection(section.id)}
                  onContextMenu={(e) => handleContextMenu(e, section.id)}
                  className={`px-3 py-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#4A90E2] bg-opacity-20 border-l-4 border-[#4A90E2]'
                      : 'hover:bg-gray-700 hover:bg-opacity-50'
                  } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {/* Layer Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Animation Icon */}
                      <span className="text-lg flex-shrink-0" title={animInfo.label}>
                        {animInfo.icon}
                      </span>
                      
                      {/* Layer Name */}
                      <span className="text-sm font-semibold text-white truncate">
                        {animInfo.label}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 ml-2">
                      {/* Visibility Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibility(section.id);
                        }}
                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                        title={isVisible ? 'Hide layer' : 'Show layer'}
                      >
                        {isVisible ? (
                          <Eye size={14} className="text-cyan-400" />
                        ) : (
                          <EyeOff size={14} className="text-gray-500" />
                        )}
                      </button>

                      {/* Lock Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLock(section.id);
                        }}
                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                        title={isLocked ? 'Unlock layer' : 'Lock layer'}
                      >
                        {isLocked ? (
                          <Lock size={14} className="text-yellow-400" />
                        ) : (
                          <Unlock size={14} className="text-gray-500" />
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocked) onDeleteSection(section.id);
                        }}
                        disabled={isLocked}
                        className={`p-1 rounded transition-colors ${
                          isLocked
                            ? 'cursor-not-allowed opacity-40'
                            : 'hover:bg-red-600 text-red-400 hover:text-white'
                        }`}
                        title="Delete layer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Time Range */}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-mono">{formatTime(section.start)}</span>
                    <span>→</span>
                    <span className="font-mono">{formatTime(section.end)}</span>
                    <span className="text-gray-600">
                      ({(section.end - section.start).toFixed(1)}s)
                    </span>
                  </div>

                  {/* Color Tag (if set) */}
                  {section.colorTag && (
                    <div className="mt-2">
                      <div
                        className="h-1 rounded-full"
                        style={{ backgroundColor: section.colorTag }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        items={getContextMenuItems()}
        onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0, sectionId: null })}
      />
    </div>
  );
}
