/**
 * Custom hook for managing version history
 */

import { useState, useCallback } from 'react';
import { ProjectVersion, getVersions, getVersion, createVersion } from '../lib/database';
import { ProjectState } from '../types';

interface UseVersionHistoryReturn {
  versions: ProjectVersion[];
  loading: boolean;
  error: string | null;
  loadVersions: (projectId: string, limit?: number, offset?: number) => Promise<void>;
  restoreVersion: (versionId: string, currentState: ProjectState, projectId: string) => Promise<ProjectState | null>;
  createNewVersion: (projectId: string, data: ProjectState, isAutosave: boolean, description?: string) => Promise<void>;
}

export function useVersionHistory(): UseVersionHistoryReturn {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVersions = useCallback(async (projectId: string, limit = 20, offset = 0) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVersions(projectId, limit, offset);
      setVersions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
      console.error('Error loading versions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreVersion = useCallback(async (
    versionId: string,
    currentState: ProjectState,
    projectId: string
  ): Promise<ProjectState | null> => {
    try {
      setError(null);
      
      // Save current state as autosave before restoring
      await createVersion(projectId, currentState, true, 'Autosave before restore');
      
      // Get the version to restore
      const version = await getVersion(versionId);
      
      if (!version) {
        throw new Error('Version not found');
      }
      
      return version.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version');
      console.error('Error restoring version:', err);
      return null;
    }
  }, []);

  const createNewVersion = useCallback(async (
    projectId: string,
    data: ProjectState,
    isAutosave: boolean,
    description?: string
  ) => {
    try {
      setError(null);
      await createVersion(projectId, data, isAutosave, description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version');
      console.error('Error creating version:', err);
      throw err;
    }
  }, []);

  return {
    versions,
    loading,
    error,
    loadVersions,
    restoreVersion,
    createNewVersion,
  };
}
