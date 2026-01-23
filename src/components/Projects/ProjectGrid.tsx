/**
 * ProjectGrid Component
 * Responsive grid layout for project cards
 */

import { SavedProject } from '../../lib/database';
import ProjectCard from './ProjectCard';

interface ProjectGridProps {
  projects: SavedProject[];
  onOpenProject: (projectId: string) => void;
  onContextMenu: (projectId: string, event: React.MouseEvent) => void;
}

export default function ProjectGrid({
  projects,
  onOpenProject,
  onContextMenu,
}: ProjectGridProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={onOpenProject}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}
