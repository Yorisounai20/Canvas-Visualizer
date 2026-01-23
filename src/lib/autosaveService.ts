/**
 * Autosave service
 * Manages automatic project saving with version history
 */

import { ProjectState } from '../types';
import { createVersion, setUnsavedAutosaveFlag, cleanupOldAutosaves } from './database';

interface AutosaveSettings {
  enabled: boolean;
  intervalMs: number;
  maxVersions: number;
  idleThresholdMs: number;
}

export class AutosaveService {
  private interval: NodeJS.Timeout | null = null;
  private projectId: string | null = null;
  private userId: string | undefined = undefined;
  private getStateFunc: (() => ProjectState) | null = null;
  private lastStateHash: string | null = null;
  private lastActivityTime: number = Date.now();
  private settings: AutosaveSettings = {
    enabled: true,
    intervalMs: 3 * 60 * 1000, // 3 minutes default
    maxVersions: 20,
    idleThresholdMs: 10 * 60 * 1000, // 10 minutes
  };
  private onSaveCallback: ((success: boolean, error?: Error) => void) | null = null;

  /**
   * Update autosave settings
   */
  public updateSettings(settings: Partial<AutosaveSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Restart if running with new interval
    if (this.interval && settings.intervalMs) {
      this.stop();
      if (this.projectId && this.getStateFunc) {
        this.start(this.projectId, this.getStateFunc, this.userId);
      }
    }
  }

  /**
   * Get current settings
   */
  public getSettings(): AutosaveSettings {
    return { ...this.settings };
  }

  /**
   * Start autosave for a project
   */
  public start(
    projectId: string,
    getState: () => ProjectState,
    userId?: string,
    onSave?: (success: boolean, error?: Error) => void
  ): void {
    this.stop(); // Stop any existing autosave
    
    this.projectId = projectId;
    this.userId = userId;
    this.getStateFunc = getState;
    this.onSaveCallback = onSave || null;
    this.lastActivityTime = Date.now();
    this.lastStateHash = this.hashState(getState());
    
    if (!this.settings.enabled) {
      return;
    }
    
    this.interval = setInterval(() => {
      this.attemptAutosave();
    }, this.settings.intervalMs);
    
    console.log('Autosave started for project:', projectId);
  }

  /**
   * Stop autosave
   */
  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.projectId = null;
    this.getStateFunc = null;
    this.lastStateHash = null;
    
    console.log('Autosave stopped');
  }

  /**
   * Trigger an immediate autosave
   */
  public async triggerNow(): Promise<boolean> {
    return this.attemptAutosave();
  }

  /**
   * Update last activity time (call on user interaction)
   */
  public updateActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * Attempt to autosave
   */
  private async attemptAutosave(): Promise<boolean> {
    if (!this.settings.enabled || !this.projectId || !this.getStateFunc) {
      return false;
    }

    // Check if user is idle
    if (this.isUserIdle()) {
      console.log('User is idle, skipping autosave');
      return false;
    }

    // Check if state has changed
    const currentState = this.getStateFunc();
    const currentHash = this.hashState(currentState);
    
    if (currentHash === this.lastStateHash) {
      console.log('No changes detected, skipping autosave');
      return false;
    }

    // Perform autosave
    try {
      console.log('Autosaving project...');
      
      await createVersion(this.projectId, currentState, true);
      await setUnsavedAutosaveFlag(this.projectId, true, this.userId);
      await cleanupOldAutosaves(this.projectId, this.settings.maxVersions);
      
      this.lastStateHash = currentHash;
      
      console.log('Autosave successful');
      
      if (this.onSaveCallback) {
        this.onSaveCallback(true);
      }
      
      return true;
    } catch (error) {
      console.error('Autosave failed:', error);
      
      if (this.onSaveCallback) {
        this.onSaveCallback(false, error as Error);
      }
      
      return false;
    }
  }

  /**
   * Check if user is idle
   */
  private isUserIdle(): boolean {
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    return timeSinceActivity > this.settings.idleThresholdMs;
  }

  /**
   * Generate a simple hash of the project state
   */
  private hashState(state: ProjectState): string {
    // Simple hash using JSON stringify
    // In production, consider using a proper hash function
    const stateStr = JSON.stringify(state);
    let hash = 0;
    for (let i = 0; i < stateStr.length; i++) {
      const char = stateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// Export a singleton instance
export const autosaveService = new AutosaveService();
