/**
 * CanvasPane - Main 3D viewport
 * 
 * Responsible for:
 * - Initializing Three.js scene, camera, renderer
 * - Providing modulesRoot via onReady callback
 * - Calling onFrame callback each render loop iteration
 * - Rendering the 3D scene
 */

import { useRef, useEffect, useState } from 'react';
import { initializeScene, disposeScene, type ModulesRoot } from '../lib/sceneSetup';

interface CanvasPaneProps {
  workspaceView: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReady?: (modulesRoot: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFrame?: (t: number, audioSnapshot?: any) => void;
}

export default function CanvasPane({ workspaceView, onReady, onFrame }: CanvasPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modulesRootRef = useRef<ModulesRoot | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);
  const [fps, setFps] = useState(0);
  const fpsFrameCountRef = useRef(0);
  const fpsLastTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene with all shapes
    const modulesRoot = initializeScene(containerRef.current);
    modulesRootRef.current = modulesRoot;
    setIsInitialized(true);

    // Notify parent that canvas is ready
    if (onReady) {
      onReady(modulesRoot);
    }

    // Animation loop
    const animate = () => {
      const currentTime = (Date.now() - startTimeRef.current) / 1000;
      
      // Calculate FPS
      fpsFrameCountRef.current++;
      const now = Date.now();
      const elapsed = now - fpsLastTimeRef.current;
      if (elapsed >= 1000) {
        setFps(Math.round((fpsFrameCountRef.current * 1000) / elapsed));
        fpsFrameCountRef.current = 0;
        fpsLastTimeRef.current = now;
      }

      // Simple rotation animation for shapes
      if (modulesRoot.cubes) {
        modulesRoot.cubes.forEach((cube, i) => {
          cube.rotation.x = currentTime + i * 0.1;
          cube.rotation.y = currentTime * 0.5 + i * 0.1;
        });
      }

      if (modulesRoot.octas) {
        modulesRoot.octas.forEach((octa, i) => {
          octa.rotation.z = currentTime + i * 0.05;
        });
      }

      if (modulesRoot.tetras) {
        modulesRoot.tetras.forEach((tetra, i) => {
          tetra.rotation.x = currentTime * 0.8 + i * 0.1;
          tetra.rotation.y = currentTime * 0.6;
        });
      }

      if (modulesRoot.sphere) {
        modulesRoot.sphere.rotation.y = currentTime;
      }
      
      // TODO: Get audio snapshot from audio context
      const audioSnapshot = { bass: 0, mids: 0, highs: 0 };

      // Notify parent of frame update
      if (onFrame) {
        onFrame(currentTime, audioSnapshot);
      }

      // Render the scene
      modulesRoot.renderer.render(modulesRoot.scene, modulesRoot.camera);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !modulesRootRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      modulesRootRef.current.camera.aspect = width / height;
      modulesRootRef.current.camera.updateProjectionMatrix();
      modulesRootRef.current.renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (modulesRootRef.current) {
        disposeScene(modulesRootRef.current);
        modulesRootRef.current = null;
      }
    };
  }, [onReady, onFrame]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative">
      {/* FPS Counter */}
      <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
        View: {workspaceView} | FPS: {fps}
      </div>
      
      {/* Info overlay - only show before initialization */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-lg">Initializing Three.js Scene...</div>
          </div>
        </div>
      )}
      
      {/* Shape count info */}
      {isInitialized && modulesRootRef.current && (
        <div className="absolute bottom-4 left-4 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
          Shapes: {modulesRootRef.current.cubes.length} cubes, {modulesRootRef.current.octas.length} octahedrons, {modulesRootRef.current.tetras.length} tetrahedrons, 1 sphere
        </div>
      )}
    </div>
  );
}
