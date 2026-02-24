import { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Calendar, Clock } from 'lucide-react';
import { SavedProject, listProjects, deleteProject, isDatabaseAvailable } from '../../lib/database';

interface ProjectsModalProps {
  onClose: () => void;
  onLoadProject: (projectId: string) => void;
  currentProjectId?: string;
}

/**
 * ProjectsModal Component
 * Displays a list of saved projects with load and delete functionality
 * Now filtered by authenticated user
 */
export default function ProjectsModal({
  onClose,
  onLoadProject,
  currentProjectId
}: ProjectsModalProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // TODO: Get user from auth context when implemented
  const user: { id: string } | null = null;

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!isDatabaseAvailable()) {
      setError('Database is not configured. Please set VITE_DATABASE_URL in your .env file.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Filter projects by user ID
      const userId = (user as any)?.id;
      const result = await listProjects(userId);
      setProjects(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(projectId);
      const userId = (user as any)?.id;
      await deleteProject(projectId, userId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert('Failed to delete project: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Error deleting project:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoad = (projectId: string) => {
    onLoadProject(projectId);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2B2B2B] rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <FolderOpen className="text-cyan-400" size={24} />
            <h2 className="text-xl font-bold text-white">Saved Projects</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-12 text-gray-400">
              Loading projects...
            </div>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4 text-red-300">
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No saved projects yet</p>
              <p className="text-sm mt-2">Create and save your first project to see it here</p>
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`bg-gray-800 rounded-lg p-4 border transition-all ${
                    project.id === currentProjectId
                      ? 'border-cyan-500 bg-opacity-50'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-2 truncate">
                        {project.name}
                        {project.id === currentProjectId && (
                          <span className="ml-2 text-xs text-cyan-400 font-normal">(Current)</span>
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Created: {formatDate(project.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>Modified: {formatDate(project.updated_at)}</span>
                        </div>
                      </div>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoad(project.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
                        title="Load Project"
                      >
                        <FolderOpen size={16} />
                        <span>Load</span>
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Project"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              {projects.length} project{projects.length !== 1 ? 's' : ''} saved
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
