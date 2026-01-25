/**
 * ProjectCard Component
 * Displays a single project card with thumbnail, metadata, and actions
 */

import { useState } from 'react';
import { MoreVertical, FileMusic, AlertCircle } from 'lucide-react';
import { SavedProject } from '../../lib/database';
import { formatRelativeTime } from '../../lib/relativeTime';
import { generatePlaceholderThumbnail } from '../../lib/thumbnailService';

interface ProjectCardProps {
  project: SavedProject;
  onOpen: (projectId: string) => void;
  onContextMenu: (projectId: string, event: React.MouseEvent) => void;
  isHovered?: boolean;
}

export default function ProjectCard({
  project,
  onOpen,
  onContextMenu,
}: ProjectCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getThumbnailUrl = () => {
    if (imageError || !project.thumbnail_url) {
      return generatePlaceholderThumbnail(project.name);
    }
    return project.thumbnail_url;
  };

  const handleCardClick = () => {
    onOpen(project.id);
  };

  const handleContextMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContextMenu(project.id, e);
  };

  const lastModified = formatRelativeTime(project.last_opened_at || project.updated_at);

  return (
    <div
      className={`bg-gray-800 rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
        isHovered ? 'border-cyan-500 shadow-lg shadow-cyan-500/20 scale-105' : 'border-gray-700'
      }`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        <img
          src={getThumbnailUrl()}
          alt={`${project.name} thumbnail`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        
        {/* Unsaved autosave indicator */}
        {project.has_unsaved_autosave && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
            <AlertCircle size={12} />
            Autosaved
          </div>
        )}
        
        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold">
            Open
          </button>
        </div>
        
        {/* Context menu button */}
        <button
          onClick={handleContextMenuClick}
          className="absolute top-2 right-2 p-1.5 bg-gray-900 bg-opacity-75 hover:bg-opacity-100 rounded transition-all"
          title="More options"
        >
          <MoreVertical size={16} className="text-white" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-white font-bold text-lg truncate mb-1" title={project.name}>
          {project.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FileMusic size={14} />
          <span>{lastModified}</span>
        </div>
        
        {/* Additional metadata */}
        {project.project_data?.settings && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
              {project.project_data.settings.resolution.width}×
              {project.project_data.settings.resolution.height}
            </span>
            <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
              {project.project_data.sections?.length || 0} sections
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
