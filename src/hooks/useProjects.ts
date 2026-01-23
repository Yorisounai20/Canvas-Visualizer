/**
 * Custom hook for managing projects data
 */

import { useState, useEffect, useCallback } from 'react';
import { SavedProject, listProjects, deleteProject, renameProject, duplicateProject, isDatabaseAvailable } from '../lib/database';

type SortBy = 'recent' | 'name-asc' | 'name-desc' | 'created' | 'modified';
type FilterBy = 'all' | 'recent' | 'week' | 'month';

interface UseProjectsReturn {
  projects: SavedProject[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: SortBy;
  filterBy: FilterBy;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortBy) => void;
  setFilterBy: (filter: FilterBy) => void;
  loadProjects: () => Promise<void>;
  handleDeleteProject: (projectId: string) => Promise<void>;
  handleRenameProject: (projectId: string, newName: string) => Promise<void>;
  handleDuplicateProject: (projectId: string, newName: string) => Promise<SavedProject>;
  filteredProjects: SavedProject[];
}

export function useProjects(userId?: string): UseProjectsReturn {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');

  const loadProjects = useCallback(async () => {
    if (!isDatabaseAvailable()) {
      setError('Database is not configured. Please set VITE_DATABASE_URL in your .env file.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await listProjects(userId);
      setProjects(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteProject(projectId, userId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  }, [userId]);

  const handleRenameProject = useCallback(async (projectId: string, newName: string) => {
    try {
      await renameProject(projectId, newName, userId);
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, name: newName } : p
      ));
    } catch (err) {
      console.error('Error renaming project:', err);
      throw err;
    }
  }, [userId]);

  const handleDuplicateProject = useCallback(async (projectId: string, newName: string) => {
    try {
      const newProject = await duplicateProject(projectId, newName, userId);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      console.error('Error duplicating project:', err);
      throw err;
    }
  }, [userId]);

  // Filter and sort projects
  const filteredProjects = useCallback(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query)
      );
    }

    // Apply time filter
    const now = new Date();
    if (filterBy === 'recent') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => 
        new Date(p.last_opened_at || p.updated_at) >= sevenDaysAgo
      );
    } else if (filterBy === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => 
        new Date(p.updated_at) >= oneWeekAgo
      );
    } else if (filterBy === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => 
        new Date(p.updated_at) >= oneMonthAgo
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          const aTime = new Date(a.last_opened_at || a.updated_at).getTime();
          const bTime = new Date(b.last_opened_at || b.updated_at).getTime();
          return bTime - aTime;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'modified':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, sortBy, filterBy]);

  return {
    projects,
    loading,
    error,
    searchQuery,
    sortBy,
    filterBy,
    setSearchQuery,
    setSortBy,
    setFilterBy,
    loadProjects,
    handleDeleteProject,
    handleRenameProject,
    handleDuplicateProject,
    filteredProjects: filteredProjects(),
  };
}
