import * as THREE from 'three';

/**
 * Kinematix AR - WebXR & Session Manager
 * Handles WebXR immersive-ar session request, hit-test source for plane detection,
 * placement reticle tracking, and ground shadow receiver.
 */
export class XRManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.isSupported = false;
    this.session = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;

    // Reticle
    this.reticle = null;
    this.reticleVisible = false;
    this.reticleMatrix = new THREE.Matrix4();

    // Shadow Plane for AR
    this.shadowPlane = null;

    // Callbacks
    this.onSessionStarted = null;
    this.onSessionEnded = null;
    this.onSelect = null;

    this.checkSupport();
    this.createReticle();
    this.createShadowPlane();
  }

  async checkSupport() {
    if ('xr' in navigator) {
      try {
        this.isSupported = await navigator.xr.isSessionSupported('immersive-ar');
      } catch (e) {
        console.warn('WebXR AR support check error:', e);
        this.isSupported = false;
      }
    }
    return this.isSupported;
  }

  createReticle() {
    // Elegant glowing holographic placement ring
    const ringGeom = new THREE.RingGeometry(0.18, 0.22, 32);
    ringGeom.rotateX(-Math.PI / 2);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    this.reticle = new THREE.Mesh(ringGeom, ringMat);

    // Inner dot
    const dotGeom = new THREE.CircleGeometry(0.04, 16);
    dotGeom.rotateX(-Math.PI / 2);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const dot = new THREE.Mesh(dotGeom, dotMat);
    this.reticle.add(dot);

    // 4 Corner alignment tick marks
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    for (let i = 0; i < 4; i++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.002, 0.08), tickMat);
      const angle = (i * Math.PI) / 2;
      tick.position.set(Math.cos(angle) * 0.27, 0, Math.sin(angle) * 0.27);
      tick.rotation.y = -angle;
      this.reticle.add(tick);
    }

    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);
  }

  createShadowPlane() {
    // Large invisible shadow catcher plane receiving vehicle shadows in AR
    const geom = new THREE.PlaneGeometry(50, 50);
    geom.rotateX(-Math.PI / 2);

    const mat = new THREE.ShadowMaterial({
      opacity: 0.45
    });

    this.shadowPlane = new THREE.Mesh(geom, mat);
    this.shadowPlane.receiveShadow = true;
    this.shadowPlane.position.y = 0;
    this.scene.add(this.shadowPlane);
  }

  /**
   * Request WebXR Immersive-AR session
   */
  async startARSession(domOverlayElement = null) {
    if (!('xr' in navigator)) {
      throw new Error('WebXR not available in this browser');
    }

    const sessionInit = {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'local-floor', 'light-estimation'],
      ...(domOverlayElement && { domOverlay: { root: domOverlayElement } })
    };

    const session = await navigator.xr.requestSession('immersive-ar', sessionInit);
    this.session = session;

    this.renderer.xr.setReferenceSpaceType('local');
    await this.renderer.xr.setSession(session);

    session.addEventListener('select', (event) => {
      if (this.reticleVisible && this.onSelect) {
        const pos = new THREE.Vector3();
        pos.setFromMatrixPosition(this.reticle.matrix);
        this.onSelect(pos);
      }
    });

    session.addEventListener('end', () => {
      this.session = null;
      this.hitTestSource = null;
      this.hitTestSourceRequested = false;
      this.reticle.visible = false;
      if (this.onSessionEnded) this.onSessionEnded();
    });

    if (this.onSessionStarted) this.onSessionStarted();
    return session;
  }

  /**
   * End WebXR session
   */
  async endARSession() {
    if (this.session) {
      await this.session.end();
    }
  }

  /**
   * Called in renderer animation loop to query hit-test results
   */
  update(frame) {
    if (!this.session || !frame) return;

    const referenceSpace = this.renderer.xr.getReferenceSpace();

    // 1. Request hit test source once session reference space is active
    if (!this.hitTestSourceRequested) {
      this.session.requestReferenceSpace('viewer').then((viewerSpace) => {
        this.session.requestHitTestSource({ space: viewerSpace }).then((source) => {
          this.hitTestSource = source;
        });
      });
      this.session.addEventListener('end', () => {
        this.hitTestSourceRequested = false;
        this.hitTestSource = null;
      });
      this.hitTestSourceRequested = true;
    }

    // 2. Process Hit Test Results
    if (this.hitTestSource) {
      const hitTestResults = frame.getHitTestResults(this.hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        if (pose) {
          this.reticle.visible = true;
          this.reticleVisible = true;
          this.reticle.matrix.fromArray(pose.transform.matrix);
          this.reticleMatrix.copy(this.reticle.matrix);

          // Align shadow plane with detected real floor height
          if (this.shadowPlane) {
            this.shadowPlane.position.y = pose.transform.position.y;
          }
        }
      } else {
        this.reticle.visible = false;
        this.reticleVisible = false;
      }
    }
  }

  destroy() {
    if (this.reticle) this.scene.remove(this.reticle);
    if (this.shadowPlane) this.scene.remove(this.shadowPlane);
  }
}
