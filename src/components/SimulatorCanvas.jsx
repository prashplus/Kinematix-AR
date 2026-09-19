import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RaycastVehicleController } from '../physics/RaycastVehicleController';
import { ProceduralVehicleFactory } from '../vehicles/ProceduralVehicleFactory';
import { DamageManager } from '../vehicles/DamageManager';
import { ParticleSystem } from '../environment/ParticleSystem';
import { PropsManager } from '../environment/PropsManager';
import { XRManager } from '../xr/XRManager';
import { VEHICLE_ARCHETYPES } from '../vehicles/VehicleConfigs';
import { soundManager } from '../audio/RCAudioEngine';

/**
 * Kinematix AR - Simulator Canvas
 * Primary WebGL / WebXR rendering pipeline, physics loop,
 * chase/orbit camera controllers, and interaction coordinator.
 */
export const SimulatorCanvas = ({
  vehicleId,
  isInspectMode,
  inputs,
  onTelemetryUpdate,
  onARStateChange,
  propsAction,
  resetPropsAction
}) => {
  const containerRef = useRef(null);
  const sysRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    physicsWorld: null,
    vehicleController: null,
    vehicleVisuals: null,
    damageManager: null,
    particleSystem: null,
    propsManager: null,
    xrManager: null,
    dirLight: null,
    orbitAngles: { theta: 0.4, phi: 0.35, distance: 3.2 },
    isDragging: false,
    prevMouse: { x: 0, y: 0 },
    clock: new THREE.Clock()
  });

  // Track AR availability
  const [arSupported, setArSupported] = useState(false);

  // Initialize Scene, Physics, Renderer
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.05, 100);
    camera.position.set(0, 1.6, -3.2);

    // 3. Renderer with WebXR
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.xr.enabled = true;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lighting
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x111625, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    // Grid Floor for Non-XR mode
    const gridHelper = new THREE.GridHelper(40, 40, 0x00e5ff, 0x1e293b);
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);

    // 5. Physics World
    const physicsWorld = new PhysicsWorld();

    // 6. Particle System
    const particleSystem = new ParticleSystem(scene);

    // 7. Damage Manager
    const damageManager = new DamageManager(physicsWorld, scene, particleSystem, soundManager);

    // 8. Props Manager
    const propsManager = new PropsManager(scene, physicsWorld);

    // Default obstacles in Non-XR mode for immediate playground fun
    propsManager.spawnWall(new THREE.Vector3(0, 0, 7), 0);
    propsManager.spawnRamp(new THREE.Vector3(3, 0, 4), -Math.PI / 6);
    propsManager.spawnBarrelStack(new THREE.Vector3(-3, 0, 4));

    // 9. WebXR Manager
    const xrManager = new XRManager(renderer, scene, camera);
    xrManager.checkSupport().then((supp) => {
      setArSupported(supp);
      if (onARStateChange) onARStateChange({ supported: supp, active: false });
    });

    xrManager.onSessionStarted = () => {
      scene.background = null; // Transparent pass-through for camera feed
      gridHelper.visible = false;
      if (onARStateChange) onARStateChange({ supported: true, active: true });
    };

    xrManager.onSessionEnded = () => {
      scene.background = new THREE.Color(0x07090e);
      gridHelper.visible = true;
      if (onARStateChange) onARStateChange({ supported: true, active: false });
    };

    // Reticle tap in AR mode spawns / places car
    xrManager.onSelect = (hitPosition) => {
      if (sysRef.current.vehicleController) {
        sysRef.current.vehicleController.respawn([hitPosition.x, hitPosition.y + 0.3, hitPosition.z]);
      }
    };

    // Store references
    sysRef.current = {
      ...sysRef.current,
      scene,
      camera,
      renderer,
      physicsWorld,
      damageManager,
      particleSystem,
      propsManager,
      xrManager,
      dirLight,
      gridHelper
    };

    // Spawn Initial Vehicle
    spawnVehicle(vehicleId);

    // 10. Main Animation / Render Loop
    renderer.setAnimationLoop((timestamp, frame) => {
      const dt = Math.min(sysRef.current.clock.getDelta(), 0.05);

      // WebXR Update (hit-testing)
      if (renderer.xr.isPresenting && xrManager) {
        xrManager.update(frame);
      }

      // Physics Step (Skip when inspecting to freeze dynamic action)
      if (!isInspectMode && sysRef.current.vehicleController) {
        // Feed user controls
        const curInputs = inputs.current || { steer: 0, throttle: 0, handbrake: false };
        sysRef.current.vehicleController.updateInputs(
          curInputs.steer,
          curInputs.throttle,
          curInputs.handbrake,
          dt
        );

        physicsWorld.step(dt);

        // Sync Car Chassis Mesh
        const chassisBody = sysRef.current.vehicleController.chassisBody;
        const carRoot = sysRef.current.vehicleVisuals.rootGroup;
        carRoot.position.set(chassisBody.position.x, chassisBody.position.y, chassisBody.position.z);
        carRoot.quaternion.set(
          chassisBody.quaternion.x,
          chassisBody.quaternion.y,
          chassisBody.quaternion.z,
          chassisBody.quaternion.w
        );

        // Sync 4 Wheel Meshes directly from Cannon RaycastVehicle transforms
        const vehicle = sysRef.current.vehicleController.vehicle;
        const wheelMeshes = sysRef.current.vehicleVisuals.wheelMeshes;
        for (let i = 0; i < 4; i++) {
          vehicle.updateWheelTransform(i);
          const t = vehicle.wheelInfos[i].worldTransform;
          wheelMeshes[i].position.set(t.position.x, t.position.y, t.position.z);
          wheelMeshes[i].quaternion.set(t.quaternion.x, t.quaternion.y, t.quaternion.z, t.quaternion.w);

          // Emit tire burnout/drift smoke if slipping
          if (vehicle.wheelInfos[i].isInContact && Math.abs(vehicle.wheelInfos[i].skidInfo || 0) > 0.35) {
            particleSystem.spawnSmoke(wheelMeshes[i].position, 1);
          }
        }

        // Sync Directional Light target with vehicle
        dirLight.position.set(
          chassisBody.position.x + 5,
          chassisBody.position.y + 10,
          chassisBody.position.z + 5
        );
        dirLight.target.position.copy(chassisBody.position);
        dirLight.target.updateMatrixWorld();

        // Update Audio Telemetry
        soundManager.updateTelemetry(
          sysRef.current.vehicleController.rpm,
          curInputs.throttle,
          sysRef.current.vehicleController.lateralSlip
        );

        // Notify React Telemetry HUD
        if (onTelemetryUpdate) {
          onTelemetryUpdate({
            speedKmH: sysRef.current.vehicleController.speedKmH,
            rpm: sysRef.current.vehicleController.rpm,
            lateralSlip: sysRef.current.vehicleController.lateralSlip,
            suspensionCompression: sysRef.current.vehicleController.suspensionCompression
          });
        }
      }

      // Update Systems
      propsManager.update();
      damageManager.update(dt);
      particleSystem.update(dt);

      // Camera Positioning
      updateCamera(dt);

      renderer.render(scene, camera);
    });

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      xrManager.destroy();
      particleSystem.destroy();
      damageManager.destroy();
      propsManager.clearAll();
    };
  }, []);

  // Spawn or Switch Vehicle
  const spawnVehicle = (vId) => {
    const { scene, physicsWorld, damageManager } = sysRef.current;
    if (!scene || !physicsWorld) return;

    const config = VEHICLE_ARCHETYPES[vId.toUpperCase()] || Object.values(VEHICLE_ARCHETYPES)[0];

    // Remove existing vehicle
    if (sysRef.current.vehicleController) {
      sysRef.current.vehicleController.destroy();
    }
    if (sysRef.current.vehicleVisuals) {
      scene.remove(sysRef.current.vehicleVisuals.rootGroup);
      for (const wMesh of sysRef.current.vehicleVisuals.wheelMeshes) {
        scene.remove(wMesh);
      }
    }

    // 1. Build Physics Raycast Vehicle
    const controller = new RaycastVehicleController(physicsWorld, config, [0, 0.45, 0]);

    // 2. Build Procedural 3D Visuals
    const visuals = ProceduralVehicleFactory.createVehicle(config);
    scene.add(visuals.rootGroup);
    for (const wMesh of visuals.wheelMeshes) {
      scene.add(wMesh);
    }

    // 3. Connect Damage System
    damageManager.setVehicle(visuals.bodyMesh, visuals.breakableMeshes);
    controller.onCollision = (collisionData) => {
      damageManager.handleCollision(collisionData);
    };

    sysRef.current.vehicleController = controller;
    sysRef.current.vehicleVisuals = visuals;
  };

  // Update vehicle when vehicleId changes
  useEffect(() => {
    if (sysRef.current.scene) {
      spawnVehicle(vehicleId);
    }
  }, [vehicleId]);

  // Handle external props actions
  useEffect(() => {
    if (!propsAction || !sysRef.current.propsManager) return;
    const { type } = propsAction;
    const carPos = sysRef.current.vehicleController
      ? sysRef.current.vehicleController.chassisBody.position
      : new THREE.Vector3(0, 0, 0);

    const spawnPos = new THREE.Vector3(carPos.x, 0, carPos.z + 2.5);

    if (type === 'wall') {
      sysRef.current.propsManager.spawnWall(spawnPos, 0);
    } else if (type === 'ramp') {
      sysRef.current.propsManager.spawnRamp(spawnPos, 0);
    } else if (type === 'barrels') {
      sysRef.current.propsManager.spawnBarrelStack(spawnPos);
    } else if (type === 'clear') {
      sysRef.current.propsManager.clearAll();
    } else if (type === 'repair') {
      sysRef.current.damageManager.startRepair();
    } else if (type === 'respawn') {
      if (sysRef.current.vehicleController) {
        sysRef.current.vehicleController.respawn();
      }
    } else if (type === 'toggle_ar') {
      const xr = sysRef.current.xrManager;
      if (xr) {
        if (xr.session) {
          xr.endARSession();
        } else {
          xr.startARSession(containerRef.current.parentElement);
        }
      }
    }
    resetPropsAction();
  }, [propsAction]);

  // Camera Controller
  const updateCamera = (dt) => {
    const { camera, vehicleController, renderer, orbitAngles } = sysRef.current;
    if (!camera || !vehicleController) return;

    // In WebXR presenting mode, camera pose is controlled natively by the device
    if (renderer.xr.isPresenting) return;

    const carPos = vehicleController.chassisBody.position;
    const targetLook = new THREE.Vector3(carPos.x, carPos.y + 0.25, carPos.z);

    if (isInspectMode) {
      // 360° Orbit Inspection Camera around the stationary car
      const x = carPos.x + orbitAngles.distance * Math.sin(orbitAngles.theta) * Math.cos(orbitAngles.phi);
      const y = carPos.y + 0.3 + orbitAngles.distance * Math.sin(orbitAngles.phi);
      const z = carPos.z + orbitAngles.distance * Math.cos(orbitAngles.theta) * Math.cos(orbitAngles.phi);

      camera.position.lerp(new THREE.Vector3(x, Math.max(0.2, y), z), dt * 6.0);
      camera.lookAt(targetLook);
    } else {
      // Third-Person Smooth Chase Camera
      // Calculate position behind the car relative to its yaw
      const forwardVec = new THREE.Vector3(0, 0, 1);
      const carQuat = new THREE.Quaternion(
        vehicleController.chassisBody.quaternion.x,
        vehicleController.chassisBody.quaternion.y,
        vehicleController.chassisBody.quaternion.z,
        vehicleController.chassisBody.quaternion.w
      );
      forwardVec.applyQuaternion(carQuat);

      const chaseDist = 2.8;
      const chaseHeight = 1.25;
      const targetCamPos = new THREE.Vector3(
        carPos.x - forwardVec.x * chaseDist,
        carPos.y + chaseHeight,
        carPos.z - forwardVec.z * chaseDist
      );

      camera.position.lerp(targetCamPos, dt * 5.5);
      camera.lookAt(new THREE.Vector3(carPos.x + forwardVec.x * 1.5, carPos.y + 0.2, carPos.z + forwardVec.z * 1.5));
    }
  };

  // Mouse / Touch Orbit Controls for Inspection Mode
  const handlePointerDown = (e) => {
    soundManager.resume();
    sysRef.current.isDragging = true;
    sysRef.current.prevMouse = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!sysRef.current.isDragging || !isInspectMode) return;
    const dx = e.clientX - sysRef.current.prevMouse.x;
    const dy = e.clientY - sysRef.current.prevMouse.y;
    sysRef.current.prevMouse = { x: e.clientX, y: e.clientY };

    sysRef.current.orbitAngles.theta -= dx * 0.008;
    sysRef.current.orbitAngles.phi = THREE.MathUtils.clamp(
      sysRef.current.orbitAngles.phi + dy * 0.008,
      0.05,
      Math.PI / 2.2
    );
  };

  const handlePointerUp = () => {
    sysRef.current.isDragging = false;
  };

  const handleWheel = (e) => {
    if (!isInspectMode) return;
    sysRef.current.orbitAngles.distance = THREE.MathUtils.clamp(
      sysRef.current.orbitAngles.distance + e.deltaY * 0.003,
      1.2,
      7.0
    );
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        touchAction: 'none',
        cursor: isInspectMode ? 'grab' : 'default'
      }}
    />
  );
};
