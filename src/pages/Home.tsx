/**
 * Home Page
 * Main dashboard for mode selection
 * Provides access to Canvas Visualizer modes
 */

import { useNavigate } from 'react-router-dom';
import MainDashboard from '../components/Dashboard/MainDashboard';

// LocalStorage key for mode persistence
const MODE_STORAGE_KEY = 'canvas-visualizer-selected-mode';

export function Home() {
  const navigate = useNavigate();

  const handleSelectMode = (mode: 'editor' | 'software') => {
    // Persist the selected mode to localStorage
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    // Navigate to the selected mode
    navigate(`/${mode}`);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main dashboard */}
      <MainDashboard onSelectMode={handleSelectMode} />
    </div>
  );
}

export default Home;
