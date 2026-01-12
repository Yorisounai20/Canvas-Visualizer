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

export interface MaterialConfig {
  type: 'basic' | 'standard' | 'phong' | 'lambert';
  color: string;
  wireframe: boolean;
  opacity: number;
  metalness: number;
  roughness: number;
}

export interface ShapeRequirements {
  cubes: number;
  octas: number;
  tetras: number;
  toruses: number;
  planes: number;
}

export interface CanvasViewProps {
  onReady?: (modules: ModulesRoot) => void;
  onFrame?: (timeSeconds: number, audioSnapshot?: Uint8Array | null) => void;
  width?: number;
  height?: number;
  // Material configurations for all shape types
  cubeMaterial?: MaterialConfig;
  octahedronMaterial?: MaterialConfig;
  tetrahedronMaterial?: MaterialConfig;
  sphereMaterial?: MaterialConfig;
  // Shape requirements for dynamic allocation
  shapeRequirements?: ShapeRequirements;
}

export function CanvasView({ 
  onReady, 
  onFrame, 
  width = 960, 
  height = 540,
  cubeMaterial,
  octahedronMaterial,
  tetrahedronMaterial,
  sphereMaterial,
  shapeRequirements
}: CanvasViewProps) {
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

    // Helper function to create materials
    const createMaterial = (
      type: 'basic' | 'standard' | 'phong' | 'lambert',
      color: string,
      wireframe: boolean,
      opacity: number,
      metalness: number = 0.5,
      roughness: number = 0.5
    ): THREE.Material => {
      const baseColor = new THREE.Color(color);
      const commonProps = {
        color: baseColor,
        wireframe,
        transparent: true,
        opacity
      };

      switch (type) {
        case 'standard':
          return new THREE.MeshStandardMaterial({
            ...commonProps,
            metalness,
            roughness
          });
        case 'phong':
          return new THREE.MeshPhongMaterial({
            ...commonProps,
            shininess: 30
          });
        case 'lambert':
          return new THREE.MeshLambertMaterial(commonProps);
        case 'basic':
        default:
          return new THREE.MeshBasicMaterial(commonProps);
      }
    };

    // Create shape pools if material configs are provided
    const cubes: THREE.Mesh[] = [];
    const octas: THREE.Mesh[] = [];
    const tetras: THREE.Mesh[] = [];
    const toruses: THREE.Mesh[] = [];
    const planes: THREE.Mesh[] = [];

    if (cubeMaterial && shapeRequirements) {
      // Create cubes
      for (let i = 0; i < shapeRequirements.cubes; i++) {
        const material = createMaterial(
          cubeMaterial.type,
          cubeMaterial.color,
          cubeMaterial.wireframe,
          cubeMaterial.opacity,
          cubeMaterial.metalness,
          cubeMaterial.roughness
        );
        const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
        const angle = (i / shapeRequirements.cubes) * Math.PI * 2;
        cube.position.x = Math.cos(angle) * 8;
        cube.position.z = Math.sin(angle) * 8;
        scene.add(cube);
        cubes.push(cube);
      }
    }

    if (octahedronMaterial && shapeRequirements) {
      // Create octahedrons (includes 15 for environment system)
      for (let i = 0; i < shapeRequirements.octas; i++) {
        const material = createMaterial(
          octahedronMaterial.type,
          octahedronMaterial.color,
          octahedronMaterial.wireframe,
          octahedronMaterial.opacity,
          octahedronMaterial.metalness,
          octahedronMaterial.roughness
        );
        const octa = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), material);
        
        // Environment octas start at index (shapeRequirements.octas - 15)
        const isEnvOcta = i >= (shapeRequirements.octas - 15);
        if (isEnvOcta) {
          octa.position.set(0, -1000, 0); // Start off-screen for environment
          octa.scale.set(0.001, 0.001, 0.001);
        } else {
          const angle = (i / Math.max(shapeRequirements.octas - 15, 1)) * Math.PI * 2;
          const radius = 5 + (i % 3) * 2;
          octa.position.x = Math.cos(angle) * radius;
          octa.position.y = Math.sin(angle) * radius;
          octa.position.z = -(i % 5) * 2;
        }
        scene.add(octa);
        octas.push(octa);
      }
    }

    if (tetrahedronMaterial && shapeRequirements) {
      // Create tetrahedrons
      for (let i = 0; i < shapeRequirements.tetras; i++) {
        const material = createMaterial(
          tetrahedronMaterial.type,
          tetrahedronMaterial.color,
          tetrahedronMaterial.wireframe,
          tetrahedronMaterial.opacity,
          tetrahedronMaterial.metalness,
          tetrahedronMaterial.roughness
        );
        const tetra = new THREE.Mesh(new THREE.TetrahedronGeometry(0.3), material);
        tetra.position.set(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        );
        scene.add(tetra);
        tetras.push(tetra);
      }
    }

    if (cubeMaterial && shapeRequirements) {
      // Create toruses (reuse cube material as per original code)
      for (let i = 0; i < shapeRequirements.toruses; i++) {
        const material = createMaterial(
          cubeMaterial.type,
          cubeMaterial.color,
          cubeMaterial.wireframe,
          cubeMaterial.opacity,
          cubeMaterial.metalness,
          cubeMaterial.roughness
        );
        const torus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 100), material);
        const angle = (i / Math.max(shapeRequirements.toruses, 1)) * Math.PI * 2;
        torus.position.x = Math.cos(angle) * 10;
        torus.position.z = Math.sin(angle) * 10;
        scene.add(torus);
        toruses.push(torus);
      }
    }

    if (octahedronMaterial && shapeRequirements) {
      // Create planes (reuse octahedron material as per original code)
      for (let i = 0; i < shapeRequirements.planes; i++) {
        const material = createMaterial(
          octahedronMaterial.type,
          octahedronMaterial.color,
          octahedronMaterial.wireframe,
          octahedronMaterial.opacity,
          octahedronMaterial.metalness,
          octahedronMaterial.roughness
        );
        material.side = THREE.DoubleSide;
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), material);
        plane.position.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        );
        scene.add(plane);
        planes.push(plane);
      }
    }

    // Create geometry pools
    const modules: ModulesRoot = {
      obj: {
        cubes,
        octas,
        tetras,
        toruses,
        planes
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
  }, [onReady, onFrame, width, height, cubeMaterial, octahedronMaterial, tetrahedronMaterial, sphereMaterial, shapeRequirements]);

  return <div ref={containerRef} style={{ width, height }} />;
}

export default CanvasView;
