/**
 * PR 9: Performance Debug Overlay
 * 
 * Visual overlay showing real-time performance metrics
 */

import React from 'react';
import type { FrameMetrics, PerformanceWarning } from '../../lib/performanceMonitor';

interface PerformanceOverlayProps {
  visible: boolean;
  metrics: FrameMetrics | null;
  averages: {
    avgFps: number;
    avgFrameTime: number;
    avgSolverTime: number;
    avgObjectCount: number;
  };
  warnings: PerformanceWarning[];
}

export function PerformanceOverlay({
  visible,
  metrics,
  averages,
  warnings
}: PerformanceOverlayProps) {
  if (!visible || !metrics) return null;

  // Color coding based on FPS
  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Color coding based on frame time
  const getFrameTimeColor = (ms: number) => {
    if (ms < 16.67) return 'text-green-400';
    if (ms < 33.33) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs font-mono z-50 min-w-[200px]">
      {/* Title */}
      <div className="text-gray-300 font-bold mb-2 border-b border-gray-700 pb-1">
        ⚡ Performance Monitor
      </div>

      {/* FPS */}
      <div className="flex justify-between mb-1">
        <span className="text-gray-400">FPS:</span>
        <span className={`font-bold ${getFpsColor(metrics.fps)}`}>
          {metrics.fps.toFixed(0)}
        </span>
      </div>

      {/* Frame Time */}
      <div className="flex justify-between mb-1">
        <span className="text-gray-400">Frame:</span>
        <span className={getFrameTimeColor(metrics.frameTime)}>
          {metrics.frameTime.toFixed(1)}ms
        </span>
      </div>

      {/* Solver Time */}
      {metrics.solverTime !== undefined && (
        <div className="flex justify-between mb-1">
          <span className="text-gray-400">Solver:</span>
          <span className={metrics.solverTime > 10 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.solverTime.toFixed(1)}ms
          </span>
        </div>
      )}

      {/* Object Count */}
      <div className="flex justify-between mb-1">
        <span className="text-gray-400">Objects:</span>
        <span className={metrics.visibleObjects > 100 ? 'text-yellow-400' : 'text-gray-300'}>
          {metrics.visibleObjects}/{metrics.objectCount}
        </span>
      </div>

      {/* Averages Section */}
      <div className="mt-2 pt-2 border-t border-gray-700">
        <div className="text-gray-500 text-[10px] mb-1">AVERAGES (60f)</div>
        
        <div className="flex justify-between mb-1">
          <span className="text-gray-500">FPS:</span>
          <span className="text-gray-400">
            {averages.avgFps.toFixed(0)}
          </span>
        </div>
        
        <div className="flex justify-between mb-1">
          <span className="text-gray-500">Frame:</span>
          <span className="text-gray-400">
            {averages.avgFrameTime.toFixed(1)}ms
          </span>
        </div>
        
        {averages.avgSolverTime > 0 && (
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">Solver:</span>
            <span className="text-gray-400">
              {averages.avgSolverTime.toFixed(1)}ms
            </span>
          </div>
        )}
      </div>

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="text-gray-500 text-[10px] mb-1">WARNINGS</div>
          {warnings.map((warning, i) => (
            <div
              key={i}
              className={`text-[10px] mb-1 ${
                warning.level === 'critical' ? 'text-red-400' : 'text-yellow-400'
              }`}
            >
              {warning.level === 'critical' ? '🚨' : '⚠️'} {warning.type.toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-gray-700 text-gray-600 text-[9px]">
        Press P to toggle
      </div>
    </div>
  );
}
