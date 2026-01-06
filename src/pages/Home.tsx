/**
 * Home Page
 * Main dashboard for authenticated users
 * Provides access to Canvas Visualizer modes and user information
 */

import { useUser } from '@stackframe/stack';
import { useNavigate } from 'react-router-dom';
import MainDashboard from '../components/Dashboard/MainDashboard';

export function Home() {
  const user = useUser();
  const navigate = useNavigate();

  const handleSelectMode = (mode: 'editor' | 'software') => {
    // Navigate to the selected mode
    navigate(`/${mode}`);
  };

  const handleGoToAccount = () => {
    navigate('/account');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* User info bar at the top */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
            {user?.displayName?.[0]?.toUpperCase() || user?.primaryEmail?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-white font-medium">{user?.displayName || 'User'}</p>
            <p className="text-gray-400 text-sm">{user?.primaryEmail}</p>
          </div>
        </div>
        <button
          onClick={handleGoToAccount}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Account Settings
        </button>
      </div>

      {/* Main dashboard */}
      <MainDashboard onSelectMode={handleSelectMode} />
    </div>
  );
}

export default Home;
