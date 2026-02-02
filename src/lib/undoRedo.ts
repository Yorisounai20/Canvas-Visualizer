/**
 * Undo/Redo System for Workspace
 * Blender-like history management
 */

import { WorkspaceObject } from '../types';

export interface HistoryState {
  objects: WorkspaceObject[];
  selectedObjectId: string | null;
  timestamp: number;
}

export class UndoRedoManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistory: number = 50; // Limit history to prevent memory issues

  /**
   * Push a new state to history
   */
  pushState(objects: WorkspaceObject[], selectedObjectId: string | null) {
    // Remove any states after current index (if we're not at the end)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new state
    const newState: HistoryState = {
      objects: JSON.parse(JSON.stringify(objects)), // Deep copy
      selectedObjectId,
      timestamp: Date.now()
    };

    this.history.push(newState);

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * Undo to previous state
   */
  undo(): HistoryState | null {
    if (!this.canUndo()) return null;
    
    this.currentIndex--;
    return this.history[this.currentIndex];
  }

  /**
   * Redo to next state
   */
  redo(): HistoryState | null {
    if (!this.canRedo()) return null;
    
    this.currentIndex++;
    return this.history[this.currentIndex];
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current state index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get total history length
   */
  getHistoryLength(): number {
    return this.history.length;
  }

  /**
   * Clear all history
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get current state
   */
  getCurrentState(): HistoryState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }
}

// Global instance
export const undoRedoManager = new UndoRedoManager();
