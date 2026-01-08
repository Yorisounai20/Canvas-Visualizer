import React from 'react';
import { CameraFXClip } from '../../types';

interface CameraFXOverlayProps {
  activeFXClips: CameraFXClip[];
  showOverlays: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * CameraFXOverlay Component - Visual guides for Camera FX editing
 * Shows grid lines, symmetry guides, and PIP bounds overlay
 * Only visible during editing, hidden during export
 */
export default function CameraFXOverlay({
  activeFXClips,
  showOverlays,
  canvasWidth,
  canvasHeight
}: CameraFXOverlayProps) {
  if (!showOverlays || activeFXClips.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100 }}>
      {activeFXClips.map(clip => {
        if (!clip.enabled) return null;

        if (clip.type === 'grid') {
          // Grid overlay
          const rows = clip.gridRows || 2;
          const cols = clip.gridColumns || 2;
          const cellWidth = canvasWidth / cols;
          const cellHeight = canvasHeight / rows;

          return (
            <svg
              key={clip.id}
              width={canvasWidth}
              height={canvasHeight}
              className="absolute top-0 left-0"
            >
              {/* Vertical lines */}
              {Array.from({ length: cols + 1 }, (_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * cellWidth}
                  y1={0}
                  x2={i * cellWidth}
                  y2={canvasHeight}
                  stroke="#00ffff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
              ))}
              {/* Horizontal lines */}
              {Array.from({ length: rows + 1 }, (_, i) => (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={i * cellHeight}
                  x2={canvasWidth}
                  y2={i * cellHeight}
                  stroke="#00ffff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
              ))}
              {/* Grid info label */}
              <text
                x={10}
                y={30}
                fill="#00ffff"
                fontSize="14"
                fontWeight="bold"
                style={{ textShadow: '0 0 4px black' }}
              >
                Grid: {cols}x{rows}
              </text>
            </svg>
          );
        } else if (clip.type === 'kaleidoscope') {
          // Kaleidoscope symmetry guides
          const segments = clip.kaleidoscopeSegments || 6;
          const rotation = (clip.kaleidoscopeRotation || 0) * Math.PI / 180;
          const centerX = canvasWidth / 2;
          const centerY = canvasHeight / 2;
          const radius = Math.sqrt(centerX * centerX + centerY * centerY);
          const wedgeAngle = (Math.PI * 2) / segments;

          return (
            <svg
              key={clip.id}
              width={canvasWidth}
              height={canvasHeight}
              className="absolute top-0 left-0"
            >
              {/* Center circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r={10}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
              />
              {/* Symmetry lines */}
              {Array.from({ length: segments }, (_, i) => {
                const angle = i * wedgeAngle + rotation;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                return (
                  <line
                    key={i}
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeDasharray="8,4"
                    opacity="0.7"
                  />
                );
              })}
              {/* Kaleidoscope info label */}
              <text
                x={10}
                y={30}
                fill="#a855f7"
                fontSize="14"
                fontWeight="bold"
                style={{ textShadow: '0 0 4px black' }}
              >
                Kaleidoscope: {segments} segments
              </text>
            </svg>
          );
        } else if (clip.type === 'pip') {
          // Picture-in-Picture bounds
          const scale = clip.pipScale || 0.25;
          const posX = clip.pipPositionX || 0.65;
          const posY = clip.pipPositionY || 0.65;
          const pipWidth = canvasWidth * scale;
          const pipHeight = canvasHeight * scale;
          const pipX = ((posX + 1) / 2) * (canvasWidth - pipWidth);
          const pipY = ((posY + 1) / 2) * (canvasHeight - pipHeight);
          const borderWidth = clip.pipBorderWidth || 2;
          const borderColor = clip.pipBorderColor || '#ffffff';

          return (
            <svg
              key={clip.id}
              width={canvasWidth}
              height={canvasHeight}
              className="absolute top-0 left-0"
            >
              {/* PIP bounds rectangle */}
              <rect
                x={pipX}
                y={pipY}
                width={pipWidth}
                height={pipHeight}
                fill="none"
                stroke={borderColor}
                strokeWidth={borderWidth * 2}
                strokeDasharray="10,5"
                opacity="0.8"
              />
              {/* Corner markers */}
              {[
                [pipX, pipY],
                [pipX + pipWidth, pipY],
                [pipX, pipY + pipHeight],
                [pipX + pipWidth, pipY + pipHeight]
              ].map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={6}
                  fill={borderColor}
                  opacity="0.8"
                />
              ))}
              {/* PIP info label */}
              <text
                x={10}
                y={30}
                fill={borderColor}
                fontSize="14"
                fontWeight="bold"
                style={{ textShadow: '0 0 4px black' }}
              >
                PIP: {Math.round(scale * 100)}%
              </text>
            </svg>
          );
        }

        return null;
      })}
    </div>
  );
}
