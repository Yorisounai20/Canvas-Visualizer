/**
 * Stack Auth client configuration
 * Provides authentication functionality for the Canvas Visualizer application
 */

import { StackClientApp } from '@stackframe/stack';

// Get environment variables
const projectId = import.meta.env.VITE_STACK_PROJECT_ID;
const publishableClientKey = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;

if (!projectId) {
  console.warn('VITE_STACK_PROJECT_ID is not set. Authentication features will be disabled.');
}

/**
 * Stack Auth client instance
 * Use this instance to access authentication features throughout the app
 */
export const stackApp = new StackClientApp({
  projectId: projectId || 'demo-project',
  publishableClientKey: publishableClientKey,
});

export default stackApp;
