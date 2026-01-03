import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Three.js into its own chunk (it's very large)
          'three': ['three'],
          // Split React and related libraries
          'react-vendor': ['react', 'react-dom'],
          // Split Lucide icons
          'icons': ['lucide-react'],
        },
      },
    },
    // Increase chunk size warning limit to 1000 KB (from default 500 KB)
    // This is reasonable for a 3D visualization app with Three.js
    chunkSizeWarningLimit: 1000,
  },
});
