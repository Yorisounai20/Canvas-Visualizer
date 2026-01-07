import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'import.meta.env.VITE_STACK_PROJECT_ID': JSON.stringify('f3429b2a-50d0-4ea5-9f1b-9bd97ced0fd0'),
    'import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY': JSON.stringify('pck_3a2zb1p8y6x8rs0741nsf4a3pgysw3m7yjn897yfpgyng'),
  },
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
