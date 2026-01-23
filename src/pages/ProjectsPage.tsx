/**
 * ProjectsPage Component
 * Main projects gallery page with full project management
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Search as SearchIcon } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import ProjectGrid from '../../components/Projects/ProjectGrid';
import SearchBar from '../../components/Projects/SearchBar';
import SortFilterBar from '../../components/Projects/SortFilterBar';
import ProjectContextMenu from '../../components/Projects/ProjectContextMenu';
import { loadProject, updateLastOpenedAt } from '../../lib/database';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const {
    loading,
    error,
    searchQuery,
    sortBy,
    filterBy,
    setSearchQuery,
    setSortBy,
    setFilterBy,
    filteredProjects,
    handleDeleteProject,
    handleRenameProject,
    handleDuplicateProject,
    loadProjects,
  } = useProjects();

  const [contextMenu, setContextMenu] = useState<{
    projectId: string;
    position: { x: number; y: number };
  } | null>(null);

  const [renamingProject, setRenamingProject] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleOpenProject = async (projectId: string) => {
    try {
      // Update last opened timestamp
      await updateLastOpenedAt(projectId);
      
      // Load project and navigate to visualizer
      const projectData = await loadProject(projectId);
      if (projectData) {
        // Store project ID in session for the visualizer to load
        sessionStorage.setItem('currentProjectId', projectId);
        navigate('/software');
      }
    } catch (err) {
      console.error('Failed to open project:', err);
      alert('Failed to open project. Please try again.');
    }
  };

  const handleContextMenu = (projectId: string, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      projectId,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleRename = () => {
    if (contextMenu) {
      const project = filteredProjects.find(p => p.id === contextMenu.projectId);
      if (project) {
        setRenamingProject({ id: project.id, name: project.name });
      }
    }
  };

  const handleRenameSubmit = async () => {
    if (renamingProject && renamingProject.name.trim()) {
      try {
        await handleRenameProject(renamingProject.id, renamingProject.name);
        setRenamingProject(null);
      } catch (err) {
        alert('Failed to rename project. Please try again.');
      }
    }
  };

  const handleDuplicate = async () => {
    if (contextMenu) {
      const project = filteredProjects.find(p => p.id === contextMenu.projectId);
      if (project) {
        try {
          const newName = `${project.name} (Copy)`;
          await handleDuplicateProject(contextMenu.projectId, newName);
        } catch (err) {
          alert('Failed to duplicate project. Please try again.');
        }
      }
    }
  };

  const handleDelete = async () => {
    if (contextMenu) {
      const project = filteredProjects.find(p => p.id === contextMenu.projectId);
      if (project && confirm(`Are you sure you want to delete "${project.name}"? This cannot be undone.`)) {
        try {
          await handleDeleteProject(contextMenu.projectId);
        } catch (err) {
          alert('Failed to delete project. Please try again.');
        }
      }
    }
  };

  const handleVersionHistory = () => {
    // TODO: Implement version history modal
    alert('Version history feature coming soon!');
  };

  const handleNewProject = () => {
    navigate('/software');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FolderOpen className="text-cyan-400" size={32} />
              <h1 className="text-3xl font-bold">Projects</h1>
            </div>
            <button
              onClick={handleNewProject}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search projects..."
              />
            </div>
            <div>
              <SortFilterBar
                sortBy={sortBy}
                filterBy={filterBy}
                onSortChange={setSortBy}
                onFilterChange={setFilterBy}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading projects...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-6 text-red-300">
            <p className="font-semibold mb-2">Error</p>
            <p>{error}</p>
            <button
              onClick={() => loadProjects()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredProjects.length === 0 && (
          <div className="text-center py-16">
            {searchQuery ? (
              <>
                <SearchIcon size={64} className="mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-bold mb-2">No projects found</h2>
                <p className="text-gray-400 mb-6">Try different search terms</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <FolderOpen size={64} className="mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
                <p className="text-gray-400 mb-6">
                  Create your first audio-reactive visualization project
                </p>
                <button
                  onClick={handleNewProject}
                  className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors mx-auto"
                >
                  <Plus size={20} />
                  New Project
                </button>
              </>
            )}
          </div>
        )}

        {!loading && !error && filteredProjects.length > 0 && (
          <>
            <ProjectGrid
              projects={filteredProjects}
              onOpenProject={handleOpenProject}
              onContextMenu={handleContextMenu}
            />
            <div className="mt-8 text-center text-gray-400">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ProjectContextMenu
          projectId={contextMenu.projectId}
          position={contextMenu.position}
          onOpen={() => handleOpenProject(contextMenu.projectId)}
          onRename={handleRename}
          onDuplicate={handleDuplicate}
          onVersionHistory={handleVersionHistory}
          onDelete={handleDelete}
          onClose={handleCloseContextMenu}
        />
      )}

      {/* Rename Dialog */}
      {renamingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Rename Project</h2>
            <input
              type="text"
              value={renamingProject.name}
              onChange={(e) => setRenamingProject({ ...renamingProject, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setRenamingProject(null);
              }}
              className="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRenamingProject(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
