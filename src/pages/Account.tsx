/**
 * Account Page
 * User account management and settings
 */

import { useNavigate } from 'react-router-dom';
import { useUser, useStackApp } from '@stackframe/stack';
import { AccountSettings } from '@stackframe/stack';
import { ArrowLeft } from 'lucide-react';

export function Account() {
  const user = useUser();
  const stackApp = useStackApp();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await stackApp.signOut();
    navigate('/auth');
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Account Settings Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          {/* User Info Summary */}
          <div className="mb-8 pb-8 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
                {user?.displayName?.[0]?.toUpperCase() || user?.primaryEmail?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white font-medium text-lg">{user?.displayName || 'User'}</p>
                <p className="text-gray-400">{user?.primaryEmail}</p>
                <p className="text-gray-500 text-sm mt-1">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Stack Auth Account Settings Component */}
          <div className="text-white">
            <AccountSettings />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
