import * as THREE from 'three';

/**
 * Kinematix AR - Particle System
 * High performance spark bursts and tire drift/burnout smoke particles.
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // Sparks (Points system)
    this.maxSparks = 200;
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkVelocities = new Float32Array(this.maxSparks * 3);
    this.sparkLifetimes = new Float32Array(this.maxSparks); // 0 = dead, >0 = alive
    this.sparkIndex = 0;

    const sparkGeom = new THREE.BufferGeometry();
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: 0xffdd44,
      size: 0.045,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.sparksMesh = new THREE.Points(sparkGeom, sparkMat);
    this.sparksMesh.frustumCulled = false;
    this.scene.add(this.sparksMesh);

    // Tire Smoke / Dust (Points system)
    this.maxSmoke = 300;
    this.smokePositions = new Float32Array(this.maxSmoke * 3);
    this.smokeVelocities = new Float32Array(this.maxSmoke * 3);
    this.smokeLifetimes = new Float32Array(this.maxSmoke);
    this.smokeIndex = 0;

    const smokeGeom = new THREE.BufferGeometry();
    smokeGeom.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));

    const smokeMat = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.14,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });

    this.smokeMesh = new THREE.Points(smokeGeom, smokeMat);
    this.smokeMesh.frustumCulled = false;
    this.scene.add(this.smokeMesh);
  }

  /**
   * Spawn bright metallic sparks flying outward from collision
   * @param {THREE.Vector3} origin - Impact position
   * @param {THREE.Vector3} normal - Surface normal
   * @param {number} count - Number of sparks
   */
  spawnSparks(origin, normal, count = 15) {
    for (let i = 0; i < count; i++) {
      const idx = this.sparkIndex;
      this.sparkPositions[idx * 3] = origin.x;
      this.sparkPositions[idx * 3 + 1] = origin.y;
      this.sparkPositions[idx * 3 + 2] = origin.z;

      // Random bounce velocity biased along reflection normal
      const vx = (normal.x + (Math.random() - 0.5) * 1.5) * (1.5 + Math.random() * 2.5);
      const vy = (Math.abs(normal.y) + Math.random() * 2.0) * (1.2 + Math.random() * 2.0);
      const vz = (normal.z + (Math.random() - 0.5) * 1.5) * (1.5 + Math.random() * 2.5);

      this.sparkVelocities[idx * 3] = vx;
      this.sparkVelocities[idx * 3 + 1] = vy;
      this.sparkVelocities[idx * 3 + 2] = vz;

      this.sparkLifetimes[idx] = 0.25 + Math.random() * 0.35; // Short spark duration

      this.sparkIndex = (this.sparkIndex + 1) % this.maxSparks;
    }
  }

  /**
   * Spawn drift smoke / burnout dust at tire contact point
   * @param {THREE.Vector3} wheelPos - Position of slipping tire
   * @param {number} count - Number of dust puffs
   */
  spawnSmoke(wheelPos, count = 2) {
    for (let i = 0; i < count; i++) {
      const idx = this.smokeIndex;
      this.smokePositions[idx * 3] = wheelPos.x + (Math.random() - 0.5) * 0.1;
      this.smokePositions[idx * 3 + 1] = wheelPos.y - 0.05;
      this.smokePositions[idx * 3 + 2] = wheelPos.z + (Math.random() - 0.5) * 0.1;

      this.smokeVelocities[idx * 3] = (Math.random() - 0.5) * 0.3;
      this.smokeVelocities[idx * 3 + 1] = 0.4 + Math.random() * 0.4; // Billows upward
      this.smokeVelocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.3;

      this.smokeLifetimes[idx] = 0.6 + Math.random() * 0.6;

      this.smokeIndex = (this.smokeIndex + 1) % this.maxSmoke;
    }
  }

  /**
   * Update particle positions, velocities, and lifetimes
   * @param {number} delta - Frame delta in seconds
   */
  update(delta) {
    // 1. Update Sparks
    let sparkPosUpdated = false;
    for (let i = 0; i < this.maxSparks; i++) {
      if (this.sparkLifetimes[i] > 0) {
        this.sparkLifetimes[i] -= delta;

        // Gravity pull on sparks
        this.sparkVelocities[i * 3 + 1] -= 9.8 * delta;

        this.sparkPositions[i * 3] += this.sparkVelocities[i * 3] * delta;
        this.sparkPositions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * delta;
        this.sparkPositions[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * delta;

        // Ground bounce at y = 0
        if (this.sparkPositions[i * 3 + 1] < 0.01) {
          this.sparkPositions[i * 3 + 1] = 0.01;
          this.sparkVelocities[i * 3 + 1] *= -0.3;
        }

        sparkPosUpdated = true;
      }
    }

    if (sparkPosUpdated) {
      this.sparksMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update Smoke
    let smokePosUpdated = false;
    for (let i = 0; i < this.maxSmoke; i++) {
      if (this.smokeLifetimes[i] > 0) {
        this.smokeLifetimes[i] -= delta;

        this.smokePositions[i * 3] += this.smokeVelocities[i * 3] * delta;
        this.smokePositions[i * 3 + 1] += this.smokeVelocities[i * 3 + 1] * delta;
        this.smokePositions[i * 3 + 2] += this.smokeVelocities[i * 3 + 2] * delta;

        // Slow down smoke expansion
        this.smokeVelocities[i * 3] *= 0.95;
        this.smokeVelocities[i * 3 + 1] *= 0.96;
        this.smokeVelocities[i * 3 + 2] *= 0.95;

        smokePosUpdated = true;
      }
    }

    if (smokePosUpdated) {
      this.smokeMesh.geometry.attributes.position.needsUpdate = true;
    }
  }

  destroy() {
    this.scene.remove(this.sparksMesh);
    this.scene.remove(this.smokeMesh);
  }
}
