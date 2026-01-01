import { useState } from 'react';
import VisualizerEditor from './VisualizerEditor';
import NewProjectModal from './components/Modals/NewProjectModal';
import { ProjectSettings } from './types';

/**
 * PHASE 2: App Component
 * Manages project creation flow:
 * 1. Shows NewProjectModal first
 * 2. Once project is created, loads VisualizerEditor with settings
 */
function App() {
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const [initialAudioFile, setInitialAudioFile] = useState<File | undefined>(undefined);

  const handleCreateProject = (settings: ProjectSettings, audioFile?: File) => {
    // PHASE 2: Store project settings and transition to editor
    setProjectSettings(settings);
    setInitialAudioFile(audioFile);
    console.log('Project created:', settings);
  };

  // PHASE 2: Show modal until project is created
  if (!projectSettings) {
    return <NewProjectModal onCreateProject={handleCreateProject} />;
  }

  // PHASE 2: Once project exists, show editor with settings
  return (
    <VisualizerEditor 
      projectSettings={projectSettings}
      initialAudioFile={initialAudioFile}
    />
  );
}

export default App;
