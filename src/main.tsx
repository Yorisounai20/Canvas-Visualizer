import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import CanvasVisualizer from './CanvasVisualizer.tsx';
import './index.css';

// Feature flag: Unified CanvasVisualizer vs Legacy App
// Build-time default from environment variable
const envDefault = import.meta.env.VITE_USE_UNIFIED_VISUALIZER === 'true';

// Runtime override via localStorage (takes precedence)
const runtimeOverride = typeof window !== 'undefined' 
  ? localStorage.getItem('unifiedVisualizer') 
  : null;

const useUnified = runtimeOverride ? runtimeOverride === 'true' : envDefault;

// Log which mode is active
console.log('[Canvas Visualizer] Mode:', useUnified ? 'Unified CanvasVisualizer' : 'Legacy App');
console.log('[Canvas Visualizer] To toggle: localStorage.setItem("unifiedVisualizer", "true"|"false"); location.reload()');

const RootComponent = useUnified ? CanvasVisualizer : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {useUnified ? (
      <RootComponent />
    ) : (
      <BrowserRouter>
        <RootComponent />
      </BrowserRouter>
    )}
  </StrictMode>
);
