import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Section, AnimationType } from '../../types';
import WaveformVisualizer from './WaveformVisualizer';

interface TimelineProps {
  sections: Section[];
  currentTime: number;
  duration: number;
  animationTypes: AnimationType[];
  selectedSectionId: number | null;
  audioBuffer: AudioBuffer | null;
  showWaveform?: boolean;
  onSelectSection: (id: number) => void;
  onUpdateSection: (id: number, field: string, value: any) => void;
  onAddSection: () => void;
  onSeek: (time: number) => void;
}

type TimelineTab = 'sections' | 'presets' | 'camera' | 'text';

/**
 * Timeline Component - After Effects-style timeline with tabs
 * Shows sections as bars that can be moved, trimmed, and resized
 * Includes tabs for Sections, Presets, Camera, and Text organization
 */
export default function Timeline({
  sections,
  currentTime,
  duration,
  animationTypes,
  selectedSectionId,
  audioBuffer,
  showWaveform = true,
  onSelectSection,
  onUpdateSection,
  onAddSection,
  onSeek
}: TimelineProps) {
  const [activeTab, setActiveTab] = useState<TimelineTab>('sections');
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-start' | 'resize-end' | null;
    sectionId: number | null;
    startX: number;
    initialStart: number;
    initialEnd: number;
  }>({ type: null, sectionId: null, startX: 0, initialStart: 0, initialEnd: 0 });

  const timelineRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const PIXELS_PER_SECOND = 40; // Scaling factor
  const TIMELINE_HEIGHT = 60; // Height of each layer bar
  const timelineWidth = Math.max(duration * PIXELS_PER_SECOND, 1000); // CRITICAL FIX: Moved before useEffect

  const formatTime = (s: number) => 
    `${Math.floor(s/60)}:${(Math.floor(s%60)).toString().padStart(2,'0')}`;

  // CRITICAL FIX: Add playhead dragging state
  const [isPlayheadDragging, setIsPlayheadDragging] = useState(false);

  const getAnimationInfo = (animValue: string) => {
    return animationTypes.find(a => a.value === animValue) || {
      value: animValue,
      label: animValue,
      icon: '🎵'
    };
  };

  // Convert time to pixel position
  const timeToPixels = (time: number) => time * PIXELS_PER_SECOND;

  // Convert pixel position to time
  const pixelsToTime = (pixels: number) => Math.max(0, pixels / PIXELS_PER_SECOND);

  // Handle playhead click/drag - CRITICAL FIX: Improved interaction like original slider
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const time = pixelsToTime(x);
    onSeek(Math.min(Math.max(0, time), duration));
    setIsPlayheadDragging(true);
  };

  // CRITICAL FIX: Add playhead drag handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPlayheadDragging && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollOffset;
        const time = pixelsToTime(x);
        onSeek(Math.min(Math.max(0, time), duration));
      }
    };

    const handleMouseUp = () => {
      setIsPlayheadDragging(false);
    };

    if (isPlayheadDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPlayheadDragging, scrollOffset, duration, onSeek]);

  // Start dragging a section
  const handleSectionMouseDown = (
    e: React.MouseEvent,
    section: Section,
    type: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.stopPropagation();
    if (section.locked) return;

    setDragState({
      type,
      sectionId: section.id,
      startX: e.clientX,
      initialStart: section.start,
      initialEnd: section.end
    });
    onSelectSection(section.id);
  };

  // Handle mouse move during drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.type || !dragState.sectionId) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaTime = pixelsToTime(deltaX);

      const section = sections.find(s => s.id === dragState.sectionId);
      if (!section) return;

      if (dragState.type === 'move') {
        // Move the entire section
        const newStart = Math.max(0, dragState.initialStart + deltaTime);
        const duration = dragState.initialEnd - dragState.initialStart;
        const newEnd = newStart + duration;
        
        onUpdateSection(dragState.sectionId, 'start', newStart);
        onUpdateSection(dragState.sectionId, 'end', newEnd);
      } else if (dragState.type === 'resize-start') {
        // Resize from the start
        const newStart = Math.max(0, Math.min(dragState.initialStart + deltaTime, dragState.initialEnd - 1));
        onUpdateSection(dragState.sectionId, 'start', newStart);
      } else if (dragState.type === 'resize-end') {
        // Resize from the end
        const newEnd = Math.max(dragState.initialStart + 1, dragState.initialEnd + deltaTime);
        onUpdateSection(dragState.sectionId, 'end', newEnd);
      }
    };

    const handleMouseUp = () => {
      setDragState({ type: null, sectionId: null, startX: 0, initialStart: 0, initialEnd: 0 });
      // Re-enable text selection
      document.body.style.userSelect = '';
    };

    if (dragState.type) {
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, sections, onUpdateSection]);

  // Handle scroll wheel for horizontal scrolling - CRITICAL FIX: Updated dependencies
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Horizontal scroll with wheel
      setScrollOffset(prev => {
        const newOffset = prev + e.deltaY;
        // Clamp to reasonable bounds
        return Math.max(0, Math.min(newOffset, Math.max(0, timelineWidth - 1000)));
      });
    };

    const timelineElement = timelineRef.current?.parentElement;
    if (timelineElement) {
      timelineElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => timelineElement.removeEventListener('wheel', handleWheel);
    }
  }, [timelineWidth]); // CRITICAL FIX: Changed from [duration] to [timelineWidth]

  return (
    <div className="h-full bg-[#2B2B2B] border-t border-gray-700 flex flex-col shadow-lg">
      {/* Timeline Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Timeline
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
        <button
          onClick={onAddSection}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition-colors"
          title="Add new section"
        >
          <Plus size={14} />
          <span>Add Section</span>
        </button>
      </div>

      {/* Timeline Tabs */}
      <div className="border-b border-gray-700 bg-[#2B2B2B] px-2">
        <div className="flex gap-1">
          {[
            { id: 'sections' as TimelineTab, label: 'Sections', icon: '📋' },
            { id: 'presets' as TimelineTab, label: 'Presets', icon: '🎨' },
            { id: 'camera' as TimelineTab, label: 'Camera', icon: '📷' },
            { id: 'text' as TimelineTab, label: 'Text', icon: '📝' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? 'text-cyan-400 bg-gray-700'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700 hover:bg-opacity-50'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto relative" style={{ scrollLeft: scrollOffset }}>
        {activeTab === 'sections' && (
          <>
        {/* Time ruler */}
        <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 h-8 flex items-center">
          <div className="relative" style={{ width: `${timelineWidth}px` }}>
            {/* Time markers */}
            {Array.from({ length: Math.ceil(duration / 5) + 1 }, (_, i) => i * 5).map(time => (
              <div
                key={time}
                className="absolute top-0 h-full flex items-center"
                style={{ left: `${timeToPixels(time)}px` }}
              >
                <div className="w-px h-2 bg-gray-600" />
                <span className="text-xs text-gray-500 ml-1 font-mono">
                  {formatTime(time)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline tracks */}
        <div 
          ref={timelineRef}
          className="relative cursor-pointer"
          style={{ width: `${timelineWidth}px`, minHeight: '100px' }}
          onClick={handleTimelineClick}
        >
          {/* Waveform background */}
          {showWaveform && audioBuffer && (
            <WaveformVisualizer
              audioBuffer={audioBuffer}
              duration={duration}
              width={timelineWidth}
              height={Math.max(sections.length * (TIMELINE_HEIGHT + 4), 100)}
              color="rgba(100, 180, 255, 0.15)"
            />
          )}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ left: `${timeToPixels(currentTime)}px` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
          </div>

          {/* Section bars */}
          {sections.map((section, index) => {
            const animInfo = getAnimationInfo(section.animation);
            const isSelected = section.id === selectedSectionId;
            const isVisible = section.visible !== false;
            const isLocked = section.locked === true;
            
            const left = timeToPixels(section.start);
            const width = timeToPixels(section.end - section.start);
            const top = index * (TIMELINE_HEIGHT + 4);

            return (
              <div
                key={section.id}
                className={`absolute rounded transition-all ${
                  isSelected
                    ? 'ring-2 ring-[#4A90E2] z-10'
                    : 'hover:ring-1 hover:ring-gray-500'
                } ${!isVisible ? 'opacity-40' : ''} ${
                  isLocked ? 'cursor-not-allowed' : 'cursor-move'
                }`}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${TIMELINE_HEIGHT}px`,
                  backgroundColor: isSelected ? '#4A90E2' : '#5a5a5a',
                  backgroundImage: isSelected 
                    ? 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)'
                    : 'none'
                }}
                onMouseDown={(e) => !isLocked && handleSectionMouseDown(e, section, 'move')}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSection(section.id);
                }}
              >
                {/* Section content */}
                <div className="h-full px-2 py-1 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{animInfo.icon}</span>
                    <span className="text-xs font-semibold text-white truncate">
                      {animInfo.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 font-mono">
                    {formatTime(section.start)} - {formatTime(section.end)}
                  </div>

                  {/* Resize handles */}
                  {!isLocked && (
                    <>
                      {/* Left resize handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-cyan-400 bg-opacity-50 transition-colors"
                        onMouseDown={(e) => handleSectionMouseDown(e, section, 'resize-start')}
                        title="Resize start"
                      />
                      {/* Right resize handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-cyan-400 bg-opacity-50 transition-colors"
                        onMouseDown={(e) => handleSectionMouseDown(e, section, 'resize-end')}
                        title="Resize end"
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg mb-2">🎨 Preset Keyframes</p>
            <p className="text-sm">Timeline-based preset automation coming soon</p>
            <p className="text-xs mt-2 text-gray-500">Switch presets at specific timestamps for automated transitions</p>
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg mb-2">📷 Camera Keyframes</p>
            <p className="text-sm">Timeline-based camera animation coming soon</p>
            <p className="text-xs mt-2 text-gray-500">Animate camera position, rotation, and distance over time</p>
          </div>
        )}

        {/* Text Tab */}
        {activeTab === 'text' && (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg mb-2">📝 Text Keyframes</p>
            <p className="text-sm">3D text overlay animations coming soon</p>
            <p className="text-xs mt-2 text-gray-500">Animate song name position, scale, rotation, and opacity</p>
          </div>
        )}
      </div>
    </div>
  );
}
