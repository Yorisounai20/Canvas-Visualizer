/**
 * PresetManager - Manages preset data and evaluation.
 * Coordinates automation curves, audio-reactive parameters, and timed events.
 */

import type {
  PresetFile,
  ResolvedPreset,
  Automation,
  PresetEvent,
  SetterFunction,
  ActionFunction,
  PresetContext,
  AutomationKeyframe
} from '../types/presets';

interface PresetManagerOptions {
  /** Reference to the Three.js modules root (shapes, emitters, etc.) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modulesRoot?: any;
  /** Random seed for deterministic behavior */
  seed?: number;
}

/**
 * PresetManager handles loading, evaluation, and application of presets.
 */
export default class PresetManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public modulesRoot: any;
  private preset: PresetFile | null = null;
  private setters: Map<string, SetterFunction> = new Map();
  private actions: Map<string, ActionFunction> = new Map();
  private lastT: number = 0;

  constructor(options: PresetManagerOptions = {}) {
    this.modulesRoot = options.modulesRoot || null;
    // Note: seed is available in options but currently unused
    // TODO: Implement seeded RNG for deterministic animations
  }

  /**
   * Load a preset from a JSON object.
   */
  loadPreset(presetData: PresetFile): void {
    this.preset = presetData;
    this.lastT = 0;
  }

  /**
   * Load a preset from keyframes (backwards compatibility stub).
   * This method can be used to convert legacy keyframe data to the new format.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  loadFromKeyframes(_keyframesData: any): void {
    // TODO: Implement conversion from legacy keyframe format to PresetFile format
    console.warn('loadFromKeyframes is not yet implemented');
  }

  /**
   * Register a setter function for a target path.
   * Setters are called when a parameter value changes.
   */
  registerSetter(target: string, setter: SetterFunction): void {
    this.setters.set(target, setter);
  }

  /**
   * Register an action function.
   * Actions are called when events fire.
   */
  registerAction(actionName: string, action: ActionFunction): void {
    this.actions.set(actionName, action);
  }

  /**
   * Evaluate the preset at a specific time with optional audio data.
   * Returns resolved values for camera, params, and events.
   */
  evaluate(t: number, audioSnapshot?: { bass: number; mids: number; highs: number }): ResolvedPreset | null {
    if (!this.preset) {
      return null;
    }

    const resolved: ResolvedPreset = {
      camera: this.evaluateCamera(t),
      params: this.evaluateParams(t, audioSnapshot),
      events: this.evaluateEvents(t),
    };

    return resolved;
  }

  /**
   * Apply resolved values to the scene using registered setters and actions.
   */
  applyResolved(resolved: ResolvedPreset, ctx: PresetContext): void {
    // Apply camera values (if any custom camera setters are registered)
    if (resolved.camera) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const [key, value] of Object.entries(resolved.camera as any)) {
        const target = `camera.${key}`;
        const setter = this.setters.get(target);
        if (setter && value !== undefined) {
          setter(value, ctx);
        }
      }
    }

    // Apply parameter values
    for (const [target, value] of Object.entries(resolved.params)) {
      const setter = this.setters.get(target);
      if (setter) {
        setter(value, ctx);
      }
    }

    // Trigger events
    if (resolved.events) {
      for (const event of resolved.events) {
        const action = this.actions.get(event.action);
        if (action) {
          action(event.args || {}, ctx);
        }
      }
    }
  }

  /**
   * Dispose of resources.
   */
  dispose(): void {
    this.preset = null;
    this.setters.clear();
    this.actions.clear();
    this.modulesRoot = null;
  }

  // ========== Private evaluation methods ==========

  private evaluateCamera(t: number): ResolvedPreset['camera'] {
    if (!this.preset || !this.preset.camera) {
      return {};
    }

    // Start with initial camera config
    const camera: ResolvedPreset['camera'] = { ...this.preset.camera };

    // Override with automation values if present
    if (this.preset.automations) {
      for (const automation of this.preset.automations) {
        if (automation.target.startsWith('camera.')) {
          const key = automation.target.replace('camera.', '') as keyof NonNullable<ResolvedPreset['camera']>;
          const value = this.evaluateAutomation(automation, t);
          if (value !== undefined) {
            (camera as any)[key] = value;
          }
        }
      }
    }

    return camera;
  }

  private evaluateParams(t: number, audioSnapshot?: { bass: number; mids: number; highs: number }): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: Record<string, any> = {};

    if (!this.preset) {
      return params;
    }

    // Start with static params
    if (this.preset.params) {
      Object.assign(params, this.preset.params);
    }

    // Apply automations
    if (this.preset.automations) {
      for (const automation of this.preset.automations) {
        const value = this.evaluateAutomation(automation, t);
        if (value !== undefined) {
          params[automation.target] = value;
        }
      }
    }

    // Apply audio-reactive modulations
    if (this.preset.audioReactive && audioSnapshot) {
      for (const reactive of this.preset.audioReactive) {
        const bandValue = audioSnapshot[reactive.band] || 0;
        const currentValue = params[reactive.target] ?? 0;
        
        if (reactive.mode === 'add') {
          params[reactive.target] = currentValue + (bandValue * reactive.amount);
        } else {
          // Default to multiply
          params[reactive.target] = currentValue * (1 + bandValue * reactive.amount);
        }
      }
    }

    return params;
  }

  private evaluateEvents(t: number): PresetEvent[] | undefined {
    if (!this.preset || !this.preset.events) {
      return undefined;
    }

    // Find events that fire at this exact time (or within a small tolerance)
    const tolerance = 0.05; // 50ms tolerance
    const events = this.preset.events.filter(
      (event) => Math.abs(event.time - t) < tolerance && t >= this.lastT && t <= event.time + tolerance
    );

    return events.length > 0 ? events : undefined;
  }

  private evaluateAutomation(automation: Automation, t: number): number | undefined {
    const { keyframes } = automation;
    
    if (!keyframes || keyframes.length === 0) {
      return undefined;
    }

    // If before first keyframe, return first value
    if (t <= keyframes[0].time) {
      return keyframes[0].value;
    }

    // If after last keyframe, return last value
    if (t >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].value;
    }

    // Find the two keyframes to interpolate between
    let kf1: AutomationKeyframe | undefined;
    let kf2: AutomationKeyframe | undefined;

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
        kf1 = keyframes[i];
        kf2 = keyframes[i + 1];
        break;
      }
    }

    if (!kf1 || !kf2) {
      return undefined;
    }

    // Interpolate
    const duration = kf2.time - kf1.time;
    const progress = (t - kf1.time) / duration;
    const easedProgress = this.applyEasing(progress, kf1.easing || 'linear');

    return kf1.value + (kf2.value - kf1.value) * easedProgress;
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t;
    }
  }
}
