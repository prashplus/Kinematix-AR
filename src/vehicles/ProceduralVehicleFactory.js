import * as THREE from 'three';

/**
 * Kinematix AR - Procedural Vehicle Factory
 * Generates detailed 3D models with PBR materials, wheels with brake calipers,
 * roll cages, lights, and modular breakable components.
 */
export class ProceduralVehicleFactory {
  /**
   * Builds the Three.js root object for the specified vehicle archetype
   * @param {Object} config - Vehicle archetype configuration
   * @returns {Object} { rootGroup, bodyMesh, wheelMeshes, breakableMeshes }
   */
  static createVehicle(config) {
    const rootGroup = new THREE.Group();
    rootGroup.name = `vehicle_${config.id}`;

    // Common PBR Materials
    const paintMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.color),
      metalness: 0.75,
      roughness: 0.22,
      envMapIntensity: 1.5
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.accentColor || '#ffffff'),
      metalness: 0.85,
      roughness: 0.25
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x111114,
      metalness: 0.3,
      roughness: 0.4
    });

    const darkTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e222d,
      roughness: 0.6,
      metalness: 0.2
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.82
    });

    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xecfeff,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });

    const taillightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0xff1744,
      emissiveIntensity: 2.0,
      roughness: 0.2
    });

    // 1. Construct Archetype-Specific Body Mesh
    let bodyMesh = null;
    const breakableMeshes = [];

    if (config.id === 'trophy_truck') {
      const truck = this.buildTrophyTruckBody(config, paintMaterial, darkTrimMaterial, glassMaterial, headlightMaterial, taillightMaterial);
      bodyMesh = truck.bodyMesh;
      breakableMeshes.push(...truck.breakables);
      rootGroup.add(truck.group);
    } else if (config.id === 'gt_supercar') {
      const supercar = this.buildGTSupercarBody(config, paintMaterial, carbonMaterial, glassMaterial, headlightMaterial, taillightMaterial);
      bodyMesh = supercar.bodyMesh;
      breakableMeshes.push(...supercar.breakables);
      rootGroup.add(supercar.group);
    } else {
      // Drift Muscle Spec
      const drift = this.buildDriftMuscleBody(config, paintMaterial, accentMaterial, carbonMaterial, glassMaterial, headlightMaterial, taillightMaterial);
      bodyMesh = drift.bodyMesh;
      breakableMeshes.push(...drift.breakables);
      rootGroup.add(drift.group);
    }

    // Cache original vertex positions for crumple deformation & smooth repair
    if (bodyMesh && bodyMesh.geometry) {
      const posAttr = bodyMesh.geometry.attributes.position;
      bodyMesh.userData.originalPositions = new Float32Array(posAttr.array);
      bodyMesh.userData.currentPositions = new Float32Array(posAttr.array);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
    }

    // 2. Build 4 Wheels (FL, FR, RL, RR)
    const wheelMeshes = [];
    for (let i = 0; i < 4; i++) {
      const isFront = i < 2;
      const isRight = i % 2 === 1;
      const wheelGroup = this.buildWheel(config, isFront, isRight);
      wheelMeshes.push(wheelGroup);
      rootGroup.add(wheelGroup);
    }

    return {
      rootGroup,
      bodyMesh,
      wheelMeshes,
      breakableMeshes
    };
  }

  /**
   * Build Baja Trophy Truck 3D body & breakable parts
   */
  static buildTrophyTruckBody(config, paintMat, trimMat, glassMat, headMat, tailMat) {
    const group = new THREE.Group();
    const breakables = [];

    // Main Trophy Truck Cab & Bed (BufferGeometry)
    const bodyGeom = new THREE.BoxGeometry(0.82, 0.44, 1.7, 16, 12, 24);
    // Custom taper to shape hood and truck bed
    const pos = bodyGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const z = pos.getZ(i);
      let x = pos.getX(i);

      // Taper front nose
      if (z > 0.5) {
        pos.setX(i, x * 0.9);
        if (y > 0.05) pos.setY(i, y * 0.8);
      }
      // Cut truck bed behind cab
      if (z < -0.1 && y > 0.02) {
        pos.setY(i, y * 0.4 - 0.05);
      }
    }
    bodyGeom.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(bodyGeom, paintMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Cab Glass Windshield & Windows
    const cabGeom = new THREE.BoxGeometry(0.74, 0.28, 0.65, 8, 4, 8);
    const cabMesh = new THREE.Mesh(cabGeom, glassMat);
    cabMesh.position.set(0, 0.24, 0.15);
    group.add(cabMesh);

    // Tubular Roll Cage
    const cageMat = new THREE.MeshStandardMaterial({ color: 0x22262d, metalness: 0.9, roughness: 0.3 });
    const cageBar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), cageMat);
    cageBar1.rotation.x = Math.PI / 4;
    cageBar1.position.set(0.32, 0.22, -0.3);
    group.add(cageBar1);

    const cageBar2 = cageBar1.clone();
    cageBar2.position.set(-0.32, 0.22, -0.3);
    group.add(cageBar2);

    // Headlights (Dual round Baja pods)
    const lightGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
    lightGeom.rotateX(Math.PI / 2);
    const hl1 = new THREE.Mesh(lightGeom, headMat);
    hl1.position.set(0.28, 0.06, 0.85);
    group.add(hl1);
    const hl2 = hl1.clone();
    hl2.position.set(-0.28, 0.06, 0.85);
    group.add(hl2);

    // Taillights
    const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.03), tailMat);
    tl1.position.set(0.34, 0.05, -0.85);
    group.add(tl1);
    const tl2 = tl1.clone();
    tl2.position.set(-0.34, 0.05, -0.85);
    group.add(tl2);

    // BREAKABLE 1: Roof LED Lightbar
    const lightbarGeom = new THREE.BoxGeometry(0.68, 0.06, 0.08);
    const lightbarMesh = new THREE.Mesh(lightbarGeom, headMat);
    lightbarMesh.name = 'roof_lightbar';
    lightbarMesh.position.set(0, 0.42, 0.1);
    lightbarMesh.userData = {
      isBreakable: true,
      breakImpulse: 20,
      mass: 0.8,
      name: 'Roof Lightbar'
    };
    lightbarMesh.castShadow = true;
    group.add(lightbarMesh);
    breakables.push(lightbarMesh);

    // BREAKABLE 2: Spare Tire mounted in rear bed
    const spareGeom = new THREE.CylinderGeometry(0.20, 0.20, 0.14, 16);
    spareGeom.rotateZ(Math.PI / 2);
    const spareMesh = new THREE.Mesh(spareGeom, trimMat);
    spareMesh.name = 'spare_tire';
    spareMesh.position.set(0, 0.18, -0.62);
    spareMesh.rotation.x = -Math.PI / 6;
    spareMesh.userData = {
      isBreakable: true,
      breakImpulse: 26,
      mass: 2.2,
      name: 'Spare Offroad Tire'
    };
    spareMesh.castShadow = true;
    group.add(spareMesh);
    breakables.push(spareMesh);

    // BREAKABLE 3: Heavy Duty Baja Front Steel Bumper
    const bumperGeom = new THREE.BoxGeometry(0.88, 0.08, 0.12);
    const bumperMesh = new THREE.Mesh(bumperGeom, cageMat);
    bumperMesh.name = 'front_bumper';
    bumperMesh.position.set(0, -0.08, 0.9);
    bumperMesh.userData = {
      isBreakable: true,
      breakImpulse: 24,
      mass: 1.5,
      name: 'Steel Front Skid Bumper'
    };
    bumperMesh.castShadow = true;
    group.add(bumperMesh);
    breakables.push(bumperMesh);

    return { group, bodyMesh, breakables };
  }

  /**
   * Build GT Supercar 3D body & aerodynamic breakables
   */
  static buildGTSupercarBody(config, paintMat, carbonMat, glassMat, headMat, tailMat) {
    const group = new THREE.Group();
    const breakables = [];

    // Low-slung aerodynamic chassis body
    const bodyGeom = new THREE.BoxGeometry(0.84, 0.28, 1.82, 18, 10, 24);
    const pos = bodyGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const z = pos.getZ(i);
      let x = pos.getX(i);

      // Low wedge slope at nose
      if (z > 0.2) {
        const factor = (z - 0.2) / 0.7;
        pos.setY(i, y * (1 - factor * 0.45) - factor * 0.05);
        pos.setX(i, x * (1 - factor * 0.15));
      }
      // Rear diffuser narrowing
      if (z < -0.3) {
        const rearFactor = (-0.3 - z) / 0.6;
        pos.setX(i, x * (1 - rearFactor * 0.1));
        if (y < 0) pos.setY(i, y + rearFactor * 0.06);
      }
    }
    bodyGeom.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(bodyGeom, paintMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Aerodynamic Teardrop Cockpit Canopy
    const canopyGeom = new THREE.BoxGeometry(0.68, 0.20, 0.85, 10, 6, 12);
    const canPos = canopyGeom.attributes.position;
    for (let i = 0; i < canPos.count; i++) {
      const y = canPos.getY(i);
      const z = canPos.getZ(i);
      if (y > 0.02) {
        canPos.setX(i, canPos.getX(i) * 0.82);
      }
      if (z > 0.2) {
        canPos.setY(i, y * 0.7);
      }
    }
    canopyGeom.computeVertexNormals();
    const canopyMesh = new THREE.Mesh(canopyGeom, glassMat);
    canopyMesh.position.set(0, 0.18, 0.05);
    group.add(canopyMesh);

    // Sleek LED blade headlights
    const hlGeom = new THREE.BoxGeometry(0.18, 0.03, 0.12);
    hlGeom.rotateY(-0.25);
    const hl1 = new THREE.Mesh(hlGeom, headMat);
    hl1.position.set(0.31, 0.05, 0.82);
    group.add(hl1);
    const hl2 = new THREE.Mesh(hlGeom, headMat);
    hl2.rotation.y = 0.25;
    hl2.position.set(-0.31, 0.05, 0.82);
    group.add(hl2);

    // Full-width continuous taillight bar
    const tlGeom = new THREE.BoxGeometry(0.74, 0.04, 0.04);
    const tlMesh = new THREE.Mesh(tlGeom, tailMat);
    tlMesh.position.set(0, 0.06, -0.91);
    group.add(tlMesh);

    // BREAKABLE 1: High Downforce Carbon Rear Wing
    const wingGroup = new THREE.Group();
    wingGroup.name = 'carbon_wing';
    const mainFoil = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.025, 0.18), carbonMat);
    mainFoil.position.y = 0.22;
    wingGroup.add(mainFoil);
    const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.20), carbonMat);
    endplateL.position.set(-0.43, 0.22, 0);
    wingGroup.add(endplateL);
    const endplateR = endplateL.clone();
    endplateR.position.set(0.43, 0.22, 0);
    wingGroup.add(endplateR);
    const strutL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.20), carbonMat);
    strutL.position.set(-0.25, 0.11, 0);
    wingGroup.add(strutL);
    const strutR = strutL.clone();
    strutR.position.set(0.25, 0.11, 0);
    wingGroup.add(strutR);

    wingGroup.position.set(0, 0.08, -0.84);
    wingGroup.userData = {
      isBreakable: true,
      breakImpulse: 15,
      mass: 0.9,
      name: 'GT Carbon Aero Wing'
    };
    group.add(wingGroup);
    breakables.push(wingGroup);

    // BREAKABLE 2: Carbon Front Splitter
    const splitterGeom = new THREE.BoxGeometry(0.88, 0.025, 0.24);
    const splitterMesh = new THREE.Mesh(splitterGeom, carbonMat);
    splitterMesh.name = 'front_splitter';
    splitterMesh.position.set(0, -0.12, 0.90);
    splitterMesh.userData = {
      isBreakable: true,
      breakImpulse: 18,
      mass: 1.1,
      name: 'Front Carbon Splitter'
    };
    splitterMesh.castShadow = true;
    group.add(splitterMesh);
    breakables.push(splitterMesh);

    // BREAKABLE 3 & 4: Left & Right Aero Mirrors
    const mirrorGeom = new THREE.BoxGeometry(0.08, 0.04, 0.12);
    const mirrorL = new THREE.Mesh(mirrorGeom, carbonMat);
    mirrorL.name = 'left_mirror';
    mirrorL.position.set(-0.44, 0.12, 0.28);
    mirrorL.userData = { isBreakable: true, breakImpulse: 12, mass: 0.2, name: 'Left Mirror' };
    group.add(mirrorL);
    breakables.push(mirrorL);

    const mirrorR = mirrorL.clone();
    mirrorR.name = 'right_mirror';
    mirrorR.position.set(0.44, 0.12, 0.28);
    mirrorR.userData = { isBreakable: true, breakImpulse: 12, mass: 0.2, name: 'Right Mirror' };
    group.add(mirrorR);
    breakables.push(mirrorR);

    return { group, bodyMesh, breakables };
  }

  /**
   * Build Drift Muscle Car 3D body & breakables
   */
  static buildDriftMuscleBody(config, paintMat, accentMat, carbonMat, glassMat, headMat, tailMat) {
    const group = new THREE.Group();
    const breakables = [];

    // Aggressive muscular stance with flared wheel arches
    const bodyGeom = new THREE.BoxGeometry(0.86, 0.36, 1.82, 16, 10, 24);
    const pos = bodyGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const x = pos.getX(i);

      // Flared rear quarter panels
      if (z < -0.2 && z > -0.7) {
        pos.setX(i, x * 1.08);
      }
      // Sharper muscle front nose
      if (z > 0.6) {
        if (y < 0) pos.setY(i, y * 0.9);
      }
    }
    bodyGeom.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(bodyGeom, paintMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Fastback Greenhouse Glass
    const glassGeom = new THREE.BoxGeometry(0.72, 0.24, 0.88, 8, 4, 10);
    const gPos = glassGeom.attributes.position;
    for (let i = 0; i < gPos.count; i++) {
      if (gPos.getY(i) > 0.05) gPos.setX(i, gPos.getX(i) * 0.86);
      if (gPos.getZ(i) < -0.1) gPos.setY(i, gPos.getY(i) * 0.7);
    }
    glassGeom.computeVertexNormals();
    const glassMesh = new THREE.Mesh(glassGeom, glassMat);
    glassMesh.position.set(0, 0.22, -0.05);
    group.add(glassMesh);

    // Dual Quad Headlights
    const hlGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16);
    hlGeom.rotateX(Math.PI / 2);
    [-0.32, -0.21, 0.21, 0.32].forEach((xPos, idx) => {
      const hl = new THREE.Mesh(hlGeom, headMat);
      hl.position.set(xPos, 0.05, 0.91);
      group.add(hl);
    });

    // Classic 3-bar Taillights
    const tlGeom = new THREE.BoxGeometry(0.08, 0.12, 0.03);
    [-0.32, -0.22, 0.22, 0.32].forEach((xPos) => {
      const tl = new THREE.Mesh(tlGeom, tailMat);
      tl.position.set(xPos, 0.05, -0.91);
      group.add(tl);
    });

    // BREAKABLE 1: Massive Blower / Shaker Hood Scoop
    const scoopGeom = new THREE.BoxGeometry(0.32, 0.14, 0.42);
    const scoopMesh = new THREE.Mesh(scoopGeom, carbonMat);
    scoopMesh.name = 'hood_scoop';
    scoopMesh.position.set(0, 0.22, 0.46);
    scoopMesh.userData = {
      isBreakable: true,
      breakImpulse: 20,
      mass: 0.8,
      name: 'V8 Supercharger Hood Scoop'
    };
    scoopMesh.castShadow = true;
    group.add(scoopMesh);
    breakables.push(scoopMesh);

    // BREAKABLE 2: Riveted Ducktail Drift Spoiler
    const ducktailGeom = new THREE.BoxGeometry(0.82, 0.10, 0.08);
    ducktailGeom.rotateX(Math.PI / 6);
    const ducktailMesh = new THREE.Mesh(ducktailGeom, carbonMat);
    ducktailMesh.name = 'ducktail_spoiler';
    ducktailMesh.position.set(0, 0.21, -0.87);
    ducktailMesh.userData = {
      isBreakable: true,
      breakImpulse: 17,
      mass: 0.7,
      name: 'Drift Ducktail Spoiler'
    };
    ducktailMesh.castShadow = true;
    group.add(ducktailMesh);
    breakables.push(ducktailMesh);

    // BREAKABLE 3: Rear Bash Bar / Diffuser
    const bashBarGeom = new THREE.BoxGeometry(0.84, 0.06, 0.08);
    const bashBarMesh = new THREE.Mesh(bashBarGeom, accentMat);
    bashBarMesh.name = 'rear_bumper';
    bashBarMesh.position.set(0, -0.06, -0.92);
    bashBarMesh.userData = {
      isBreakable: true,
      breakImpulse: 22,
      mass: 1.4,
      name: 'Rear Drift Bash Bar'
    };
    group.add(bashBarMesh);
    breakables.push(bashBarMesh);

    return { group, bodyMesh, breakables };
  }

  /**
   * Builds a detailed wheel with rubber tire, rim spokes, brake disc & red caliper
   */
  static buildWheel(config, isFront, isRight) {
    const wheelGroup = new THREE.Group();
    const { wheelRadius, wheelWidth } = config;

    // Outer Rubber Tire
    const tireGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    tireGeom.rotateZ(Math.PI / 2);

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.85,
      metalness: 0.1
    });
    const tireMesh = new THREE.Mesh(tireGeom, tireMaterial);
    tireMesh.castShadow = true;
    wheelGroup.add(tireMesh);

    // Metallic Alloy Rim
    const rimGeom = new THREE.CylinderGeometry(wheelRadius * 0.7, wheelRadius * 0.7, wheelWidth + 0.005, 18);
    rimGeom.rotateZ(Math.PI / 2);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.2
    });
    const rimMesh = new THREE.Mesh(rimGeom, rimMaterial);
    wheelGroup.add(rimMesh);

    // Deep center hub nut
    const hubNutGeom = new THREE.CylinderGeometry(wheelRadius * 0.22, wheelRadius * 0.22, wheelWidth + 0.015, 6);
    hubNutGeom.rotateZ(Math.PI / 2);
    const hubNut = new THREE.Mesh(hubNutGeom, new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.9, roughness: 0.3 }));
    wheelGroup.add(hubNut);

    // Brake Disc (Rotor)
    const discGeom = new THREE.CylinderGeometry(wheelRadius * 0.62, wheelRadius * 0.62, 0.02, 16);
    discGeom.rotateZ(Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x999999,
      metalness: 0.95,
      roughness: 0.15
    });
    const discMesh = new THREE.Mesh(discGeom, discMat);
    wheelGroup.add(discMesh);

    // High Performance Brake Caliper (Brembo Red)
    const caliperGeom = new THREE.BoxGeometry(0.04, wheelRadius * 0.45, 0.08);
    const caliperMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      metalness: 0.6,
      roughness: 0.3
    });
    const caliperMesh = new THREE.Mesh(caliperGeom, caliperMat);
    // Position caliper near the top-front of the wheel
    const sideSign = isRight ? -1 : 1;
    caliperMesh.position.set(0, wheelRadius * 0.3, 0.04 * sideSign);
    wheelGroup.add(caliperMesh);

    return wheelGroup;
  }
}
