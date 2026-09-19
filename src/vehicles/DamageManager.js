import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createNoise3D } from 'simplex-noise';

/**
 * Kinematix AR - Real-Time Collision Damage System
 * Handles vertex crumple deformation, dynamic part detachment into physics bodies,
 * and smooth vertex restoration / repair.
 */
export class DamageManager {
  constructor(physicsWorld, scene, particleSystem, soundManager) {
    this.physicsWorld = physicsWorld;
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.soundManager = soundManager;
    this.noise3D = createNoise3D();

    this.carBodyMesh = null;
    this.breakables = [];
    this.detachedObjects = []; // Array of { mesh, body }

    // Repair animation state
    this.isRepairing = false;
    this.repairProgress = 0;
    this.repairSpeed = 1.6; // ~0.6 seconds to fully restore
  }

  /**
   * Bind vehicle mesh and breakables
   */
  setVehicle(bodyMesh, breakableMeshes) {
    this.carBodyMesh = bodyMesh;
    this.breakables = [...breakableMeshes];
    this.cleanDetachedObjects();
  }

  /**
   * Process a collision event from the raycast controller
   * @param {Object} collisionData { impulse, worldPoint, localPoint, normal }
   */
  handleCollision(collisionData) {
    const { impulse, worldPoint, localPoint, normal } = collisionData;

    // Trigger procedural crunch sound
    if (this.soundManager) {
      this.soundManager.playImpact(impulse);
    }

    // Spawn metallic spark burst at world contact point
    if (this.particleSystem && impulse > 2.0) {
      this.particleSystem.spawnSparks(
        new THREE.Vector3(...worldPoint),
        new THREE.Vector3(...normal),
        Math.min(impulse * 3, 25)
      );
    }

    // 1. Vertex Crumple Deformation on Car Body
    if (this.carBodyMesh && impulse > 2.5) {
      this.deformMesh(localPoint, impulse, normal);
    }

    // 2. Check Breakable Detachments
    this.checkBreakables(impulse, worldPoint);
  }

  /**
   * Crumple vertices within radius R around impact point
   */
  deformMesh(localImpactPoint, impulse, worldNormal) {
    if (!this.carBodyMesh || !this.carBodyMesh.geometry) return;

    const geom = this.carBodyMesh.geometry;
    const posAttr = geom.attributes.position;
    const orig = this.carBodyMesh.userData.originalPositions;
    if (!orig) return;

    // Radius of crumple proportional to impulse
    const radius = Math.min(0.2 + (impulse / 35) * 0.35, 0.65);
    const maxPush = Math.min(0.04 + (impulse / 40) * 0.14, 0.22);

    const impactVec = new THREE.Vector3(...localImpactPoint);
    let verticesChanged = false;

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);

      const dist = impactVec.distanceTo(new THREE.Vector3(vx, vy, vz));
      if (dist < radius) {
        // Falloff factor: 1 at center, 0 at outer boundary
        const factor = Math.cos((dist / radius) * (Math.PI / 2));
        
        // Simplex noise to create authentic crumpled sheet metal ridges
        const noise = this.noise3D(vx * 8, vy * 8, vz * 8) * 0.35;
        
        // Push inward towards car center or impact normal
        const pushDir = new THREE.Vector3(vx, vy, vz).sub(impactVec).normalize();
        const inwardOffset = pushDir.multiplyScalar(-maxPush * factor * (1.0 + noise));

        // Clamp deformation so mesh does not invert
        const newX = THREE.MathUtils.clamp(vx + inwardOffset.x, -0.6, 0.6);
        const newY = THREE.MathUtils.clamp(vy + inwardOffset.y, -0.3, 0.5);
        const newZ = THREE.MathUtils.clamp(vz + inwardOffset.z, -1.2, 1.2);

        posAttr.setXYZ(i, newX, newY, newZ);
        verticesChanged = true;
      }
    }

    if (verticesChanged) {
      posAttr.needsUpdate = true;
      geom.computeVertexNormals();
      if (this.carBodyMesh.userData.currentPositions) {
        this.carBodyMesh.userData.currentPositions.set(posAttr.array);
      }
    }
  }

  /**
   * Decouple sub-meshes if impulse exceeds threshold and register as dynamic physics bodies
   */
  checkBreakables(impulse, worldContactPoint) {
    for (let i = this.breakables.length - 1; i >= 0; i--) {
      const part = this.breakables[i];
      if (!part.userData || !part.userData.isBreakable) continue;

      if (impulse >= part.userData.breakImpulse) {
        this.detachPart(part, impulse, worldContactPoint);
        this.breakables.splice(i, 1);
      }
    }
  }

  detachPart(partMesh, impulse, worldContactPoint) {
    // 1. Get world transform before detaching
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    partMesh.getWorldPosition(worldPos);
    partMesh.getWorldQuaternion(worldQuat);
    partMesh.getWorldScale(worldScale);

    // Remove from car hierarchy and attach directly to scene
    if (partMesh.parent) {
      partMesh.parent.remove(partMesh);
    }
    this.scene.add(partMesh);

    partMesh.position.copy(worldPos);
    partMesh.quaternion.copy(worldQuat);
    partMesh.scale.copy(worldScale);

    // 2. Create dynamic Cannon-es physics rigid body for the broken piece
    const box = new THREE.Box3().setFromObject(partMesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const halfExtents = new CANNON.Vec3(
      Math.max(0.04, size.x / 2),
      Math.max(0.03, size.y / 2),
      Math.max(0.04, size.z / 2)
    );

    const cannonShape = new CANNON.Box(halfExtents);
    const partBody = new CANNON.Body({
      mass: partMesh.userData.mass || 0.8,
      material: this.physicsWorld.obstacleMaterial,
      angularDamping: 0.4,
      linearDamping: 0.1
    });
    partBody.addShape(cannonShape);
    partBody.position.set(worldPos.x, worldPos.y, worldPos.z);
    partBody.quaternion.set(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w);

    // Add bounce impulse away from contact point
    const contactVec = new THREE.Vector3(...worldContactPoint);
    const flyDir = new THREE.Vector3().subVectors(worldPos, contactVec).normalize();
    flyDir.y += 0.6;
    flyDir.normalize();

    const speed = Math.min(impulse * 0.4, 8.0);
    partBody.velocity.set(flyDir.x * speed, flyDir.y * speed, flyDir.z * speed);
    partBody.angularVelocity.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12
    );

    this.physicsWorld.addBody(partBody);
    this.detachedObjects.push({ mesh: partMesh, body: partBody });
  }

  /**
   * Start smooth repair transition back to original cached buffer positions
   */
  startRepair() {
    if (!this.carBodyMesh || !this.carBodyMesh.userData.originalPositions) return;
    this.isRepairing = true;
    this.repairProgress = 0;
    if (this.soundManager) {
      this.soundManager.playRepair();
    }
  }

  /**
   * Per-frame update for repair lerp and syncing detached parts
   * @param {number} delta - Frame delta in seconds
   */
  update(delta) {
    // 1. Sync detached parts with physics bodies
    for (let i = 0; i < this.detachedObjects.length; i++) {
      const item = this.detachedObjects[i];
      if (item.mesh && item.body) {
        item.mesh.position.set(item.body.position.x, item.body.position.y, item.body.position.z);
        item.mesh.quaternion.set(
          item.body.quaternion.x,
          item.body.quaternion.y,
          item.body.quaternion.z,
          item.body.quaternion.w
        );
      }
    }

    // 2. Animate repair restoration
    if (this.isRepairing && this.carBodyMesh) {
      const geom = this.carBodyMesh.geometry;
      const posAttr = geom.attributes.position;
      const orig = this.carBodyMesh.userData.originalPositions;
      const current = this.carBodyMesh.userData.currentPositions;

      this.repairProgress += delta * this.repairSpeed;
      const t = Math.min(this.repairProgress, 1.0);

      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - t, 3);

      for (let i = 0; i < posAttr.count; i++) {
        const curX = current[i * 3];
        const curY = current[i * 3 + 1];
        const curZ = current[i * 3 + 2];

        const targetX = orig[i * 3];
        const targetY = orig[i * 3 + 1];
        const targetZ = orig[i * 3 + 2];

        posAttr.setXYZ(
          i,
          curX + (targetX - curX) * ease,
          curY + (targetY - curY) * ease,
          curZ + (targetZ - curZ) * ease
        );
      }

      posAttr.needsUpdate = true;
      geom.computeVertexNormals();

      if (t >= 1.0) {
        this.isRepairing = false;
        // Snap directly to original
        posAttr.copyArray(orig);
        posAttr.needsUpdate = true;
        geom.computeVertexNormals();
        current.set(orig);
      }
    }
  }

  cleanDetachedObjects() {
    for (const item of this.detachedObjects) {
      if (item.mesh && item.mesh.parent) {
        item.mesh.parent.remove(item.mesh);
      }
      if (item.body) {
        this.physicsWorld.removeBody(item.body);
      }
    }
    this.detachedObjects = [];
  }

  destroy() {
    this.cleanDetachedObjects();
  }
}
