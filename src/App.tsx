import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import ProjectsPage from './pages/ProjectsPage';
import { initializeDatabase, isDatabaseAvailable } from './lib/database';

// Lazy load the visualizer component for code splitting
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
 * Software Mode Component - direct access to the visualizer
 */
function SoftwareMode() {
  const navigate = useNavigate();
  
  const handleBackToDashboard = () => {
    navigate('/');
  };
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ThreeDVisualizer onBackToDashboard={handleBackToDashboard} />
    </Suspense>
  );
}

/**
 * App Component with mode persistence and database initialization
 */
function App() {

  // Initialize database on app start
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        if (!isDatabaseAvailable()) {
          console.warn('⚠️ Database not configured. Set VITE_DATABASE_URL in .env file to enable project persistence.');
          return;
        }

        console.log('Initializing database schema...');
        await initializeDatabase();
        console.log('✅ Database initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Stack trace:', error.stack);
        }
        // Don't block the app if database initialization fails
        // User will see error messages in the UI when trying to use database features
      }
    };

    setupDatabase();
  }, []);

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
