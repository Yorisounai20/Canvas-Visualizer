import { useState, lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import NewProjectModal from './components/Modals/NewProjectModal';
import Home from './pages/Home';
import { ProjectSettings } from './types';

// Lazy load the large visualizer components for code splitting
const VisualizerEditor = lazy(() => import('./VisualizerEditor'));
const ThreeDVisualizer = lazy(() => import('./visualizer-software'));

// LocalStorage key for mode persistence
const MODE_STORAGE_KEY = 'canvas-visualizer-selected-mode';

/**
 * Loading component for lazy-loaded routes
 */
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

/**
 * Editor Mode Component - handles the project modal and editor flow
 */
function EditorMode() {
  const navigate = useNavigate();
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const [initialAudioFile, setInitialAudioFile] = useState<File | undefined>(undefined);

  const handleCreateProject = (settings: ProjectSettings, audioFile?: File) => {
    setProjectSettings(settings);
    setInitialAudioFile(audioFile);
  };

  const handleBackToDashboard = () => {
    // Clear the persisted mode when going back to dashboard
    localStorage.removeItem(MODE_STORAGE_KEY);
    navigate('/');
  };

  // Show project modal first if no project settings
  if (!projectSettings) {
    return <NewProjectModal onCreateProject={handleCreateProject} />;
  }

  // Show the editor with project settings
  return (
    <Suspense fallback={<LoadingScreen />}>
      <VisualizerEditor 
        projectSettings={projectSettings}
        initialAudioFile={initialAudioFile}
        onBackToDashboard={handleBackToDashboard}
      />
    </Suspense>
  );
}

/**
 * Software Mode Component - direct access to the visualizer
 */
function SoftwareMode() {
  const navigate = useNavigate();
  
  const handleBackToDashboard = () => {
    // Clear the persisted mode when going back to dashboard
    localStorage.removeItem(MODE_STORAGE_KEY);
    navigate('/');
  };
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ThreeDVisualizer onBackToDashboard={handleBackToDashboard} />
    </Suspense>
  );
}

/**
 * App Component with mode persistence
 */
function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // On initial load, check if there's a persisted mode and redirect to it
  useEffect(() => {
    // Only redirect from root path
    if (location.pathname === '/') {
      const persistedMode = localStorage.getItem(MODE_STORAGE_KEY);
      if (persistedMode === 'editor' || persistedMode === 'software') {
        navigate(`/${persistedMode}`, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return (
    <Routes>
      {/* Home/Dashboard route */}
      <Route path="/" element={<Home />} />

      {/* Mode routes - no authentication required */}
      <Route path="/editor" element={<EditorMode />} />
      <Route path="/software" element={<SoftwareMode />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
