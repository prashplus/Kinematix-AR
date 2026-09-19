import React, { useState, useRef } from 'react';
import { SimulatorCanvas } from './components/SimulatorCanvas';
import { TransmitterControls } from './components/TransmitterControls';
import { TelemetryHUD } from './components/TelemetryHUD';
import { InspectionOverlay } from './components/InspectionOverlay';
import { VehicleCarousel } from './components/VehicleCarousel';
import { VEHICLE_ARCHETYPES } from './vehicles/VehicleConfigs';
import { soundManager } from './audio/RCAudioEngine';
import { Volume2, VolumeX, HelpCircle } from 'lucide-react';

export function App() {
  const [vehicleId, setVehicleId] = useState('trophy_truck');
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
        backgroundColor: '#07090e'
      }}
    >
      {/* 3D WebGL / WebXR Simulation Canvas */}
      <SimulatorCanvas
        vehicleId={vehicleId}
        isInspectMode={isInspectMode}
        inputs={inputsRef}
        onTelemetryUpdate={setTelemetry}
        onARStateChange={setArState}
        propsAction={propsAction}
        resetPropsAction={() => setPropsAction(null)}
      />

      {/* Top Branding & Quick Audio Bar */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 20
      }}>
        <div className="glass-panel" style={{
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '900',
            letterSpacing: '0.15em',
            background: 'linear-gradient(90deg, #00e5ff, #2979ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase'
          }}>
            KINEMATIX AR
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {currentConfig.name}
          </span>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={handleToggleMute}
          className="btn-action glass-pill"
          style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX size={15} color="#ff1744" /> : <Volume2 size={15} color="#00e5ff" />}
        </button>

        {/* Controls Help */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="btn-action glass-pill"
          style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
          title="Controls Guide"
        >
          <HelpCircle size={15} color="#94a3b8" />
        </button>
      </div>

      {/* Telemetry Dashboard HUD */}
      <TelemetryHUD
        telemetry={telemetry}
        vehicleConfig={currentConfig}
        isInspectMode={isInspectMode}
      />

      {/* Inspection Mode & Prop Controls */}
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
      />

      {/* Dual Stick Virtual RC Transmitter */}
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
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>HOW TO PLAY</h3>
              <button onClick={() => setShowHelp(false)} className="btn-action glass-pill" style={{ width: '32px', height: '32px', padding: 0 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>
                <strong style={{ color: 'var(--accent-cyan)' }}>🎮 Driving Controls:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li><strong>W / Up Arrow:</strong> Throttle Forward</li>
                  <li><strong>S / Down Arrow:</strong> Brake & Reverse</li>
                  <li><strong>A / D / Left / Right:</strong> Proportional Steering</li>
                  <li><strong>Spacebar:</strong> Handbrake / Drift Initiate</li>
                  <li><strong>Mobile:</strong> Use the Dual-Stick on-screen transmitter</li>
                </ul>
              </div>

              <div>
                <strong style={{ color: 'var(--accent-green)' }}>💥 Damage & Physics:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li>Ram into concrete walls, ramps, or barrels to trigger <strong>real-time vertex dent crumpling</strong>.</li>
                  <li>Heavy impacts break off modular <strong>wings, bumpers, and scoops</strong> into dynamic physics pieces.</li>
                  <li>Click <strong>🔧 Repair</strong> to smoothly lerp sheet metal back to perfection.</li>
                </ul>
              </div>

              <div>
                <strong style={{ color: 'var(--accent-amber)' }}>📱 WebXR AR Mode:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li>On supported mobile devices (Android Chrome with ARCore over HTTPS), tap <strong>◈ Enter AR</strong>.</li>
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
