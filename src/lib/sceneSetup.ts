/**
 * Scene Setup Helpers
 * 
 * Helper functions for initializing Three.js scene with shapes and objects.
 * Creates the modulesRoot structure expected by PresetManager.
 */

import * as THREE from 'three';

export interface ModulesRoot {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  cubes: THREE.Mesh[];
  octas: THREE.Mesh[];
  tetras: THREE.Mesh[];
  sphere: THREE.Mesh | null;
  emitters: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  materials: {
    cubeMaterial: THREE.MeshBasicMaterial;
    octaMaterial: THREE.MeshBasicMaterial;
    tetraMaterial: THREE.MeshBasicMaterial;
    sphereMaterial: THREE.MeshBasicMaterial;
  };
}

/**
 * Create and configure the Three.js scene
 */
export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 10, 50);
  return scene;
}

/**
 * Create and configure the camera
 */
export function createCamera(width: number, height: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 2, 15);
  camera.lookAt(0, 0, 0);
  return camera;
}

/**
 * Create and configure the WebGL renderer
 */
export function createRenderer(container: HTMLElement, width: number, height: number): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  return renderer;
}

/**
 * Create materials for different shape types
 */
export function createMaterials() {
  return {
    cubeMaterial: new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      wireframe: true,
    }),
    octaMaterial: new THREE.MeshBasicMaterial({
      color: 0xff00aa,
      wireframe: true,
    }),
    tetraMaterial: new THREE.MeshBasicMaterial({
      color: 0xaaff00,
      wireframe: true,
    }),
    sphereMaterial: new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
    }),
  };
}

/**
 * Create cube meshes arranged in a pattern
 */
export function createCubes(scene: THREE.Scene, material: THREE.MeshBasicMaterial, count: number = 8): THREE.Mesh[] {
  const cubes: THREE.Mesh[] = [];
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  
  for (let i = 0; i < count; i++) {
    const cube = new THREE.Mesh(geometry, material);
    const angle = (i / count) * Math.PI * 2;
    const radius = 8;
    cube.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    scene.add(cube);
    cubes.push(cube);
  }
  
  return cubes;
}

/**
 * Create octahedron meshes (for hammerhead tail segments)
 */
export function createOctahedrons(scene: THREE.Scene, material: THREE.MeshBasicMaterial, count: number = 30): THREE.Mesh[] {
  const octas: THREE.Mesh[] = [];
  const geometry = new THREE.OctahedronGeometry(0.5);
  
  // Arrange in a line (tail configuration)
  for (let i = 0; i < count; i++) {
    const octa = new THREE.Mesh(geometry, material);
    octa.position.set(0, 0, -i * 0.8);
    scene.add(octa);
    octas.push(octa);
  }
  
  return octas;
}

/**
 * Create tetrahedron meshes arranged in a pattern
 */
export function createTetrahedrons(scene: THREE.Scene, material: THREE.MeshBasicMaterial, count: number = 30): THREE.Mesh[] {
  const tetras: THREE.Mesh[] = [];
  const geometry = new THREE.TetrahedronGeometry(0.5);
  
  for (let i = 0; i < count; i++) {
    const tetra = new THREE.Mesh(geometry, material);
    const angle = (i / count) * Math.PI * 2;
    const radius = 5 + (i % 3);
    tetra.position.set(
      Math.cos(angle) * radius,
      Math.sin(i * 0.5) * 2,
      Math.sin(angle) * radius
    );
    scene.add(tetra);
    tetras.push(tetra);
  }
  
  return tetras;
}

/**
 * Create the central sphere (hammerhead head)
 */
export function createSphere(scene: THREE.Scene, material: THREE.MeshBasicMaterial): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 16, 16);
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(0, 0, 0);
  scene.add(sphere);
  return sphere;
}

/**
 * Initialize the complete scene with all objects
 */
export function initializeScene(container: HTMLElement): ModulesRoot {
  const width = container.clientWidth || 960;
  const height = container.clientHeight || 540;
  
  // Create core Three.js objects
  const scene = createScene();
  const camera = createCamera(width, height);
  const renderer = createRenderer(container, width, height);
  
  // Create materials
  const materials = createMaterials();
  
  // Create all shape arrays
  const cubes = createCubes(scene, materials.cubeMaterial);
  const octas = createOctahedrons(scene, materials.octaMaterial);
  const tetras = createTetrahedrons(scene, materials.tetraMaterial);
  const sphere = createSphere(scene, materials.sphereMaterial);
  
  // Particle emitters will be added in a future phase
  const emitters: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  
  return {
    scene,
    camera,
    renderer,
    cubes,
    octas,
    tetras,
    sphere,
    emitters,
    materials,
  };
}

/**
 * Clean up Three.js resources
 */
export function disposeScene(modulesRoot: ModulesRoot): void {
  // Dispose geometries and materials
  modulesRoot.cubes.forEach(cube => {
    cube.geometry.dispose();
  });
  
  modulesRoot.octas.forEach(octa => {
    octa.geometry.dispose();
  });
  
  modulesRoot.tetras.forEach(tetra => {
    tetra.geometry.dispose();
  });
  
  if (modulesRoot.sphere) {
    modulesRoot.sphere.geometry.dispose();
  }
  
  // Dispose materials
  Object.values(modulesRoot.materials).forEach(material => {
    material.dispose();
  });
  
  // Dispose renderer
  modulesRoot.renderer.dispose();
  
  // Remove renderer DOM element
  if (modulesRoot.renderer.domElement.parentElement) {
    modulesRoot.renderer.domElement.parentElement.removeChild(modulesRoot.renderer.domElement);
  }
}
