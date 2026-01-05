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
        updated_at TIMESTAMP DEFAULT NOW()
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
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Save a new project or update an existing one
 */
export async function saveProject(
  projectState: ProjectState,
  projectId?: string,
  userId?: string
): Promise<SavedProject> {
  const sql = getSql();
  
  try {
    if (projectId) {
      // Update existing project
      const result = await sql`
        UPDATE projects
        SET 
          name = ${projectState.settings.name},
          project_data = ${JSON.stringify(projectState)},
          updated_at = NOW()
        WHERE id = ${projectId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error(`Project with id ${projectId} not found`);
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
 */
export async function loadProject(projectId: string): Promise<ProjectState | null> {
  const sql = getSql();
  
  try {
    const result = await sql`
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
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const sql = getSql();
  
  try {
    const result = await sql`
      DELETE FROM projects
      WHERE id = ${projectId}
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
 */
export function isDatabaseAvailable(): boolean {
  try {
    const url = import.meta.env.VITE_DATABASE_URL;
    return !!url;
  } catch {
    return false;
  }
}
