import React, { useState } from 'react';
import { Film, Music } from 'lucide-react';
import { ProjectSettings } from '../../types';

interface NewProjectModalProps {
  onCreateProject: (settings: ProjectSettings, audioFile?: File) => void;
}

/**
 * PHASE 2: New Project Modal
 * Displays before the editor loads to collect initial project settings
 * Settings can be changed later, but this establishes the initial state
 */
export default function NewProjectModal({ onCreateProject }: NewProjectModalProps) {
  // Project configuration state
  const [projectName, setProjectName] = useState('Untitled Project');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [fps, setFps] = useState(30);
  const [backgroundColor, setBackgroundColor] = useState('#0a0a14');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Common resolution presets
  const resolutionPresets = [
    { label: '720p (1280×720)', width: 1280, height: 720 },
    { label: '1080p (1920×1080)', width: 1920, height: 1080 },
    { label: '1440p (2560×1440)', width: 2560, height: 1440 },
    { label: '4K (3840×2160)', width: 3840, height: 2160 },
    { label: 'Instagram Square (1080×1080)', width: 1080, height: 1080 },
    { label: 'Instagram Story (1080×1920)', width: 1080, height: 1920 },
    { label: 'YouTube Shorts (1080×1920)', width: 1080, height: 1920 },
  ];

  const handleCreate = () => {
    // PHASE 2: Create project settings object
    const settings: ProjectSettings = {
      name: projectName || 'Untitled Project',
      resolution: { width, height },
      fps,
      backgroundColor,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      audioFileName: audioFile?.name
    };

    onCreateProject(settings, audioFile || undefined);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#2B2B2B] border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-cyan-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Film size={28} />
            New Project
          </h2>
          <p className="text-purple-100 text-sm mt-1">
            Configure your music visualization project
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-2 bg-[#1E1E1E] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="My Awesome Visualizer"
            />
          </div>

          {/* Resolution */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Export Resolution
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Preset Dropdown */}
              <select
                onChange={(e) => {
                  const preset = resolutionPresets[parseInt(e.target.value)];
                  if (preset) {
                    setWidth(preset.width);
                    setHeight(preset.height);
                  }
                }}
                className="col-span-2 px-4 py-2 bg-[#1E1E1E] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">Select a preset...</option>
                {resolutionPresets.map((preset, idx) => (
                  <option key={idx} value={idx}>
                    {preset.label}
                  </option>
                ))}
              </select>

              {/* Custom Width */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 1920)}
                  min="320"
                  max="7680"
                  className="w-full px-3 py-2 bg-[#1E1E1E] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Custom Height */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 1080)}
                  min="240"
                  max="4320"
                  className="w-full px-3 py-2 bg-[#1E1E1E] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Aspect ratio: {(width / height).toFixed(2)} {width === 1920 && height === 1080 && '(16:9)'}{width === 1080 && height === 1920 && '(9:16)'}
            </p>
          </div>

          {/* FPS */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Frame Rate (FPS)
            </label>
            <div className="flex gap-2">
              {[24, 30, 60].map((fpsValue) => (
                <button
                  key={fpsValue}
                  onClick={() => setFps(fpsValue)}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    fps === fpsValue
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1E1E1E] text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {fpsValue} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Background Color
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#1E1E1E] border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none font-mono"
                placeholder="#0a0a14"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Can be changed later in canvas properties
            </p>
          </div>

          {/* Optional Audio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Music size={16} />
              Audio File (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
                id="audio-upload"
              />
              <label
                htmlFor="audio-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#1E1E1E] border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors"
              >
                {audioFile ? (
                  <span className="text-cyan-400">{audioFile.name}</span>
                ) : (
                  <span>Click to upload audio file (can add later)</span>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#1E1E1E] px-6 py-4 flex justify-end gap-3 border-t border-gray-700">
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all shadow-lg"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
