import React, { useState } from 'react';

/**
 * Kinematix AR - Telemetry HUD
 * Real-time dynamic dashboard showing Speedometer, Brushless RPM,
 * 4-wheel suspension travel bars, and lateral drift slip gauge.
 */
export const TelemetryHUD = ({ telemetry, vehicleConfig, isInspectMode }) => {
  const [useMph, setUseMph] = useState(false);

  if (isInspectMode) return null;

  const {
    speedKmH = 0,
    rpm = 1200,
    lateralSlip = 0,
    suspensionCompression = [0, 0, 0, 0]
  } = telemetry || {};

  const displaySpeed = useMph ? (speedKmH * 0.621371).toFixed(1) : speedKmH.toFixed(1);
  const speedUnit = useMph ? 'MPH' : 'KM/H';

  const rpmPercent = Math.min(100, Math.round((rpm / (vehicleConfig.engine.maxRpm || 15000)) * 100));
  const slipPercent = Math.min(100, Math.round(lateralSlip * 100));

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
      zIndex: 15,
      fontFamily: 'var(--font-mono)'
    }}>
      {/* Primary Speed & RPM Cluster */}
      <div className="glass-panel" style={{
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        borderLeft: '4px solid var(--accent-cyan)'
      }}>
        {/* Speedometer */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{
              fontSize: '32px',
              fontWeight: '900',
              color: '#ffffff',
              lineHeight: '1',
              fontFamily: 'var(--font-main)'
            }}>
              {displaySpeed}
            </span>
            <span
              onClick={() => setUseMph(!useMph)}
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              {speedUnit}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {vehicleConfig.driveType} DRIVE
          </span>
        </div>

        {/* Brushless Electric Motor RPM Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>BLDC RPM</span>
            <span style={{ color: rpmPercent > 80 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: '700' }}>
              {Math.round(rpm)}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${rpmPercent}%`,
              height: '100%',
              background: rpmPercent > 80
                ? 'linear-gradient(90deg, #00e5ff, #ff1744)'
                : 'linear-gradient(90deg, #00e5ff, #00e676)',
              transition: 'width 0.05s ease-out'
            }} />
          </div>
        </div>
      </div>

      {/* 4-Wheel Independent Suspension & Drift Slip Gauges */}
      <div className="glass-panel" style={{
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontWeight: '700' }}>
          <span>4-CORNER SUSPENSION</span>
          <span style={{ color: lateralSlip > 0.3 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
            SLIP: {slipPercent}%
          </span>
        </div>

        {/* Chassis layout grid: FL, FR, RL, RR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {['FL', 'FR', 'RL', 'RR'].map((corner, i) => {
            const comp = Math.round((suspensionCompression[i] || 0) * 100);
            return (
              <div key={corner} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', color: 'var(--text-muted)' }}>{corner}</span>
                <div style={{
                  flex: 1,
                  height: '5px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${comp}%`,
                    height: '100%',
                    backgroundColor: comp > 75 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                    transition: 'width 0.05s ease'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
