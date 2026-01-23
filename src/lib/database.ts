/**
 * Database utility module for Neon PostgreSQL
 * Handles all database operations for project persistence
 */

import { neon } from '@neondatabase/serverless';
import { ProjectState } from '../types';

// Get Neon connection string from environment variables
const getDatabaseUrl = (): string => {
  const url = import.meta.env.VITE_DATABASE_URL;
  if (!url) {
    throw new Error('VITE_DATABASE_URL environment variable is not set');
  }
  return url;
};

// Create SQL client
const getSql = () => {
  try {
    return neon(getDatabaseUrl());
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    throw error;
  }
};

// Database types
export interface SavedProject {
  id: string;
  name: string;
  user_id?: string;
  project_data: ProjectState;
  created_at: string;
  updated_at: string;
  last_opened_at?: string;
  thumbnail_url?: string;
  has_unsaved_autosave?: boolean;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  data: ProjectState;
  created_at: string;
  is_autosave: boolean;
  description?: string;
}

/**
 * Initialize database schema
 * Creates the projects table if it doesn't exist
 */
export async function initializeDatabase(): Promise<void> {
  const sql = getSql();
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        project_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_opened_at TIMESTAMP,
        thumbnail_url TEXT,
        has_unsaved_autosave BOOLEAN DEFAULT FALSE
      )
    `;
    
    // Create project_versions table
    await sql`
      CREATE TABLE IF NOT EXISTS project_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        is_autosave BOOLEAN NOT NULL DEFAULT FALSE,
        description TEXT
      )
    `;
    
    // Create index on user_id for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)
    `;
    
    // Create index on updated_at for sorting
    await sql`
      CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC)
    `;
    
    // Create index on last_opened_at for sorting
    await sql`
      CREATE INDEX IF NOT EXISTS idx_projects_last_opened ON projects(last_opened_at DESC)
    `;
    
    // Create indexes for project_versions
    await sql`
      CREATE INDEX IF NOT EXISTS idx_versions_project ON project_versions(project_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_versions_created ON project_versions(created_at DESC)
    `;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Save a new project or update an existing one
 * 
 * @param projectState - The project state to save
 * @param projectId - Optional ID for updating existing project
 * @param userId - User ID for ownership verification (recommended for security)
 * 
 * Note: While userId is optional for backward compatibility, it should always be 
 * provided in production to ensure proper authorization and project ownership.
 */
export async function saveProject(
  projectState: ProjectState,
  projectId?: string,
  userId?: string
): Promise<SavedProject> {
  const sql = getSql();
  
  try {
    if (projectId) {
      // Update existing project - verify user ownership when userId is provided
      const result = await sql`
        UPDATE projects
        SET 
          name = ${projectState.settings.name},
          project_data = ${JSON.stringify(projectState)},
          updated_at = NOW()
        WHERE id = ${projectId}
        ${userId ? sql`AND user_id = ${userId}` : sql``}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error(`Project with id ${projectId} not found or you don't have permission to update it`);
      }
      
      return result[0] as SavedProject;
    } else {
      // Create new project
      const result = await sql`
        INSERT INTO projects (name, user_id, project_data)
        VALUES (
          ${projectState.settings.name},
          ${userId || null},
          ${JSON.stringify(projectState)}
        )
        RETURNING *
      `;
      
      return result[0] as SavedProject;
    }
  } catch (error) {
    console.error('Failed to save project:', error);
    throw error;
  }
}

/**
 * Load a project by ID
 * 
 * @param projectId - The project ID to load
 * @param userId - Optional user ID for ownership verification (recommended for security)
 * 
 * Note: While userId is optional for backward compatibility, it should always be 
 * provided in production to ensure users can only load their own projects.
 */
export async function loadProject(projectId: string, userId?: string): Promise<ProjectState | null> {
  const sql = getSql();
  
  try {
    const result = userId
      ? await sql`
          SELECT project_data
          FROM projects
          WHERE id = ${projectId} AND user_id = ${userId}
        `
      : await sql`
          SELECT project_data
          FROM projects
          WHERE id = ${projectId}
        `;
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0].project_data as ProjectState;
  } catch (error) {
    console.error('Failed to load project:', error);
    throw error;
  }
}

/**
 * List all projects for a user (or all projects if no userId provided)
 */
export async function listProjects(userId?: string): Promise<SavedProject[]> {
  const sql = getSql();
  
  try {
    const result = userId
      ? await sql`
          SELECT *
          FROM projects
          WHERE user_id = ${userId}
          ORDER BY updated_at DESC
        `
      : await sql`
          SELECT *
          FROM projects
          ORDER BY updated_at DESC
        `;
    
    return result as SavedProject[];
  } catch (error) {
    console.error('Failed to list projects:', error);
    throw error;
  }
}

/**
 * Delete a project by ID
 * 
 * @param projectId - The project ID to delete
 * @param userId - Optional user ID for ownership verification (recommended for security)
 * 
 * Note: While userId is optional for backward compatibility, it should always be 
 * provided in production to ensure users can only delete their own projects.
 */
export async function deleteProject(projectId: string, userId?: string): Promise<boolean> {
  const sql = getSql();
  
  try {
    const result = await sql`
      DELETE FROM projects
      WHERE id = ${projectId}
      ${userId ? sql`AND user_id = ${userId}` : sql``}
      RETURNING id
    `;
    
    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw error;
  }
}

/**
 * Check if database is available and configured
 * Note: This only checks if the environment variable exists,
 * not if the connection is actually valid. Database operations
 * will handle connection errors appropriately.
 */
export function isDatabaseAvailable(): boolean {
  try {
    const url = import.meta.env.VITE_DATABASE_URL;
    return !!url && url.length > 0;
  } catch {
    return false;
  }
}

/**
 * Project Version Management Functions
 */

/**
 * Create a new project version (autosave or manual save)
 */
export async function createVersion(
  projectId: string,
  data: ProjectState,
  isAutosave: boolean = true,
  description?: string
): Promise<ProjectVersion> {
  const sql = getSql();
  
  try {
    // Get the next version number
    const versionCount = await sql`
      SELECT COALESCE(MAX(version_number), 0) as max_version
      FROM project_versions
      WHERE project_id = ${projectId}
    `;
    
    const nextVersion = (versionCount[0]?.max_version || 0) + 1;
    
    const result = await sql`
      INSERT INTO project_versions (project_id, version_number, data, is_autosave, description)
      VALUES (
        ${projectId},
        ${nextVersion},
        ${JSON.stringify(data)},
        ${isAutosave},
        ${description || null}
      )
      RETURNING *
    `;
    
    return result[0] as ProjectVersion;
  } catch (error) {
    console.error('Failed to create version:', error);
    throw error;
  }
}

/**
 * Get all versions for a project
 */
export async function getVersions(
  projectId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ProjectVersion[]> {
  const sql = getSql();
  
  try {
    const result = await sql`
      SELECT *
      FROM project_versions
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    return result as ProjectVersion[];
  } catch (error) {
    console.error('Failed to get versions:', error);
    throw error;
  }
}

/**
 * Get a specific version by ID
 */
export async function getVersion(versionId: string): Promise<ProjectVersion | null> {
  const sql = getSql();
  
  try {
    const result = await sql`
      SELECT *
      FROM project_versions
      WHERE id = ${versionId}
    `;
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0] as ProjectVersion;
  } catch (error) {
    console.error('Failed to get version:', error);
    throw error;
  }
}

/**
 * Delete old autosave versions, keeping only the most recent N versions
 */
export async function cleanupOldAutosaves(
  projectId: string,
  keepCount: number = 20
): Promise<number> {
  const sql = getSql();
  
  try {
    // Delete autosaves beyond the keep count
    const result = await sql`
      DELETE FROM project_versions
      WHERE id IN (
        SELECT id
        FROM project_versions
        WHERE project_id = ${projectId}
          AND is_autosave = TRUE
        ORDER BY created_at DESC
        OFFSET ${keepCount}
      )
      RETURNING id
    `;
    
    return result.length;
  } catch (error) {
    console.error('Failed to cleanup old autosaves:', error);
    throw error;
  }
}

/**
 * Delete all versions for a project (called when project is deleted)
 */
export async function deleteAllVersions(projectId: string): Promise<number> {
  const sql = getSql();
  
  try {
    const result = await sql`
      DELETE FROM project_versions
      WHERE project_id = ${projectId}
      RETURNING id
    `;
    
    return result.length;
  } catch (error) {
    console.error('Failed to delete versions:', error);
    throw error;
  }
}

/**
 * Update project's last_opened_at timestamp
 */
export async function updateLastOpenedAt(
  projectId: string,
  userId?: string
): Promise<void> {
  const sql = getSql();
  
  try {
    await sql`
      UPDATE projects
      SET last_opened_at = NOW()
      WHERE id = ${projectId}
      ${userId ? sql`AND user_id = ${userId}` : sql``}
    `;
  } catch (error) {
    console.error('Failed to update last_opened_at:', error);
    throw error;
  }
}

/**
 * Update project thumbnail
 */
export async function updateThumbnail(
  projectId: string,
  thumbnailUrl: string,
  userId?: string
): Promise<void> {
  const sql = getSql();
  
  try {
    await sql`
      UPDATE projects
      SET thumbnail_url = ${thumbnailUrl}
      WHERE id = ${projectId}
      ${userId ? sql`AND user_id = ${userId}` : sql``}
    `;
  } catch (error) {
    console.error('Failed to update thumbnail:', error);
    throw error;
  }
}

/**
 * Set has_unsaved_autosave flag
 */
export async function setUnsavedAutosaveFlag(
  projectId: string,
  hasUnsaved: boolean,
  userId?: string
): Promise<void> {
  const sql = getSql();
  
  try {
    await sql`
      UPDATE projects
      SET has_unsaved_autosave = ${hasUnsaved}
      WHERE id = ${projectId}
      ${userId ? sql`AND user_id = ${userId}` : sql``}
    `;
  } catch (error) {
    console.error('Failed to set unsaved autosave flag:', error);
    throw error;
  }
}

/**
 * Rename a project
 */
export async function renameProject(
  projectId: string,
  newName: string,
  userId?: string
): Promise<void> {
  const sql = getSql();
  
  try {
    const result = await sql`
      UPDATE projects
      SET name = ${newName}, updated_at = NOW()
      WHERE id = ${projectId}
      ${userId ? sql`AND user_id = ${userId}` : sql``}
      RETURNING id
    `;
    
    if (result.length === 0) {
      throw new Error('Project not found or permission denied');
    }
  } catch (error) {
    console.error('Failed to rename project:', error);
    throw error;
  }
}

/**
 * Duplicate a project
 */
export async function duplicateProject(
  projectId: string,
  newName: string,
  userId?: string
): Promise<SavedProject> {
  const sql = getSql();
  
  try {
    // Get the original project
    const original = await sql`
      SELECT *
      FROM projects
      WHERE id = ${projectId}
      ${userId ? sql`AND user_id = ${userId}` : sql``}
    `;
    
    if (original.length === 0) {
      throw new Error('Project not found or permission denied');
    }
    
    // Create duplicate
    const result = await sql`
      INSERT INTO projects (name, user_id, project_data)
      VALUES (
        ${newName},
        ${original[0].user_id},
        ${JSON.stringify(original[0].project_data)}
      )
      RETURNING *
    `;
    
    return result[0] as SavedProject;
  } catch (error) {
    console.error('Failed to duplicate project:', error);
    throw error;
  }
}
