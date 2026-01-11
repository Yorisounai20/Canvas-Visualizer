/**
 * Hammerhead Preset Implementation
 * 
 * This file provides the wiring between the hammerhead preset JSON and the actual
 * Three.js scene objects. Follow-up implementers should:
 * 
 * 1. Verify that modulesRoot contains the expected arrays (cubes, octas, tetras, sphere, emitters)
 * 2. Confirm the correct array indices for logical parts (head, tail segments)
 * 3. Implement or verify particle emitter APIs for the particleBurst action
 * 4. Add defensive checks to prevent crashes if scene structure changes
 * 
 * The hammerhead preset expects:
 * - Head: The sphere object (1 object)
 * - Tail segments: ~30 octahedrons arranged in a line (octas array indices 0-29)
 * - Particle emitters: An array of ParticleEmitter instances
 */

import PresetManager from '../PresetManager';

interface ModulesRoot {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cubes?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  octas?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tetras?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sphere?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emitters?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  materials?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scene?: any;
}

/**
 * Register setters and actions for the hammerhead preset.
 * Call this function after the scene is initialized and before loading the preset.
 * 
 * @param presetManager - The PresetManager instance
 * @param modulesRoot - Reference to scene objects (shapes, emitters, materials)
 */
export function registerHammerhead(presetManager: PresetManager, modulesRoot: ModulesRoot): void {
  if (!modulesRoot) {
    console.warn('[hammerhead-setup] modulesRoot is null, skipping registration');
    return;
  }

  // Defensive checks
  const hasOctas = Array.isArray(modulesRoot.octas) && modulesRoot.octas.length >= 30;
  const hasSphere = modulesRoot.sphere != null;
  const hasEmitters = Array.isArray(modulesRoot.emitters) && modulesRoot.emitters.length > 0;

  if (!hasOctas) {
    console.warn('[hammerhead-setup] Missing or insufficient octas array (need at least 30)');
  }
  if (!hasSphere) {
    console.warn('[hammerhead-setup] Missing sphere object for head');
  }
  if (!hasEmitters) {
    console.warn('[hammerhead-setup] Missing emitters array for particle effects');
  }

  // ========== SHAPE SETTERS ==========

  /**
   * Tail wave amplitude: Controls the side-to-side wave motion of tail segments
   * TODO: Verify octahedron indices (0-29 assumed for tail)
   */
  presetManager.registerSetter('shapes.tailWave.amplitude', (value, ctx) => {
    if (!hasOctas) return;

    const tailSegments = modulesRoot.octas!.slice(0, 30);
    const frequency = 2.0; // Wave frequency (can be overridden by another automation)
    const phase = ctx.t * 2 * Math.PI;

    tailSegments.forEach((segment: any, i: number) => {
      if (segment && segment.position) {
        // Create a sinuous wave along the tail
        const segmentPhase = (i / tailSegments.length) * 2 * Math.PI * frequency;
        segment.position.x = Math.sin(phase + segmentPhase) * value;
      }
    });
  });

  /**
   * Tail wave frequency: Controls how many waves appear along the tail
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  presetManager.registerSetter('shapes.tailWave.frequency', (_value, _ctx) => {
    // This is used in conjunction with amplitude setter
    // Store the frequency value for use by the amplitude setter
    // TODO: Consider storing this in a shared context object
  });

  /**
   * Forward speed: Controls Z-axis movement of all tail segments
   */
  presetManager.registerSetter('shapes.forward.speed', (value, ctx) => {
    if (!hasOctas) return;

    const tailSegments = modulesRoot.octas!.slice(0, 30);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tailSegments.forEach((segment: any) => {
      if (segment && segment.position) {
        // Move forward along Z axis
        segment.position.z += value * (ctx.dt || 0.016);
        
        // Loop back if too far forward (create infinite swimming effect)
        if (segment.position.z > 10) {
          segment.position.z = -10;
        }
      }
    });
  });

  /**
   * Head scale: Controls the size of the shark head (sphere)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  presetManager.registerSetter('shapes.headScale', (value, _ctx) => {
    if (!hasSphere) return;

    const head = modulesRoot.sphere;
    if (head && head.scale) {
      head.scale.setScalar(value);
    }
  });

  /**
   * Particle emission rate: Controls how many particles are emitted per frame
   * TODO: Verify ParticleEmitter API
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  presetManager.registerSetter('particles.emissionRate', (value, _ctx) => {
    if (!hasEmitters) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modulesRoot.emitters!.forEach((emitter: any) => {
      if (emitter && typeof emitter.setEmissionRate === 'function') {
        emitter.setEmissionRate(value);
      }
    });
  });

  // ========== ACTIONS ==========

  /**
   * Particle burst: Trigger a burst of particles at a specific time
   * TODO: Verify emitter.burst() API signature
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  presetManager.registerAction('particleBurst', (args, _ctx) => {
    if (!hasEmitters) return;

    const count = args.count || 50;
    const color = args.color || '#ffffff';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modulesRoot.emitters!.forEach((emitter: any) => {
      if (emitter && typeof emitter.burst === 'function') {
        try {
          emitter.burst(count, { color });
        } catch (err) {
          console.warn('[hammerhead-setup] Failed to call emitter.burst():', err);
        }
      }
    });
  });

  console.log('[hammerhead-setup] Registered setters and actions for hammerhead preset');
}

/**
 * Example usage:
 * 
 * ```typescript
 * import PresetManager from './presets/PresetManager';
 * import { registerHammerhead } from './presets/implementations/hammerhead-setup';
 * import hammerheadPreset from './presets/hammerhead.json';
 * 
 * const presetManager = new PresetManager({ modulesRoot, seed: 1337 });
 * registerHammerhead(presetManager, modulesRoot);
 * presetManager.loadPreset(hammerheadPreset);
 * 
 * // In render loop:
 * const resolved = presetManager.evaluate(currentTime, audioSnapshot);
 * if (resolved) {
 *   presetManager.applyResolved(resolved, { t: currentTime, dt: deltaTime });
 * }
 * ```
 */
