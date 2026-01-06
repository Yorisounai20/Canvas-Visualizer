/**
 * Stack Auth client configuration
 * Provides authentication functionality for the Canvas Visualizer application
 */

import { StackClientApp } from '@stackframe/stack';

// Get environment variables
const projectId = import.meta.env.VITE_STACK_PROJECT_ID as string | undefined;
const publishableClientKey = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY as string | undefined;

// Validate required environment variables
if (!projectId) {
  console.error('VITE_STACK_PROJECT_ID is not set. Authentication will not work properly.');
  console.error('Please configure your Stack Auth credentials in the .env file.');
}

/**
 * Stack Auth client instance
 * Use this instance to access authentication features throughout the app
 */
export const stackApp = new StackClientApp({
  projectId: projectId || '',
  publishableClientKey: publishableClientKey || undefined,
});

export default stackApp;
