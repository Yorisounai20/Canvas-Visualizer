/**
 * CanvasVisualizer - Unified workspace root component
 * 
 * This is the new unified interface that replaces VisualizerEditor and visualizer-software.
 * It provides a comprehensive workspace with:
 * - Mode switching (Author, Stage, Effects, Preview, Export)
 * - PresetManager integration for data-driven animations
 * - Clean separation of concerns (UI components, render logic, preset system)
 * 
 * Architecture:
 * - TopBar: Mode switching and primary actions
 * - LeftToolbox: Preset library and tools
 * - CanvasPane: Main 3D viewport with Three.js scene
 * - TimelinePane: Timeline and automation editor
 * - InspectorPane: Property inspector and parameter controls
 */

import { useEffect, useRef, useState } from 'react';
import TopBar from './ui/TopBar';
import LeftToolbox from './ui/LeftToolbox';
import CanvasPane from './ui/CanvasPane';
import TimelinePane from './ui/TimelinePane';
import InspectorPane from './ui/InspectorPane';
import PresetManager from './presets/PresetManager';
import hammerheadPreset from './presets/hammerhead.json';

export default function CanvasVisualizer() {
  const [workspaceView, setWorkspaceView] = useState<'author' | 'stage' | 'effects' | 'preview' | 'export'>('author');
  const presetManagerRef = useRef<PresetManager | null>(null);
  const modulesRootRef = useRef<any>(null);

  useEffect(() => {
    // Initialize PresetManager
    presetManagerRef.current = new PresetManager({ modulesRoot: modulesRootRef.current, seed: 1337 });
    
    return () => {
      // Cleanup on unmount
      if (presetManagerRef.current) {
        presetManagerRef.current.dispose();
        presetManagerRef.current = null;
      }
    };
  }, []);

  /**
   * Called when CanvasPane is ready with the Three.js scene
   */
  const handleCanvasReady = (modulesRoot: any) => {
    modulesRootRef.current = modulesRoot;
    if (presetManagerRef.current) {
      presetManagerRef.current.modulesRoot = modulesRoot;
      
      // Register camera setters
      registerCameraSetters(presetManagerRef.current, modulesRoot);
      
      // Load the hammerhead preset to demonstrate camera automation
      presetManagerRef.current.loadPreset(hammerheadPreset as any);
      console.log('[CanvasVisualizer] Hammerhead preset loaded with camera automation');
    }
    console.log('[CanvasVisualizer] Canvas ready, modulesRoot connected to PresetManager');
  };

  /**
   * Register camera control setters that will be called by PresetManager
   */
  const registerCameraSetters = (pm: PresetManager, modulesRoot: any) => {
    const camera = modulesRoot.camera;
    if (!camera) return;

    // Camera distance setter
    pm.registerSetter('camera.distance', (value: number) => {
      const currentAngle = Math.atan2(camera.position.x, camera.position.z);
      const currentHeight = camera.position.y;
      camera.position.x = Math.sin(currentAngle) * value;
      camera.position.z = Math.cos(currentAngle) * value;
      camera.position.y = currentHeight;
      camera.lookAt(0, 0, 0);
    });

    // Camera height setter
    pm.registerSetter('camera.height', (value: number) => {
      camera.position.y = value;
      camera.lookAt(0, 0, 0);
    });

    // Camera rotation setter (in degrees, rotates around Y axis)
    pm.registerSetter('camera.rotation', (value: number) => {
      const angleRadians = (value * Math.PI) / 180;
      const distance = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
      camera.position.x = Math.sin(angleRadians) * distance;
      camera.position.z = Math.cos(angleRadians) * distance;
      camera.lookAt(0, 0, 0);
    });

    // Camera FOV setter
    pm.registerSetter('camera.fov', (value: number) => {
      camera.fov = value;
      camera.updateProjectionMatrix();
    });
  };

  /**
   * Called every frame from the render loop
   */
  const handleFrame = (t: number, audioSnapshot?: any) => {
    const pm = presetManagerRef.current;
    if (!pm) return;

    // Evaluate preset at current time
    const resolved = pm.evaluate(t, audioSnapshot);
    if (resolved) {
      // Apply resolved values to scene
      const dt = t - (pm as any).lastT || 0.016;
      pm.applyResolved(resolved, { t, dt, audio: audioSnapshot });
      (pm as any).lastT = t;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden">
      <TopBar mode={workspaceView} onModeChange={(m) => setWorkspaceView(m)} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Toolbox */}
        <aside className="w-64 border-r border-gray-700 bg-gray-900">
          <LeftToolbox />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden">
          <CanvasPane 
            workspaceView={workspaceView} 
            onReady={handleCanvasReady} 
            onFrame={handleFrame} 
          />
          
          {/* Timeline at bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <TimelinePane />
          </div>
        </main>

        {/* Right Sidebar - Inspector */}
        <aside className="w-96 border-l border-gray-700 bg-gray-800">
          <InspectorPane />
        </aside>
      </div>
    </div>
  );
}
