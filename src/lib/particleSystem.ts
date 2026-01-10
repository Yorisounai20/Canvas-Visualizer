/**
 * Particle System Architecture for Canvas Visualizer
 * Provides a formal, reusable particle system for audio-reactive visualizations
 */

import * as THREE from 'three';

// Particle system types and interfaces

export interface ParticleEmitterConfig {
  id: string;
  name: string;
  enabled: boolean;
  
  // Emission properties
  emissionRate: number; // Particles per second
  maxParticles: number; // Maximum number of particles
  lifetime: number; // Particle lifetime in seconds
  lifetimeVariance: number; // Random variance in lifetime (0-1)
  
  // Spawn properties
  spawnPosition: THREE.Vector3;
  spawnRadius: number; // Random spawn within this radius
  spawnVelocity: THREE.Vector3; // Initial velocity
  velocityVariance: number; // Random variance in velocity (0-1)
  
  // Visual properties
  startSize: number;
  endSize: number;
  startColor: THREE.Color;
  endColor: THREE.Color;
  startOpacity: number;
  endOpacity: number;
  
  // Physics
  gravity: THREE.Vector3;
  drag: number; // Air resistance (0-1)
  
  // Audio reactivity
  audioReactive: boolean;
  audioTrack: 'bass' | 'mids' | 'highs' | 'all';
  audioAffects: ('size' | 'opacity' | 'velocity' | 'emissionRate')[];
  audioIntensity: number; // How much audio affects particles (0-1)
  
  // Shape
  particleShape: 'sphere' | 'cube' | 'tetrahedron' | 'octahedron';
  wireframe: boolean;
  
  // Behavior
  rotationSpeed: THREE.Vector3; // Rotation per second
  attractionPoint?: THREE.Vector3; // Optional point to attract particles
  attractionForce?: number; // Strength of attraction
}

export interface Particle {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotationVelocity: THREE.Vector3;
  age: number; // Current age in seconds
  lifetime: number; // Total lifetime in seconds
  size: number;
  color: THREE.Color;
  opacity: number;
  mesh?: THREE.Mesh; // Three.js mesh reference
  active: boolean;
}

export class ParticleEmitter {
  public config: ParticleEmitterConfig;
  public particles: Particle[] = [];
  private particlePool: Particle[] = []; // Reusable particle objects
  private timeSinceLastEmission: number = 0;
  private scene?: THREE.Scene;
  
  constructor(config: ParticleEmitterConfig, scene?: THREE.Scene) {
    this.config = config;
    this.scene = scene;
    
    // Pre-allocate particle pool for performance
    this.initializeParticlePool();
  }
  
  /**
   * Pre-allocate particle objects to avoid allocations during runtime
   */
  private initializeParticlePool(): void {
    for (let i = 0; i < this.config.maxParticles; i++) {
      const particle = this.createParticle();
      particle.active = false;
      this.particlePool.push(particle);
    }
  }
  
  /**
   * Create a new particle with default properties
   */
  private createParticle(): Particle {
    return {
      id: `${this.config.id}_particle_${Date.now()}_${Math.random()}`,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      rotationVelocity: new THREE.Vector3(),
      age: 0,
      lifetime: this.config.lifetime,
      size: this.config.startSize,
      color: this.config.startColor.clone(),
      opacity: this.config.startOpacity,
      active: false
    };
  }
  
  /**
   * Get an inactive particle from the pool
   */
  private getParticleFromPool(): Particle | null {
    return this.particlePool.find(p => !p.active) || null;
  }
  
  /**
   * Spawn a new particle with randomized properties
   */
  private spawnParticle(): void {
    const particle = this.getParticleFromPool();
    if (!particle) return; // Pool exhausted
    
    // Reset particle properties
    particle.active = true;
    particle.age = 0;
    
    // Randomize lifetime
    const lifetimeVar = this.config.lifetimeVariance;
    particle.lifetime = this.config.lifetime * (1 + (Math.random() * 2 - 1) * lifetimeVar);
    
    // Randomize spawn position within radius
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDistance = Math.random() * this.config.spawnRadius;
    particle.position.copy(this.config.spawnPosition);
    particle.position.x += Math.cos(spawnAngle) * spawnDistance;
    particle.position.z += Math.sin(spawnAngle) * spawnDistance;
    
    // Randomize velocity
    const velVar = this.config.velocityVariance;
    particle.velocity.copy(this.config.spawnVelocity);
    particle.velocity.x += (Math.random() * 2 - 1) * velVar;
    particle.velocity.y += (Math.random() * 2 - 1) * velVar;
    particle.velocity.z += (Math.random() * 2 - 1) * velVar;
    
    // Set initial visual properties
    particle.size = this.config.startSize;
    particle.color.copy(this.config.startColor);
    particle.opacity = this.config.startOpacity;
    
    // Create mesh if scene is available
    if (this.scene && !particle.mesh) {
      particle.mesh = this.createParticleMesh(particle);
      this.scene.add(particle.mesh);
    }
    
    this.particles.push(particle);
  }
  
  /**
   * Create Three.js mesh for a particle
   */
  private createParticleMesh(particle: Particle): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    
    switch (this.config.particleShape) {
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(1);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(1);
        break;
      case 'sphere':
      default:
        geometry = new THREE.SphereGeometry(1, 8, 8);
        break;
    }
    
    const material = new THREE.MeshBasicMaterial({
      color: particle.color,
      transparent: true,
      opacity: particle.opacity,
      wireframe: this.config.wireframe
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(particle.position);
    mesh.scale.setScalar(particle.size);
    
    return mesh;
  }
  
  /**
   * Update particle system for one frame
   */
  public update(deltaTime: number, audioData?: { bass: number; mids: number; highs: number }): void {
    if (!this.config.enabled) return;
    
    // Emit new particles based on emission rate
    this.timeSinceLastEmission += deltaTime;
    const emissionInterval = 1 / this.config.emissionRate;
    
    // Apply audio reactivity to emission rate
    let effectiveEmissionRate = this.config.emissionRate;
    if (this.config.audioReactive && audioData && this.config.audioAffects.includes('emissionRate')) {
      const audioValue = this.getAudioValue(audioData);
      effectiveEmissionRate *= (1 + audioValue * this.config.audioIntensity);
    }
    
    while (this.timeSinceLastEmission >= emissionInterval && this.particles.length < this.config.maxParticles) {
      this.spawnParticle();
      this.timeSinceLastEmission -= emissionInterval;
    }
    
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update age
      particle.age += deltaTime;
      
      // Remove dead particles
      if (particle.age >= particle.lifetime) {
        this.removeParticle(i);
        continue;
      }
      
      // Calculate lifecycle progress (0-1)
      const progress = particle.age / particle.lifetime;
      
      // Apply physics
      particle.velocity.add(this.config.gravity.clone().multiplyScalar(deltaTime));
      particle.velocity.multiplyScalar(1 - this.config.drag * deltaTime);
      
      // Apply attraction force
      if (this.config.attractionPoint && this.config.attractionForce) {
        const direction = this.config.attractionPoint.clone().sub(particle.position);
        const distance = direction.length();
        if (distance > 0.1) {
          direction.normalize().multiplyScalar(this.config.attractionForce / (distance * distance));
          particle.velocity.add(direction.multiplyScalar(deltaTime));
        }
      }
      
      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
      
      // Update rotation
      particle.rotation.x += particle.rotationVelocity.x * deltaTime;
      particle.rotation.y += particle.rotationVelocity.y * deltaTime;
      particle.rotation.z += particle.rotationVelocity.z * deltaTime;
      
      // Interpolate visual properties
      particle.size = THREE.MathUtils.lerp(this.config.startSize, this.config.endSize, progress);
      particle.color.lerpColors(this.config.startColor, this.config.endColor, progress);
      particle.opacity = THREE.MathUtils.lerp(this.config.startOpacity, this.config.endOpacity, progress);
      
      // Apply audio reactivity
      if (this.config.audioReactive && audioData) {
        const audioValue = this.getAudioValue(audioData);
        
        if (this.config.audioAffects.includes('size')) {
          particle.size *= (1 + audioValue * this.config.audioIntensity * 0.5);
        }
        
        if (this.config.audioAffects.includes('opacity')) {
          particle.opacity *= (1 + audioValue * this.config.audioIntensity * 0.5);
        }
        
        if (this.config.audioAffects.includes('velocity')) {
          const boost = audioValue * this.config.audioIntensity * 5;
          particle.velocity.y += boost * deltaTime;
        }
      }
      
      // Update mesh if it exists
      if (particle.mesh) {
        particle.mesh.position.copy(particle.position);
        particle.mesh.rotation.copy(particle.rotation);
        particle.mesh.scale.setScalar(particle.size);
        (particle.mesh.material as THREE.MeshBasicMaterial).color.copy(particle.color);
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.opacity;
      }
    }
  }
  
  /**
   * Get audio value based on configured track
   */
  private getAudioValue(audioData: { bass: number; mids: number; highs: number }): number {
    switch (this.config.audioTrack) {
      case 'bass': return audioData.bass;
      case 'mids': return audioData.mids;
      case 'highs': return audioData.highs;
      case 'all': return (audioData.bass + audioData.mids + audioData.highs) / 3;
      default: return 0;
    }
  }
  
  /**
   * Remove a particle by index
   */
  private removeParticle(index: number): void {
    const particle = this.particles[index];
    
    if (particle.mesh && this.scene) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
      particle.mesh = undefined;
    }
    
    particle.active = false;
    this.particles.splice(index, 1);
  }
  
  /**
   * Clean up all particles and resources
   */
  public dispose(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.removeParticle(i);
    }
    this.particles = [];
    this.particlePool = [];
  }
}

/**
 * Particle System Manager - manages multiple emitters
 */
export class ParticleSystemManager {
  private emitters: Map<string, ParticleEmitter> = new Map();
  
  public addEmitter(emitter: ParticleEmitter): void {
    this.emitters.set(emitter.config.id, emitter);
  }
  
  public removeEmitter(id: string): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.dispose();
      this.emitters.delete(id);
    }
  }
  
  public update(deltaTime: number, audioData?: { bass: number; mids: number; highs: number }): void {
    this.emitters.forEach(emitter => {
      emitter.update(deltaTime, audioData);
    });
  }
  
  public dispose(): void {
    this.emitters.forEach(emitter => emitter.dispose());
    this.emitters.clear();
  }
}
