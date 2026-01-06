/**
 * Auth Page
 * Handles sign-in and sign-up functionality using Stack Auth
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, SignUp } from '@stackframe/stack';

export function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to home page after successful authentication
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Canvas Visualizer</h1>
          <p className="text-gray-300">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          {mode === 'signin' ? (
            <SignIn onSignIn={handleSuccess} />
          ) : (
            <SignUp onSignUp={handleSuccess} />
          )}

          {/* Toggle between sign in and sign up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              {mode === 'signin' ? (
                <>
                  Don't have an account? <span className="font-semibold">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="font-semibold">Sign in</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Secure authentication powered by Stack Auth</p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
