import React, { useRef } from 'react';

interface CanvasWrapperProps {
  containerRef: React.RefObject<HTMLDivElement>;
  showBorder: boolean;
  borderColor: string;
  showLetterbox: boolean;
  letterboxSize: number;
  activeLetterboxInvert: boolean;
  maxLetterboxHeight: number;
  showFilename: boolean;
  audioFileName: string;
}

/**
 * CanvasWrapper Component - 3D canvas preview area
 * Wraps the Three.js canvas with overlays and effects
 */
export default function CanvasWrapper({
  containerRef,
  showBorder,
  borderColor,
  showLetterbox,
  letterboxSize,
  activeLetterboxInvert,
  maxLetterboxHeight,
  showFilename,
  audioFileName
}: CanvasWrapperProps) {
  // Calculate actual letterbox bar height
  const actualBarHeight = activeLetterboxInvert 
    ? Math.round((letterboxSize / 100) * maxLetterboxHeight)
    : letterboxSize;

  return (
    <div className="flex-1 flex items-center justify-center bg-[#1E1E1E] p-4">
      <div className="relative">
        {/* Canvas container - this is where Three.js will render */}
        <div 
          ref={containerRef} 
          className={`rounded-lg shadow-2xl overflow-hidden ${showBorder ? 'border-2' : ''}`}
          style={{
            width: '960px',
            height: '540px',
            borderColor: showBorder ? borderColor : 'transparent'
          }}
        />

        {/* Letterbox overlay */}
        {showLetterbox && (
          <>
            <div 
              className="absolute top-0 left-0 right-0 bg-black pointer-events-none transition-all duration-300"
              style={{ height: `${actualBarHeight}px` }}
            />
            <div 
              className="absolute bottom-0 left-0 right-0 bg-black pointer-events-none transition-all duration-300"
              style={{ height: `${actualBarHeight}px` }}
            />
          </>
        )}

        {/* Filename overlay */}
        {showFilename && audioFileName && (
          <div 
            className="absolute text-white text-sm bg-black bg-opacity-70 px-3 py-2 rounded font-semibold pointer-events-none transition-all"
            style={{
              top: `${showLetterbox ? actualBarHeight + 16 : 16}px`,
              left: '16px'
            }}
          >
            {audioFileName}
          </div>
        )}
      </div>
    </div>
  );
}
