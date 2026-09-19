import * as CANNON from 'cannon-es';

/**
 * Kinematix AR - Raycast Vehicle Controller
 * 4-wheel independent raycast suspension, weight transfer dynamics,
 * tire friction, and proportional servo steering.
 */
export class RaycastVehicleController {
  constructor(physicsWorld, vehicleConfig, initialPosition = [0, 0.4, 0]) {
    this.physicsWorld = physicsWorld;
    this.config = vehicleConfig;

    // Chassis Cannon Body
    const { width, height, length } = vehicleConfig.chassisDims;
    const chassisShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, length / 2));
    
    this.chassisBody = new CANNON.Body({
      mass: vehicleConfig.mass,
      material: physicsWorld.chassisMaterial,
      angularDamping: 0.35,
      linearDamping: 0.05
    });
    this.chassisBody.addShape(chassisShape);
    this.chassisBody.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);

    physicsWorld.addBody(this.chassisBody);

    // Create RaycastVehicle
    this.vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.chassisBody,
      indexRightAxis: 0, // X-axis is right
      indexUpAxis: 1,    // Y-axis is up
      indexForwardAxis: 2 // Z-axis is forward
    });

    this.wheelOffsets = [];
    this.setupWheels();

    // Attach raycast vehicle to physics world
    this.vehicle.addToWorld(physicsWorld.world);

    // Dynamic Control States
    this.targetSteering = 0;
    this.currentSteering = 0;
    this.throttle = 0;
    this.brake = 0;
    this.handbrake = false;

    // Telemetry
    this.speedKmH = 0;
    this.rpm = 0;
    this.lateralSlip = 0;
    this.suspensionCompression = [0, 0, 0, 0]; // FL, FR, RL, RR (0 to 1)

    // Listen for collision impulses on chassis
    this.onCollision = null;
    this.chassisBody.addEventListener('collide', (event) => {
      this.handleChassisCollision(event);
    });
  }

  setupWheels() {
    const { wheelRadius, wheelBase, trackWidth, suspension } = this.config;
    const halfBase = wheelBase / 2;
    const halfTrack = trackWidth / 2;
    const downDirection = new CANNON.Vec3(0, -1, 0);
    const axleDirection = new CANNON.Vec3(1, 0, 0);

    // Wheel connection points relative to chassis center:
    // Index 0: Front-Left (+X, -Y, +Z)
    // Index 1: Front-Right (-X, -Y, +Z)
    // Index 2: Rear-Left (+X, -Y, -Z)
    // Index 3: Rear-Right (-X, -Y, -Z)
    const positions = [
      new CANNON.Vec3(halfTrack, -0.05, halfBase),   // FL
      new CANNON.Vec3(-halfTrack, -0.05, halfBase),  // FR
      new CANNON.Vec3(halfTrack, -0.05, -halfBase),  // RL
      new CANNON.Vec3(-halfTrack, -0.05, -halfBase)  // RR
    ];

    this.wheelOffsets = positions;

    positions.forEach((pos, idx) => {
      const isFront = idx < 2;
      this.vehicle.addWheel({
        radius: wheelRadius,
        directionLocal: downDirection,
        axleLocal: axleDirection,
        chassisConnectionPointLocal: pos,
        suspensionRestLength: suspension.suspensionRestLength,
        suspensionStiffness: suspension.suspensionStiffness,
        suspensionDamping: suspension.suspensionDamping,
        maxSuspensionForce: 15000,
        maxSuspensionTravel: suspension.maxSuspensionTravel,
        customSlidingRotationalSpeed: suspension.customSlidingRotationalSpeed,
        useCustomSlidingRotationalSpeed: true,
        rollInfluence: suspension.rollInfluence,
        frictionSlip: suspension.frictionSlip,
        isFrontWheel: isFront
      });
    });
  }

  handleChassisCollision(event) {
    const contact = event.contact;
    if (!contact) return;

    // Estimate collision impulse
    const impulse = contact.getImpactVelocityAlongNormal();
    const absImpulse = Math.abs(impulse);

    if (absImpulse > 1.2 && this.onCollision) {
      // Find contact point in world & local chassis coordinates
      const worldContactPoint = contact.bi === this.chassisBody ? contact.rj : contact.ri;
      const contactPos = new CANNON.Vec3();
      this.chassisBody.position.vadd(worldContactPoint, contactPos);

      // Convert to local chassis coordinate
      const localPos = this.chassisBody.pointToLocalFrame(contactPos);

      this.onCollision({
        impulse: absImpulse,
        worldPoint: [contactPos.x, contactPos.y, contactPos.z],
        localPoint: [localPos.x, localPos.y, localPos.z],
        normal: [contact.ni.x, contact.ni.y, contact.ni.z]
      });
    }
  }

  /**
   * Update driving controls
   * @param {number} steerInput - Normalized steering (-1 to 1)
   * @param {number} throttleInput - Normalized throttle (-1 to 1)
   * @param {boolean} handbrakeInput - Handbrake engaged
   * @param {number} delta - Frame delta in seconds
   */
  updateInputs(steerInput, throttleInput, handbrakeInput, delta) {
    const { maxSteerVal, steerSpeed, engine, driveType } = this.config;

    // Smooth proportional steering servo lerp
    this.targetSteering = -steerInput * maxSteerVal; // Invert so positive steer is left
    const steerStep = steerSpeed * delta;
    if (Math.abs(this.targetSteering - this.currentSteering) < steerStep) {
      this.currentSteering = this.targetSteering;
    } else {
      this.currentSteering += Math.sign(this.targetSteering - this.currentSteering) * steerStep;
    }

    // Apply steering to front wheels
    this.vehicle.setSteeringValue(this.currentSteering, 0);
    this.vehicle.setSteeringValue(this.currentSteering, 1);

    this.throttle = throttleInput;
    this.handbrake = handbrakeInput;

    // Engine forces
    let driveForce = 0;
    let brakeForce = 0;

    // Check current forward velocity
    const forwardVec = new CANNON.Vec3(0, 0, 1);
    this.chassisBody.vectorToWorldFrame(forwardVec, forwardVec);
    const forwardVelocity = this.chassisBody.velocity.dot(forwardVec);
    this.speedKmH = Math.abs(forwardVelocity * 3.6);

    if (throttleInput > 0.05) {
      // Accelerating forward
      const torqueCurve = Math.max(0.2, 1.0 - (this.speedKmH / engine.topSpeedKmH));
      driveForce = throttleInput * engine.maxEngineForce * torqueCurve;
      brakeForce = 0;
    } else if (throttleInput < -0.05) {
      if (forwardVelocity > 0.6) {
        // High speed moving forward + down trigger = Heavy braking / Nose dive
        driveForce = 0;
        brakeForce = Math.abs(throttleInput) * engine.maxBrakeForce * 1.5;
      } else {
        // Reversing
        driveForce = throttleInput * engine.maxReverseForce;
        brakeForce = 0;
      }
    } else {
      // Natural rolling drag
      driveForce = 0;
      brakeForce = 2.0;
    }

    if (handbrakeInput) {
      brakeForce = engine.maxBrakeForce * 3.0;
    }

    // Apply motor torque based on drive type
    const frontRatio = driveType === '4WD' || driveType === 'AWD' ? 0.5 : 0;
    const rearRatio = driveType === '4WD' || driveType === 'AWD' ? 0.5 : 1.0;

    this.vehicle.applyEngineForce(driveForce * frontRatio, 0);
    this.vehicle.applyEngineForce(driveForce * frontRatio, 1);
    this.vehicle.applyEngineForce(driveForce * rearRatio, 2);
    this.vehicle.applyEngineForce(driveForce * rearRatio, 3);

    // Apply brakes
    this.vehicle.setBrake(brakeForce * 0.6, 0);
    this.vehicle.setBrake(brakeForce * 0.6, 1);
    this.vehicle.setBrake(brakeForce * 0.4 + (handbrakeInput ? 40 : 0), 2);
    this.vehicle.setBrake(brakeForce * 0.4 + (handbrakeInput ? 40 : 0), 3);

    // Compute Telemetry: Suspension travel and tire slip
    this.updateTelemetry();
  }

  updateTelemetry() {
    let totalSlip = 0;
    const restLen = this.config.suspension.suspensionRestLength;

    for (let i = 0; i < 4; i++) {
      const wheelInfo = this.vehicle.wheelInfos[i];
      if (wheelInfo) {
        // Suspension compression (0 = fully extended, 1 = fully compressed)
        const rayLen = wheelInfo.suspensionLength || restLen;
        const comp = Math.max(0, Math.min(1.0, (restLen - rayLen) / (this.config.suspension.maxSuspensionTravel || 0.2)));
        this.suspensionCompression[i] = comp;

        // Lateral slip calculation
        if (wheelInfo.isInContact) {
          const skidVel = Math.abs(wheelInfo.skidInfo || 0);
          totalSlip += skidVel;
        }
      }
    }

    this.lateralSlip = totalSlip / 4;

    // Virtual RPM calculation
    const baseIdle = 1200;
    const speedRatio = Math.min(this.speedKmH / this.config.engine.topSpeedKmH, 1.0);
    const throttleSpike = Math.abs(this.throttle) * 3500;
    this.rpm = Math.min(this.config.engine.maxRpm, baseIdle + speedRatio * (this.config.engine.maxRpm - baseIdle) + throttleSpike);
  }

  /**
   * Flip / Respawn car upright
   * @param {number[]} pos - [x, y, z] target position
   */
  respawn(pos = null) {
    const target = pos || [
      this.chassisBody.position.x,
      Math.max(0.6, this.chassisBody.position.y + 0.5),
      this.chassisBody.position.z
    ];

    this.chassisBody.position.set(target[0], target[1], target[2]);
    this.chassisBody.velocity.set(0, 0, 0);
    this.chassisBody.angularVelocity.set(0, 0, 0);

    // Upright quaternion keeping current yaw
    const euler = new CANNON.Vec3();
    this.chassisBody.quaternion.toEuler(euler);
    this.chassisBody.quaternion.setFromEuler(0, euler.y, 0);

    for (let i = 0; i < 4; i++) {
      this.vehicle.setBrake(100, i);
      this.vehicle.applyEngineForce(0, i);
    }
  }

  destroy() {
    this.vehicle.removeFromWorld(this.physicsWorld.world);
    this.physicsWorld.removeBody(this.chassisBody);
  }
}
