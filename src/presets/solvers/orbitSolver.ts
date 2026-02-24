/**
 * PR 4: Orbit Preset Solver
 * PR 6: Updated to use descriptor parameters
 * 
 * Extracted from inline code in visualizer-software.tsx
 * Creates an orbital visualization with planets rotating around a center sun.
 * 
 * This is a PROOF OF CONCEPT for the solver pattern.
 * Visual output should be IDENTICAL to the original inline implementation.
 */

import * as THREE from 'three';
import { SolverContext } from '../solverTypes';
import { getDescriptorBySolver } from '../../lib/descriptorStore';

export function solveOrbit(ctx: SolverContext): void {
  const { time, audio, pool, blend, camera, rotationSpeed, cameraDistance, cameraHeight, cameraRotation, shake, colors } = ctx;
  const { cubes, octahedrons: octas, tetrahedrons: tetras, sphere } = pool;
  const f = audio;
  const elScaled = time;
  
  // PR 6: Read parameters from descriptor
  const descriptor = getDescriptorBySolver('orbit');
  const params = descriptor?.parameters || {};
  const speed = params.speed || 1.0;
  const baseRadius = params.radius || 10.0;
  const planetScale = params.planetScale || 1.0;
  const moonScale = params.moonScale || 0.5;
  const asteroidSpeed = params.asteroidSpeed || 2.0;
  const sunPulse = params.sunPulse || 1.0;
  const audioReact = params.audioReactivity || 1.0;
  
  // === CAMERA ===
  const r = cameraDistance - f.bass * 5 * audioReact;
  camera.position.set(
    Math.cos(rotationSpeed + cameraRotation) * r + shake.x,
    10 + cameraHeight + shake.y,
    Math.sin(rotationSpeed + cameraRotation) * r + shake.z
  );
  camera.lookAt(0, 0, 0);
  
  // === SUN (CENTER SPHERE) ===
  sphere.position.set(0, 0, 0);
  const sunScale = (3 + f.bass * 2 * audioReact) * sunPulse;
  sphere.scale.set(sunScale, sunScale, sunScale);
  sphere.rotation.x = 0;
  sphere.rotation.y += 0.01 * speed;
  sphere.rotation.z = 0;
  if (colors?.sphere) {
    const _m = (Array.isArray(sphere.material) ? sphere.material[0] : sphere.material) as THREE.MeshStandardMaterial;
    _m.color?.setStyle?.(colors.sphere as string);
  }
  {
    const _m = (Array.isArray(sphere.material) ? sphere.material[0] : sphere.material) as THREE.MeshStandardMaterial;
    _m.opacity = (0.9 + f.bass * 0.1 * audioReact) * blend;
    _m.wireframe = false as any;
  }
  
  // === PLANETS (8 CUBES) ===
  cubes.forEach((planet, i) => {
    const orbitRadius = (5 + i * 1.8) * (baseRadius / 10.0);  // Scale from base radius
    const orbitSpeed = (0.8 / (1 + i * 0.3)) * speed;
    const angle = elScaled * orbitSpeed + i * 0.5;
    const tilt = Math.sin(i) * 0.3;
    
    planet.position.x = Math.cos(angle) * orbitRadius;
    planet.position.z = Math.sin(angle) * orbitRadius;
    planet.position.y = Math.sin(angle * 2) * tilt;
    
    const sizeVariation = [0.8, 0.6, 1.0, 0.7, 2.5, 2.2, 1.8, 1.6][i];
    const planetSize = (sizeVariation + f.bass * 0.3 * audioReact) * planetScale;
    planet.scale.set(planetSize, planetSize, planetSize);
    
    planet.rotation.x = tilt;
    planet.rotation.y += (0.02 + i * 0.005) * speed;
    planet.rotation.z = 0;
    
    if (colors?.cube) {
        const _m = (Array.isArray(planet.material) ? planet.material[0] : planet.material) as THREE.MeshStandardMaterial;
      _m.color?.setStyle?.(colors.cube as string);
      _m.opacity = (0.8 + f.bass * 0.2 * audioReact) * blend;
      _m.wireframe = false as any;
    } else {
      const _m = (Array.isArray(planet.material) ? planet.material[0] : planet.material) as THREE.MeshStandardMaterial;
      _m.opacity = (0.8 + f.bass * 0.2 * audioReact) * blend;
      _m.wireframe = false as any;
    }
  });
  
  // === MOONS (FIRST 24 OCTAHEDRONS) ===
  octas.slice(0, 24).forEach((moon, i) => {
    const planetIndex = Math.floor(i / 3) % cubes.length;
    const planet = cubes[planetIndex];
    const moonOrbitRadius = 1.2 + (i % 3) * 0.3;
    const moonOrbitSpeed = (3 + (i % 3)) * speed;
    const moonAngle = elScaled * moonOrbitSpeed + i;
    
    moon.position.x = planet.position.x + Math.cos(moonAngle) * moonOrbitRadius;
    moon.position.y = planet.position.y + Math.sin(moonAngle) * moonOrbitRadius * 0.5;
    moon.position.z = planet.position.z + Math.sin(moonAngle) * moonOrbitRadius;
    
    const moonSize = (0.3 + f.mids * 0.2 * audioReact) * moonScale;
    moon.scale.set(moonSize, moonSize, moonSize);
    
    moon.rotation.x += 0.05 * speed;
    moon.rotation.y += 0.03 * speed;
    moon.rotation.z = 0;
    
    if (colors?.octahedron) {
      const _m = (Array.isArray(moon.material) ? moon.material[0] : moon.material) as THREE.MeshStandardMaterial;
      _m.color?.setStyle?.(colors.octahedron as string);
      _m.opacity = (0.6 + f.mids * 0.4 * audioReact) * blend;
      _m.wireframe = false as any;
    } else {
      const _m = (Array.isArray(moon.material) ? moon.material[0] : moon.material) as THREE.MeshStandardMaterial;
      _m.opacity = (0.6 + f.mids * 0.4 * audioReact) * blend;
      _m.wireframe = false as any;
    }
  });
  
  // === ROGUE OBJECTS (REMAINING 6 OCTAHEDRONS) ===
  octas.slice(24).forEach((rogue, i) => {
    const layer = Math.floor(i / 6);
    const posInLayer = i % 6;
    const rogueDist = 25 + layer * 8;
    const rogueAngle = (posInLayer / 6) * Math.PI * 2 + layer * 0.5;
    
    rogue.position.x = Math.cos(rogueAngle) * rogueDist;
    rogue.position.y = (posInLayer % 3 - 1) * 6;
    rogue.position.z = Math.sin(rogueAngle) * rogueDist;
    
    const rogueSize = 4 + layer * 2 + (i % 3);
    rogue.scale.set(rogueSize, rogueSize, rogueSize);
    
    rogue.rotation.x = elScaled * 0.05 * speed + i;
    rogue.rotation.y = elScaled * 0.03 * speed;
    rogue.rotation.z = 0;
    
    if (colors?.octahedron) {
      const _m = (Array.isArray(rogue.material) ? rogue.material[0] : rogue.material) as THREE.MeshStandardMaterial;
      _m.color?.setStyle?.(colors.octahedron as string);
      _m.opacity = (0.4 + f.mids * 0.2 * audioReact) * blend;
      _m.wireframe = true as any;
    } else {
      const _m = (Array.isArray(rogue.material) ? rogue.material[0] : rogue.material) as THREE.MeshStandardMaterial;
      _m.opacity = (0.4 + f.mids * 0.2 * audioReact) * blend;
      _m.wireframe = true as any;
    }
  });
  
  // === ASTEROID BELT (30 TETRAHEDRONS) ===
  tetras.forEach((asteroid, i) => {
    const beltRadius = 11 + (i % 5) * 0.5;
    const beltSpeed = 0.3 * asteroidSpeed;
    const angle = elScaled * beltSpeed + i * 0.2;
    const scatter = Math.sin(i * 10) * 2;
    
    asteroid.position.x = Math.cos(angle) * (beltRadius + scatter);
    asteroid.position.z = Math.sin(angle) * (beltRadius + scatter);
    asteroid.position.y = Math.sin(angle * 3 + i) * 0.5 + f.highs * 0.5 * audioReact;
    
    asteroid.rotation.x += 0.02 * asteroidSpeed;
    asteroid.rotation.y += 0.03 * asteroidSpeed;
    asteroid.rotation.z += 0.01 * asteroidSpeed;
    
    const asteroidSize = 0.2 + f.highs * 0.3 * audioReact;
    asteroid.scale.set(asteroidSize, asteroidSize, asteroidSize);
    
    if (colors?.tetrahedron) {
      const _m = (Array.isArray(asteroid.material) ? asteroid.material[0] : asteroid.material) as THREE.MeshStandardMaterial;
      _m.color?.setStyle?.(colors.tetrahedron as string);
      _m.opacity = (0.5 + f.highs * 0.4 * audioReact) * blend;
      _m.wireframe = true as any;
    } else {
      const _m = (Array.isArray(asteroid.material) ? asteroid.material[0] : asteroid.material) as THREE.MeshStandardMaterial;
      _m.opacity = (0.5 + f.highs * 0.4 * audioReact) * blend;
      _m.wireframe = true as any;
    }
  });
  
  // Toruses and planes are not used in this preset
  // They remain hidden (handled by the main visualizer)
}

export default solveOrbit;
