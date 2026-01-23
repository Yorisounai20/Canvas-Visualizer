import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ProjectsPage from './pages/ProjectsPage';

// Lazy load the visualizer component for code splitting
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

  // On initial load, check if there's a persisted mode and redirect to software
  useEffect(() => {
    // Only redirect from root path
    if (location.pathname === '/') {
      const persistedMode = localStorage.getItem(MODE_STORAGE_KEY);
      // Always redirect to software if mode is persisted
      if (persistedMode === 'software') {
        navigate('/software', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return (
    <Routes>
      {/* Home/Dashboard route */}
      <Route path="/" element={<Home />} />

      {/* Projects Page */}
      <Route path="/projects" element={<ProjectsPage />} />

      {/* Software Mode - the only available mode */}
      <Route path="/software" element={<SoftwareMode />} />

      {/* Redirect /editor to /software (archived) */}
      <Route path="/editor" element={<Navigate to="/software" replace />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
