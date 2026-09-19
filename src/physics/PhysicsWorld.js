import * as CANNON from 'cannon-es';

/**
 * Kinematix AR - Physics World Manager
 * Configures Cannon-es physics simulation with high-speed substepping,
 * collision materials, and ground collision planes.
 */
export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World();
    
    // Scale-tuned gravity for RC vehicles (slightly higher than 9.8 for authentic 1/10 scale weight transfer)
    this.world.gravity.set(0, -14.5, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.defaultContactMaterial.friction = 0.4;
    this.world.defaultContactMaterial.restitution = 0.1;

    // Contact Materials
    this.groundMaterial = new CANNON.Material('ground');
    this.wheelMaterial = new CANNON.Material('wheel');
    this.chassisMaterial = new CANNON.Material('chassis');
    this.obstacleMaterial = new CANNON.Material('obstacle');

    // Wheel - Ground contact (high traction)
    const wheelGroundContact = new CANNON.ContactMaterial(this.wheelMaterial, this.groundMaterial, {
      friction: 0.85,
      restitution: 0.05,
      contactEquationStiffness: 1000,
      frictionEquationStiffness: 1000
    });
    this.world.addContactMaterial(wheelGroundContact);

    // Chassis - Obstacle contact (impacts)
    const chassisObstacleContact = new CANNON.ContactMaterial(this.chassisMaterial, this.obstacleMaterial, {
      friction: 0.35,
      restitution: 0.25
    });
    this.world.addContactMaterial(chassisObstacleContact);

    // Ground plane
    this.groundBody = null;
    this.setupGround();

    // Track dynamic bodies for sync
    this.dynamicProps = [];
  }

  setupGround() {
    // Static ground plane at y = 0
    const groundShape = new CANNON.Plane();
    this.groundBody = new CANNON.Body({
      mass: 0, // static
      material: this.groundMaterial
    });
    this.groundBody.addShape(groundShape);
    // Rotate plane from facing +Z to +Y
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(this.groundBody);
  }

  /**
   * Step physics simulation with sub-stepping for stability
   * @param {number} delta - Frame delta time in seconds
   */
  step(delta) {
    const clampedDelta = Math.min(delta, 0.1);
    this.world.step(1 / 60, clampedDelta, 5);
  }

  addBody(body) {
    this.world.addBody(body);
  }

  removeBody(body) {
    this.world.removeBody(body);
  }

  reset() {
    // Keep ground, remove other bodies if needed
  }
}
