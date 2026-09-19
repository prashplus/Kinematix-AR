/**
 * Kinematix AR - Vehicle Configurations
 * Defines physics parameters, suspension characteristics, and visual traits
 * for the 3 distinct RC vehicle archetypes.
 */

export const VEHICLE_ARCHETYPES = {
  TROPHY_TRUCK: {
    id: 'trophy_truck',
    name: 'Baja Trophy 4x4',
    tagline: 'Long-Travel Offroad Bouncer',
    category: 'Desert Racer',
    color: '#ff6d00', // Vibrant Baja Orange
    accentColor: '#2979ff',
    mass: 140, // Scaled RC mass (approx 3.5kg physical, tuned for stable cannon simulation)
    chassisDims: { width: 0.9, height: 0.5, length: 1.8 },
    wheelRadius: 0.22,
    wheelWidth: 0.16,
    wheelMass: 10,
    wheelBase: 1.15,
    trackWidth: 0.85,
    driveType: '4WD', // 4-Wheel Drive
    maxSteerVal: 0.65, // ~37 degrees
    steerSpeed: 7.0, // Servo responsiveness

    // Suspension settings - Long travel, soft springs, high roll
    suspension: {
      suspensionRestLength: 0.38,
      suspensionStiffness: 28,
      suspensionDamping: 2.3,
      suspensionCompression: 3.0,
      maxSuspensionTravel: 0.32,
      rollInfluence: 0.35, // Visible chassis lean
      customSlidingRotationalSpeed: -30,
      frictionSlip: 2.5
    },

    // Drivetrain & Engine
    engine: {
      maxEngineForce: 850,
      maxBrakeForce: 45,
      maxReverseForce: 450,
      topSpeedKmH: 52,
      maxRpm: 14000,
      torqueCurveBias: 1.3 // High low-end punch
    },

    // Modular Breakable Parts
    breakables: [
      { name: 'roof_lightbar', breakImpulse: 22, relPos: [0, 0.45, 0.1], mass: 0.8 },
      { name: 'spare_tire', breakImpulse: 28, relPos: [0, 0.25, -0.75], mass: 2.2 },
      { name: 'front_bumper', breakImpulse: 25, relPos: [0, -0.05, 0.92], mass: 1.5 }
    ],

    description: 'Equipped with independent long-travel remote-reservoir shocks, tall all-terrain knobby tires, and huge ground clearance. Absorbs aggressive jumps and rough terrain with signature trophy truck body roll.'
  },

  GT_SUPERCAR: {
    id: 'gt_supercar',
    name: 'Apex GT-R Concept',
    tagline: 'Track-Tuned Downforce Weapon',
    category: 'Hypercar',
    color: '#00e5ff', // Cyber Electric Cyan
    accentColor: '#d500f9',
    mass: 155,
    chassisDims: { width: 0.86, height: 0.32, length: 1.85 },
    wheelRadius: 0.16,
    wheelWidth: 0.15,
    wheelMass: 8,
    wheelBase: 1.2,
    trackWidth: 0.84,
    driveType: 'AWD',
    maxSteerVal: 0.52, // Razor sharp steering
    steerSpeed: 9.5,

    // Suspension settings - Stiff, low ride height, almost zero body roll
    suspension: {
      suspensionRestLength: 0.20,
      suspensionStiffness: 65,
      suspensionDamping: 5.5,
      suspensionCompression: 4.8,
      maxSuspensionTravel: 0.14,
      rollInfluence: 0.08, // Very stiff flat cornering
      customSlidingRotationalSpeed: -40,
      frictionSlip: 3.8 // Ultra high grip slicks
    },

    engine: {
      maxEngineForce: 1100,
      maxBrakeForce: 70,
      maxReverseForce: 480,
      topSpeedKmH: 78,
      maxRpm: 18000,
      torqueCurveBias: 1.0
    },

    breakables: [
      { name: 'carbon_wing', breakImpulse: 16, relPos: [0, 0.28, -0.85], mass: 0.9 },
      { name: 'front_splitter', breakImpulse: 18, relPos: [0, -0.12, 0.95], mass: 1.1 },
      { name: 'left_mirror', breakImpulse: 12, relPos: [-0.46, 0.12, 0.25], mass: 0.2 },
      { name: 'right_mirror', breakImpulse: 12, relPos: [0.46, 0.12, 0.25], mass: 0.2 }
    ],

    description: 'Built for blistering track speeds with carbon aero diffusers, stiff coilover damping, and racing slick compounds. Nails apexes with surgical precision but requires smooth tarmac.'
  },

  DRIFT_MUSCLE: {
    id: 'drift_muscle',
    name: 'V8 Drift Savage',
    tagline: 'Rear-Wheel Drive Smoke Machine',
    category: 'Pro Drift Spec',
    color: '#ff1744', // Crimson Blood Red
    accentColor: '#ffea00',
    mass: 145,
    chassisDims: { width: 0.88, height: 0.38, length: 1.82 },
    wheelRadius: 0.18,
    wheelWidth: 0.16,
    wheelMass: 9,
    wheelBase: 1.18,
    trackWidth: 0.86,
    driveType: 'RWD', // Rear-wheel drive bias
    maxSteerVal: 0.72, // High steering lock angle for catching deep slides
    steerSpeed: 8.5,

    // Suspension settings - Tuned for oversteer & weight transition
    suspension: {
      suspensionRestLength: 0.24,
      suspensionStiffness: 42,
      suspensionDamping: 3.2,
      suspensionCompression: 3.5,
      maxSuspensionTravel: 0.18,
      rollInfluence: 0.22,
      customSlidingRotationalSpeed: -35,
      frictionSlip: 1.8 // Low lateral grip = slides easily into drifts!
    },

    engine: {
      maxEngineForce: 950,
      maxBrakeForce: 50,
      maxReverseForce: 420,
      topSpeedKmH: 64,
      maxRpm: 15500,
      torqueCurveBias: 1.5
    },

    breakables: [
      { name: 'ducktail_spoiler', breakImpulse: 18, relPos: [0, 0.24, -0.82], mass: 0.7 },
      { name: 'hood_scoop', breakImpulse: 20, relPos: [0, 0.18, 0.45], mass: 0.8 },
      { name: 'rear_bumper', breakImpulse: 22, relPos: [0, -0.05, -0.92], mass: 1.4 }
    ],

    description: 'A purpose-built drift missile featuring quick-angle steering hubs, welded differential RWD power, and low-friction competition compound tires designed to initiate high-angle power slides and vaporize rubber into clouds of smoke.'
  }
};
