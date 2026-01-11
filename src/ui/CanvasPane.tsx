/**
 * CanvasPane - Main 3D viewport
 * 
 * Responsible for:
 * - Initializing Three.js scene, camera, renderer
 * - Providing modulesRoot via onReady callback
 * - Calling onFrame callback each render loop iteration
 * - Rendering the 3D scene
 * 
 * Follow-up implementers should:
 * - Set up Three.js scene with shapes (cubes, octas, tetras, sphere)
 * - Initialize particle emitters
 * - Pass modulesRoot to parent via onReady
 * - Call onFrame with current time and audio snapshot
 */

import { useRef, useEffect } from 'react';

interface CanvasPaneProps {
  workspaceView: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReady?: (modulesRoot: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFrame?: (t: number, audioSnapshot?: any) => void;
}

export default function CanvasPane({ workspaceView, onReady, onFrame }: CanvasPaneProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!canvasRef.current) return;

    // TODO: Initialize Three.js scene here
    // const scene = new THREE.Scene();
    // const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    // const renderer = new THREE.WebGLRenderer();
    
    // TODO: Create shapes (cubes, octas, tetras, sphere)
    // const modulesRoot = { cubes: [], octas: [], tetras: [], sphere: null, emitters: [] };
    
    // Mock modulesRoot for now
    const modulesRoot = {
      cubes: [],
      octas: [],
      tetras: [],
      sphere: null,
      emitters: [],
    };

    // Notify parent that canvas is ready
    if (onReady) {
      onReady(modulesRoot);
    }

    // Animation loop
    const animate = () => {
      const currentTime = (Date.now() - startTimeRef.current) / 1000;
      
      // TODO: Get audio snapshot from audio context
      const audioSnapshot = { bass: 0, mids: 0, highs: 0 };

      // Notify parent of frame update
      if (onFrame) {
        onFrame(currentTime, audioSnapshot);
      }

      // TODO: Render the scene
      // renderer.render(scene, camera);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // TODO: Dispose Three.js resources
    };
  }, [onReady, onFrame]);

  return (
    <div ref={canvasRef} className="w-full h-full bg-black relative">
      <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
        View: {workspaceView}
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🎨</div>
          <div className="text-lg">Canvas Pane (TODO: Three.js Scene)</div>
          <div className="text-sm mt-2">Follow-up: Initialize scene, shapes, and render loop</div>
        </div>
      </div>
    </div>
  );
}
