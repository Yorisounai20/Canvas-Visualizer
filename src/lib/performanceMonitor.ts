/**
 * PR 9: Performance Guardrails (FINAL PR!)
 * 
 * Prevents accidental FPS degradation with runtime monitoring and warnings.
 * Makes it impossible to accidentally kill performance.
 */

/**
 * Performance thresholds
 */
export interface PerformanceThresholds {
  // Object counts
  objectsWarning: number;      // Yellow warning
  objectsCritical: number;     // Red alert
  
  // Solver execution time (ms)
  solverTimeWarning: number;   // Yellow warning
  solverTimeCritical: number;  // Red alert
  
  // Frame time (ms) for FPS targets
  frameTime60fps: number;      // 16.67ms for 60 FPS
  frameTime30fps: number;      // 33.33ms for 30 FPS
}

/**
 * Default performance thresholds
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  objectsWarning: 100,
  objectsCritical: 200,
  solverTimeWarning: 10,       // 10ms
  solverTimeCritical: 20,      // 20ms
  frameTime60fps: 16.67,
  frameTime30fps: 33.33
};

/**
 * Performance metrics for a single frame
 */
export interface FrameMetrics {
  timestamp: number;
  frameTime: number;           // Total frame time (ms)
  fps: number;                 // Calculated FPS
  solverTime?: number;         // Solver execution time (ms)
  objectCount: number;         // Number of active objects
  visibleObjects: number;      // Number of visible objects
  warnings: PerformanceWarning[];
}

/**
 * Performance warning
 */
export interface PerformanceWarning {
  type: 'objects' | 'solver' | 'fps';
  level: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private thresholds: PerformanceThresholds;
  private history: FrameMetrics[] = [];
  private maxHistorySize = 60; // Keep last 60 frames
  private lastFrameTime = 0;
  private enabled = true;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Start timing a frame
   */
  startFrame(): number {
    return performance.now();
  }

  /**
   * End frame and record metrics
   */
  endFrame(
    startTime: number,
    objectCount: number,
    visibleObjects: number,
    solverTime?: number
  ): FrameMetrics {
    const now = performance.now();
    const frameTime = now - startTime;
    const fps = 1000 / (now - this.lastFrameTime || 16.67);
    this.lastFrameTime = now;

    const metrics: FrameMetrics = {
      timestamp: now,
      frameTime,
      fps,
      solverTime,
      objectCount,
      visibleObjects,
      warnings: []
    };

    // Check for warnings
    this.checkWarnings(metrics);

    // Store in history
    this.history.push(metrics);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    return metrics;
  }

  /**
   * Time a solver execution
   */
  timeSolver<T>(solverFn: () => T): { result: T; time: number } {
    const start = performance.now();
    const result = solverFn();
    const time = performance.now() - start;
    return { result, time };
  }

  /**
   * Check for performance warnings
   */
  private checkWarnings(metrics: FrameMetrics): void {
    // Check object count
    if (metrics.visibleObjects >= this.thresholds.objectsCritical) {
      metrics.warnings.push({
        type: 'objects',
        level: 'critical',
        message: `Too many objects (${metrics.visibleObjects}). Performance severely degraded!`,
        value: metrics.visibleObjects,
        threshold: this.thresholds.objectsCritical
      });
    } else if (metrics.visibleObjects >= this.thresholds.objectsWarning) {
      metrics.warnings.push({
        type: 'objects',
        level: 'warning',
        message: `High object count (${metrics.visibleObjects}). Consider reducing objects.`,
        value: metrics.visibleObjects,
        threshold: this.thresholds.objectsWarning
      });
    }

    // Check solver execution time
    if (metrics.solverTime) {
      if (metrics.solverTime >= this.thresholds.solverTimeCritical) {
        metrics.warnings.push({
          type: 'solver',
          level: 'critical',
          message: `Solver too slow (${metrics.solverTime.toFixed(1)}ms). Optimize solver logic!`,
          value: metrics.solverTime,
          threshold: this.thresholds.solverTimeCritical
        });
      } else if (metrics.solverTime >= this.thresholds.solverTimeWarning) {
        metrics.warnings.push({
          type: 'solver',
          level: 'warning',
          message: `Solver taking time (${metrics.solverTime.toFixed(1)}ms). May impact FPS.`,
          value: metrics.solverTime,
          threshold: this.thresholds.solverTimeWarning
        });
      }
    }

    // Check FPS
    if (metrics.frameTime >= this.thresholds.frameTime30fps) {
      metrics.warnings.push({
        type: 'fps',
        level: 'critical',
        message: `Low FPS (${metrics.fps.toFixed(0)}). Frame time: ${metrics.frameTime.toFixed(1)}ms`,
        value: metrics.fps,
        threshold: 30
      });
    } else if (metrics.frameTime >= this.thresholds.frameTime60fps) {
      metrics.warnings.push({
        type: 'fps',
        level: 'warning',
        message: `Below 60 FPS (${metrics.fps.toFixed(0)}). Frame time: ${metrics.frameTime.toFixed(1)}ms`,
        value: metrics.fps,
        threshold: 60
      });
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): FrameMetrics | null {
    return this.history[this.history.length - 1] || null;
  }

  /**
   * Get average metrics over last N frames
   */
  getAverageMetrics(frames = 60): {
    avgFps: number;
    avgFrameTime: number;
    avgSolverTime: number;
    avgObjectCount: number;
  } {
    const recent = this.history.slice(-frames);
    if (recent.length === 0) {
      return { avgFps: 0, avgFrameTime: 0, avgSolverTime: 0, avgObjectCount: 0 };
    }

    const sum = recent.reduce(
      (acc, m) => ({
        fps: acc.fps + m.fps,
        frameTime: acc.frameTime + m.frameTime,
        solverTime: acc.solverTime + (m.solverTime || 0),
        objectCount: acc.objectCount + m.objectCount
      }),
      { fps: 0, frameTime: 0, solverTime: 0, objectCount: 0 }
    );

    return {
      avgFps: sum.fps / recent.length,
      avgFrameTime: sum.frameTime / recent.length,
      avgSolverTime: sum.solverTime / recent.length,
      avgObjectCount: sum.objectCount / recent.length
    };
  }

  /**
   * Get all warnings from recent frames
   */
  getRecentWarnings(frames = 10): PerformanceWarning[] {
    const recent = this.history.slice(-frames);
    const warnings: PerformanceWarning[] = [];
    
    for (const metrics of recent) {
      warnings.push(...metrics.warnings);
    }
    
    // Deduplicate by type and level
    const uniqueWarnings = new Map<string, PerformanceWarning>();
    for (const warning of warnings) {
      const key = `${warning.type}-${warning.level}`;
      uniqueWarnings.set(key, warning);
    }
    
    return Array.from(uniqueWarnings.values());
  }

  /**
   * Check if performance is degraded
   */
  isPerformanceDegraded(): boolean {
    const current = this.getCurrentMetrics();
    if (!current) return false;
    
    return current.warnings.some(w => w.level === 'critical');
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Is monitoring enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get performance summary for export validation
   */
  getExportSummary(): {
    safe: boolean;
    warnings: string[];
    metrics: {
      fps: number;
      objectCount: number;
      solverTime: number;
    };
  } {
    const avg = this.getAverageMetrics(30);
    const warnings: string[] = [];
    let safe = true;

    if (avg.avgObjectCount > this.thresholds.objectsWarning) {
      warnings.push(`High object count (${Math.round(avg.avgObjectCount)})`);
      if (avg.avgObjectCount > this.thresholds.objectsCritical) {
        safe = false;
      }
    }

    if (avg.avgSolverTime > this.thresholds.solverTimeWarning) {
      warnings.push(`Slow solver (${avg.avgSolverTime.toFixed(1)}ms)`);
      if (avg.avgSolverTime > this.thresholds.solverTimeCritical) {
        safe = false;
      }
    }

    if (avg.avgFps < 30) {
      warnings.push(`Low FPS (${avg.avgFps.toFixed(0)})`);
      safe = false;
    }

    return {
      safe,
      warnings,
      metrics: {
        fps: avg.avgFps,
        objectCount: avg.avgObjectCount,
        solverTime: avg.avgSolverTime
      }
    };
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * Helper: Log warnings to console
 */
export function logWarningsToConsole(warnings: PerformanceWarning[]): void {
  for (const warning of warnings) {
    const prefix = warning.level === 'critical' ? '🚨' : '⚠️';
    const style = warning.level === 'critical' 
      ? 'color: red; font-weight: bold;'
      : 'color: orange;';
    
    console.warn(`%c${prefix} Performance ${warning.level.toUpperCase()}: ${warning.message}`, style);
  }
}
