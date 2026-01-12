/**
 * Shape Factory
 * 
 * Utility functions for creating Three.js shapes and materials.
 * Extracted from visualizer-software.tsx to enable reuse and testing.
 */

import * as THREE from 'three';
import { MaterialConfig, ShapeRequirements } from './CanvasView';

/**
 * Create a Three.js material based on configuration
 */
export function createMaterial(
  type: 'basic' | 'standard' | 'phong' | 'lambert',
  color: string,
  wireframe: boolean,
  opacity: number,
  metalness: number = 0.5,
  roughness: number = 0.5
): THREE.Material {
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
}

export interface ShapePools {
  cubes: THREE.Mesh[];
  octas: THREE.Mesh[];
  tetras: THREE.Mesh[];
  toruses: THREE.Mesh[];
  planes: THREE.Mesh[];
}

/**
 * Create shape pools and add them to the provided scene
 */
export function createShapePools(
  scene: THREE.Scene,
  cubeMaterial: MaterialConfig,
  octahedronMaterial: MaterialConfig,
  tetrahedronMaterial: MaterialConfig,
  shapeRequirements: ShapeRequirements
): ShapePools {
  const cubes: THREE.Mesh[] = [];
  const octas: THREE.Mesh[] = [];
  const tetras: THREE.Mesh[] = [];
  const toruses: THREE.Mesh[] = [];
  const planes: THREE.Mesh[] = [];

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

  return { cubes, octas, tetras, toruses, planes };
}
