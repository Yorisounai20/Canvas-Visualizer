/**
 * PR 4: Orbit Preset Solver
 * 
 * Extracted from inline code in visualizer-software.tsx
 * Creates an orbital visualization with planets rotating around a center sun.
 * 
 * This is a PROOF OF CONCEPT for the solver pattern.
 * Visual output should be IDENTICAL to the original inline implementation.
 */

import { SolverContext } from '../solverTypes';

export function solveOrbit(ctx: SolverContext): void {
  const { time, audio, pool, blend, camera, rotationSpeed, cameraDistance, cameraHeight, cameraRotation, shake, colors } = ctx;
  const { cubes, octahedrons: octas, tetrahedrons: tetras, sphere } = pool;
  const f = audio;
  const elScaled = time;
  
  // === CAMERA ===
  const r = cameraDistance - f.bass * 5;
  camera.position.set(
    Math.cos(rotationSpeed + cameraRotation) * r + shake.x,
    10 + cameraHeight + shake.y,
    Math.sin(rotationSpeed + cameraRotation) * r + shake.z
  );
  camera.lookAt(0, 0, 0);
  
  // === SUN (CENTER SPHERE) ===
  sphere.position.set(0, 0, 0);
  const sunScale = 3 + f.bass * 2;
  sphere.scale.set(sunScale, sunScale, sunScale);
  sphere.rotation.x = 0;
  sphere.rotation.y += 0.01;
  sphere.rotation.z = 0;
  if (colors?.sphere) {
    sphere.material.color.setStyle(colors.sphere);
  }
  sphere.material.opacity = (0.9 + f.bass * 0.1) * blend;
  sphere.material.wireframe = false;
  
  // === PLANETS (8 CUBES) ===
  cubes.forEach((planet, i) => {
    const orbitRadius = 5 + i * 1.8;
    const orbitSpeed = 0.8 / (1 + i * 0.3);
    const angle = elScaled * orbitSpeed + i * 0.5;
    const tilt = Math.sin(i) * 0.3;
    
    planet.position.x = Math.cos(angle) * orbitRadius;
    planet.position.z = Math.sin(angle) * orbitRadius;
    planet.position.y = Math.sin(angle * 2) * tilt;
    
    const sizeVariation = [0.8, 0.6, 1.0, 0.7, 2.5, 2.2, 1.8, 1.6][i];
    const planetSize = sizeVariation + f.bass * 0.3;
    planet.scale.set(planetSize, planetSize, planetSize);
    
    planet.rotation.x = tilt;
    planet.rotation.y += 0.02 + i * 0.005;
    planet.rotation.z = 0;
    
    if (colors?.cube) {
      planet.material.color.setStyle(colors.cube);
    }
    planet.material.opacity = (0.8 + f.bass * 0.2) * blend;
    planet.material.wireframe = false;
  });
  
  // === MOONS (FIRST 24 OCTAHEDRONS) ===
  octas.slice(0, 24).forEach((moon, i) => {
    const planetIndex = Math.floor(i / 3) % cubes.length;
    const planet = cubes[planetIndex];
    const moonOrbitRadius = 1.2 + (i % 3) * 0.3;
    const moonOrbitSpeed = 3 + (i % 3);
    const moonAngle = elScaled * moonOrbitSpeed + i;
    
    moon.position.x = planet.position.x + Math.cos(moonAngle) * moonOrbitRadius;
    moon.position.y = planet.position.y + Math.sin(moonAngle) * moonOrbitRadius * 0.5;
    moon.position.z = planet.position.z + Math.sin(moonAngle) * moonOrbitRadius;
    
    const moonSize = 0.3 + f.mids * 0.2;
    moon.scale.set(moonSize, moonSize, moonSize);
    
    moon.rotation.x += 0.05;
    moon.rotation.y += 0.03;
    moon.rotation.z = 0;
    
    if (colors?.octahedron) {
      moon.material.color.setStyle(colors.octahedron);
    }
    moon.material.opacity = (0.6 + f.mids * 0.4) * blend;
    moon.material.wireframe = false;
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
    
    rogue.rotation.x = elScaled * 0.05 + i;
    rogue.rotation.y = elScaled * 0.03;
    rogue.rotation.z = 0;
    
    if (colors?.octahedron) {
      rogue.material.color.setStyle(colors.octahedron);
    }
    rogue.material.opacity = (0.4 + f.mids * 0.2) * blend;
    rogue.material.wireframe = true;
  });
  
  // === ASTEROID BELT (30 TETRAHEDRONS) ===
  tetras.forEach((asteroid, i) => {
    const beltRadius = 11 + (i % 5) * 0.5;
    const beltSpeed = 0.3;
    const angle = elScaled * beltSpeed + i * 0.2;
    const scatter = Math.sin(i * 10) * 2;
    
    asteroid.position.x = Math.cos(angle) * (beltRadius + scatter);
    asteroid.position.z = Math.sin(angle) * (beltRadius + scatter);
    asteroid.position.y = Math.sin(angle * 3 + i) * 0.5 + f.highs * 0.5;
    
    asteroid.rotation.x += 0.02;
    asteroid.rotation.y += 0.03;
    asteroid.rotation.z += 0.01;
    
    const asteroidSize = 0.2 + f.highs * 0.3;
    asteroid.scale.set(asteroidSize, asteroidSize, asteroidSize);
    
    if (colors?.tetrahedron) {
      asteroid.material.color.setStyle(colors.tetrahedron);
    }
    asteroid.material.opacity = (0.5 + f.highs * 0.4) * blend;
    asteroid.material.wireframe = true;
  });
  
  // Toruses and planes are not used in this preset
  // They remain hidden (handled by the main visualizer)
}

export default solveOrbit;
