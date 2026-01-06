/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects unauthenticated users to the auth page
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@stackframe/stack';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useUser();

  // Show loading state while checking authentication
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}

export default ProtectedRoute;
