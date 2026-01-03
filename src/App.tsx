import { useState, lazy, Suspense } from 'react';
import NewProjectModal from './components/Modals/NewProjectModal';
import MainDashboard from './components/Dashboard/MainDashboard';
import { ProjectSettings } from './types';

// Lazy load the large visualizer components for code splitting
const VisualizerEditor = lazy(() => import('./VisualizerEditor'));
const ThreeDVisualizer = lazy(() => import('./visualizer-software'));

/**
 * App Component
 * Manages the main application flow:
 * 1. Shows MainDashboard to select between Editor or Software mode
 * 2. Shows NewProjectModal for project settings (Editor mode only)
 * 3. Loads the selected mode (VisualizerEditor or ThreeDVisualizer)
 */
function App() {
  const [selectedMode, setSelectedMode] = useState<'editor' | 'software' | null>(null);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const [initialAudioFile, setInitialAudioFile] = useState<File | undefined>(undefined);

  const handleSelectMode = (mode: 'editor' | 'software') => {
    setSelectedMode(mode);
    
    // Software mode goes directly to the visualizer (no project modal needed)
    if (mode === 'software') {
      // ThreeDVisualizer doesn't need project settings, it's self-contained
      return;
    }
  };

  const handleCreateProject = (settings: ProjectSettings, audioFile?: File) => {
    setProjectSettings(settings);
    setInitialAudioFile(audioFile);
    console.log('Project created:', settings);
  };

  const handleBackToDashboard = () => {
    setSelectedMode(null);
    setProjectSettings(null);
    setInitialAudioFile(undefined);
  };

  // Step 1: Show mode selection dashboard
  if (!selectedMode) {
    return <MainDashboard onSelectMode={handleSelectMode} />;
  }

  // Step 2a: Software mode - directly show the simple visualizer
  if (selectedMode === 'software') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>}>
        <ThreeDVisualizer />
      </Suspense>
    );
  }

  // Step 2b: Editor mode - show project modal first
  if (!projectSettings) {
    return <NewProjectModal onCreateProject={handleCreateProject} />;
  }

  // Step 3: Show the editor with project settings
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>}>
      <VisualizerEditor 
        projectSettings={projectSettings}
        initialAudioFile={initialAudioFile}
      />
    </Suspense>
  );
}

export default App;
