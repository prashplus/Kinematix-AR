import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Kinematix AR - Props Manager
 * Manages spawnable obstacle props: Concrete walls, wooden jump ramps, and stackable dynamic barrels/tires.
 */
export class PropsManager {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.props = []; // Array of { mesh, body, isDynamic }

    // Shared materials
    this.concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x8c929d,
      roughness: 0.8,
      metalness: 0.1
    });

    this.hazardStripeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.5,
      metalness: 0.2
    });

    this.woodMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.7,
      metalness: 0.05
    });

    this.barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Industrial Blue
      roughness: 0.35,
      metalness: 0.4
    });

    this.tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.9,
      metalness: 0.05
    });
  }

  /**
   * Spawn a Reinforced Concrete Crash Wall
   * @param {THREE.Vector3} position
   * @param {number} rotationY
   */
  spawnWall(position = new THREE.Vector3(0, 0.4, 3), rotationY = 0) {
    const width = 2.4;
    const height = 0.8;
    const depth = 0.45;

    // Visual Mesh
    const wallGroup = new THREE.Group();
    const wallGeom = new THREE.BoxGeometry(width, height, depth);
    const wallMesh = new THREE.Mesh(wallGeom, this.concreteMaterial);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    wallGroup.add(wallMesh);

    // Yellow Hazard Stripe top banner
    const stripeGeom = new THREE.BoxGeometry(width + 0.02, 0.12, depth + 0.02);
    const stripeMesh = new THREE.Mesh(stripeGeom, this.hazardStripeMaterial);
    stripeMesh.position.y = height / 2 - 0.06;
    wallGroup.add(stripeMesh);

    wallGroup.position.copy(position);
    wallGroup.position.y = height / 2;
    wallGroup.rotation.y = rotationY;
    this.scene.add(wallGroup);

    // Cannon Physics Body (Static or extremely heavy barrier)
    const cannonShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const wallBody = new CANNON.Body({
      mass: 0, // Static rigid body - will withstand max vehicle ramming
      material: this.physicsWorld.obstacleMaterial
    });
    wallBody.addShape(cannonShape);
    wallBody.position.set(wallGroup.position.x, wallGroup.position.y, wallGroup.position.z);
    wallBody.quaternion.setFromEuler(0, rotationY, 0);

    this.physicsWorld.addBody(wallBody);
    this.props.push({ mesh: wallGroup, body: wallBody, isDynamic: false });

    return wallGroup;
  }

  /**
   * Spawn a Wooden Stunt Jump Ramp
   * @param {THREE.Vector3} position
   * @param {number} rotationY
   */
  spawnRamp(position = new THREE.Vector3(0, 0, 4), rotationY = 0) {
    const width = 1.8;
    const height = 0.55;
    const length = 2.0;

    // Custom Wedge Geometry
    const geom = new THREE.BufferGeometry();
    // 6 vertices of a triangular prism
    // Front edge at y=0, back edge at y=height
    const halfW = width / 2;
    const halfL = length / 2;

    const vertices = new Float32Array([
      // Ramp inclined face (2 triangles)
      -halfW, 0, halfL,
       halfW, 0, halfL,
       halfW, height, -halfL,

      -halfW, 0, halfL,
       halfW, height, -halfL,
      -halfW, height, -halfL,

      // Bottom face
      -halfW, 0, -halfL,
       halfW, 0, -halfL,
       halfW, 0, halfL,

      -halfW, 0, -halfL,
       halfW, 0, halfL,
      -halfW, 0, halfL,

      // Back vertical face
      -halfW, 0, -halfL,
      -halfW, height, -halfL,
       halfW, height, -halfL,

      -halfW, 0, -halfL,
       halfW, height, -halfL,
       halfW, 0, -halfL,

      // Left side triangle
      -halfW, 0, halfL,
      -halfW, height, -halfL,
      -halfW, 0, -halfL,

      // Right side triangle
       halfW, 0, halfL,
       halfW, 0, -halfL,
       halfW, height, -halfL
    ]);

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();

    const rampMesh = new THREE.Mesh(geom, this.woodMaterial);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;

    rampMesh.position.copy(position);
    rampMesh.rotation.y = rotationY;
    this.scene.add(rampMesh);

    // Cannon Physics Body for Ramp (approximated with tilted box for smooth launch)
    const rampBody = new CANNON.Body({
      mass: 0,
      material: this.physicsWorld.groundMaterial
    });

    const angle = Math.atan2(height, length);
    const hypLen = Math.sqrt(height * height + length * length);
    const boxShape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.05, hypLen / 2));
    
    // Rotate and position inclined plane
    const q = new CANNON.Quaternion();
    q.setFromEuler(angle, 0, 0);
    rampBody.addShape(boxShape, new CANNON.Vec3(0, height / 2, 0), q);

    rampBody.position.set(position.x, position.y, position.z);
    rampBody.quaternion.setFromEuler(0, rotationY, 0);

    this.physicsWorld.addBody(rampBody);
    this.props.push({ mesh: rampMesh, body: rampBody, isDynamic: false });

    return rampMesh;
  }

  /**
   * Spawn a stack of dynamic plastic barrels and tires that scatter realistically
   * @param {THREE.Vector3} centerPos
   */
  spawnBarrelStack(centerPos = new THREE.Vector3(0, 0, 3)) {
    const barrelRadius = 0.22;
    const barrelHeight = 0.55;

    // Triangle formation: 3 on bottom, 1 on top
    const offsets = [
      new THREE.Vector3(-0.25, barrelHeight / 2, -0.15),
      new THREE.Vector3(0.25, barrelHeight / 2, -0.15),
      new THREE.Vector3(0, barrelHeight / 2, 0.25),
      new THREE.Vector3(0, barrelHeight * 1.5, 0)
    ];

    offsets.forEach((off, idx) => {
      const pos = centerPos.clone().add(off);

      // Visual Mesh
      const geom = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelHeight, 16);
      const isTire = idx === 3;
      const mesh = new THREE.Mesh(geom, isTire ? this.tireMaterial : this.barrelMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.copy(pos);
      this.scene.add(mesh);

      // Cannon Physics Body (Dynamic Cylinder/Box)
      const cannonShape = new CANNON.Cylinder(barrelRadius, barrelRadius, barrelHeight, 12);
      const body = new CANNON.Body({
        mass: 3.5, // 3.5kg dynamic barrel
        material: this.physicsWorld.obstacleMaterial,
        angularDamping: 0.3,
        linearDamping: 0.1
      });
      body.addShape(cannonShape);
      body.position.set(pos.x, pos.y, pos.z);

      this.physicsWorld.addBody(body);
      this.props.push({ mesh, body, isDynamic: true });
    });
  }

  /**
   * Sync dynamic props with their Cannon-es physics bodies
   */
  update() {
    for (let i = 0; i < this.props.length; i++) {
      const prop = this.props[i];
      if (prop.isDynamic && prop.mesh && prop.body) {
        prop.mesh.position.set(prop.body.position.x, prop.body.position.y, prop.body.position.z);
        prop.mesh.quaternion.set(
          prop.body.quaternion.x,
          prop.body.quaternion.y,
          prop.body.quaternion.z,
          prop.body.quaternion.w
        );
      }
    }
  }

  /**
   * Remove all spawned props
   */
  clearAll() {
    for (const prop of this.props) {
      if (prop.mesh && prop.mesh.parent) {
        prop.mesh.parent.remove(prop.mesh);
      }
      if (prop.body) {
        this.physicsWorld.removeBody(prop.body);
      }
    }
    this.props = [];
  }
}
