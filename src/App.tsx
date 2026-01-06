import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@stackframe/stack';
import NewProjectModal from './components/Modals/NewProjectModal';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Account from './pages/Account';
import { ProjectSettings } from './types';

// Lazy load the large visualizer components for code splitting
const VisualizerEditor = lazy(() => import('./VisualizerEditor'));
const ThreeDVisualizer = lazy(() => import('./visualizer-software'));

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
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const [initialAudioFile, setInitialAudioFile] = useState<File | undefined>(undefined);

  const handleCreateProject = (settings: ProjectSettings, audioFile?: File) => {
    setProjectSettings(settings);
    setInitialAudioFile(audioFile);
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
      />
    </Suspense>
  );
}

/**
 * Software Mode Component - direct access to the visualizer
 */
function SoftwareMode() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ThreeDVisualizer onBackToDashboard={() => window.location.href = '/'} />
    </Suspense>
  );
}

/**
 * App Component
 * Main routing and authentication flow
 */
function App() {
  const user = useUser();

  // Show loading while checking authentication status
  if (user === undefined) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <EditorMode />
          </ProtectedRoute>
        }
      />
      <Route
        path="/software"
        element={
          <ProtectedRoute>
            <SoftwareMode />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
