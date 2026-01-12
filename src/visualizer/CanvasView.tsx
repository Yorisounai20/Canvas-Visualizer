/**
 * CanvasView Component
 * 
 * A minimal Three.js canvas component that encapsulates scene/camera/renderer.
 * Provides lifecycle hooks for initialization and frame updates.
 * 
 * This is a scaffold component that will gradually take over Three.js logic
 * from visualizer-software.tsx during the incremental refactoring.
 */

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export interface ModulesRoot {
  obj: {
    cubes: THREE.Mesh[];
    octas: THREE.Mesh[];
    tetras: THREE.Mesh[];
    toruses: THREE.Mesh[];
    planes: THREE.Mesh[];
  };
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  emitters?: Record<string, any>;
  materials?: Record<string, THREE.Material>;
}

export interface CanvasViewProps {
  onReady?: (modules: ModulesRoot) => void;
  onFrame?: (timeSeconds: number, audioSnapshot?: Uint8Array | null) => void;
  width?: number;
  height?: number;
}

export function CanvasView({ onReady, onFrame, width = 960, height = 540 }: CanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene (matches production settings)
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a14, 10, 50);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 15;
    cameraRef.current = camera;

    // Initialize renderer (matches production settings)
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false, 
      preserveDrawingBuffer: true 
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x0a0a14);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create placeholder geometry pools (empty for now)
    const modules: ModulesRoot = {
      obj: {
        cubes: [],
        octas: [],
        tetras: [],
        toruses: [],
        planes: []
      },
      scene,
      camera,
      renderer
    };

    // Call onReady hook
    if (onReady) {
      onReady(modules);
      console.log('[CanvasView] onReady fired with modules');
    }

    // Animation loop
    const animate = (time: number) => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      const timeSeconds = time / 1000;
      
      // Call onFrame hook
      if (onFrame) {
        onFrame(timeSeconds, null);
      }

      // Render scene
      renderer.render(scene, camera);
    };

    animate(0);

    // Cleanup
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [onReady, onFrame, width, height]);

  return <div ref={containerRef} style={{ width, height }} />;
}

export default CanvasView;
