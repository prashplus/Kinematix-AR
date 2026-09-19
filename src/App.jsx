import React, { useState, useEffect, useRef } from 'react';
import { SimulatorCanvas } from './components/SimulatorCanvas';
import { TransmitterControls } from './components/TransmitterControls';
import { TelemetryHUD } from './components/TelemetryHUD';
import { InspectionOverlay } from './components/InspectionOverlay';
import { VehicleCarousel } from './components/VehicleCarousel';
import { VEHICLE_ARCHETYPES } from './vehicles/VehicleConfigs';
import { soundManager } from './audio/RCAudioEngine';

export function App() {
  const [theme, setTheme] = useState('light');
  const [vehicleId, setVehicleId] = useState('trophy_truck');
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Sync data-theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    soundManager.playClick();
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const [telemetry, setTelemetry] = useState({
    speedKmH: 0,
    rpm: 1200,
    lateralSlip: 0,
    suspensionCompression: [0, 0, 0, 0]
  });

  const [arState, setArState] = useState({ supported: false, active: false });
  const [propsAction, setPropsAction] = useState(null);

  // Mutable inputs ref to minimize unnecessary re-renders in physics loop
  const inputsRef = useRef({ steer: 0, throttle: 0, handbrake: false });

  const handleInputChange = (newInputs) => {
    inputsRef.current = newInputs;
  };

  const currentConfig = VEHICLE_ARCHETYPES[vehicleId.toUpperCase()] || VEHICLE_ARCHETYPES.TROPHY_TRUCK;

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div
      onClick={() => soundManager.resume()}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-color)'
      }}
    >
      {/* 3D WebGL / WebXR Simulation Canvas */}
      <SimulatorCanvas
        vehicleId={vehicleId}
        isInspectMode={isInspectMode}
        inputs={inputsRef}
        theme={theme}
        onTelemetryUpdate={setTelemetry}
        onARStateChange={setArState}
        propsAction={propsAction}
        resetPropsAction={() => setPropsAction(null)}
      />

      {/* Unified Responsive Top Navigation Bar */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        pointerEvents: 'none',
        zIndex: 40
      }}>
        {/* Left: Compact Telemetry HUD */}
        <TelemetryHUD
          telemetry={telemetry}
          vehicleConfig={currentConfig}
          isInspectMode={isInspectMode}
        />

        {/* Right: Actions, AR, Garage, and Collapsible Tools Drawer */}
        <InspectionOverlay
          isInspectMode={isInspectMode}
          onToggleInspect={() => setIsInspectMode(!isInspectMode)}
          onRepairCar={() => setPropsAction({ type: 'repair' })}
          onRespawnCar={() => setPropsAction({ type: 'respawn' })}
          onOpenCarousel={() => setIsCarouselOpen(true)}
          onSpawnWall={() => setPropsAction({ type: 'wall' })}
          onSpawnRamp={() => setPropsAction({ type: 'ramp' })}
          onSpawnBarrels={() => setPropsAction({ type: 'barrels' })}
          onClearProps={() => setPropsAction({ type: 'clear' })}
          isARActive={arState.active}
          onToggleAR={() => setPropsAction({ type: 'toggle_ar' })}
          theme={theme}
          onToggleTheme={toggleTheme}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenHelp={() => setShowHelp(true)}
        />
      </div>

      {/* Dual Stick Virtual RC Transmitter (PointerCapture Multi-Touch) */}
      <TransmitterControls
        onInputChange={handleInputChange}
        isInspectMode={isInspectMode}
      />

      {/* Vehicle Roster Modal */}
      <VehicleCarousel
        currentVehicleId={vehicleId}
        onSelectVehicle={(id) => {
          setVehicleId(id);
          setIsCarouselOpen(false);
        }}
        isVisible={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
      />

      {/* Help Modal */}
      {showHelp && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>HOW TO PLAY</h3>
              <button onClick={() => setShowHelp(false)} className="btn-action glass-pill" style={{ width: '32px', height: '32px', padding: 0 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>
                <strong style={{ color: 'var(--accent-cyan)' }}>🎮 Driving Controls:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li><strong>Left Joystick:</strong> Proportional steering left / right.</li>
                  <li><strong>Right Slider:</strong> Hold/drag upper half for <strong>FORWARD</strong>, hold/drag lower half for <strong>REVERSE/BRAKE</strong>.</li>
                  <li><strong>Desktop Keys:</strong> <code>W</code> / <code>S</code> / <code>A</code> / <code>D</code> or Arrow Keys, <code>Space</code> for E-Brake.</li>
                </ul>
              </div>

              <div>
                <strong style={{ color: 'var(--accent-green)' }}>💥 Damage & Physics:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li>Ram into concrete walls, ramps, or barrels to trigger <strong>real-time vertex dent crumpling</strong>.</li>
                  <li>Heavy impacts break off modular <strong>wings, bumpers, and scoops</strong> into dynamic physics pieces.</li>
                  <li>Click <strong>🔧 Repair</strong> in the Tools drawer to smoothly lerp sheet metal back to perfection.</li>
                </ul>
              </div>

              <div>
                <strong style={{ color: 'var(--accent-amber)' }}>📱 WebXR AR Mode:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li>Tap <strong>◈ Enter AR</strong> on supported mobile devices.</li>
                  <li>Point your camera at a floor or tabletop until the holographic reticle locks on, then tap to place your RC car!</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="btn-action btn-primary"
              style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '10px' }}
            >
              Got It, Let's Drive!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
