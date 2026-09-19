import React, { useState } from 'react';

/**
 * Kinematix AR - Telemetry HUD
 * Compact, mobile-responsive dashboard displaying Speedometer, BLDC Motor RPM,
 * and an expandable 4-corner suspension compression panel.
 */
export const TelemetryHUD = ({ telemetry, vehicleConfig, isInspectMode }) => {
  const [useMph, setUseMph] = useState(false);
  const [showSuspension, setShowSuspension] = useState(false);

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
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      pointerEvents: 'auto',
      fontFamily: 'var(--font-mono)',
      maxWidth: '220px'
    }}>
      {/* Primary Speed & RPM Compact Cluster */}
      <div className="glass-panel" style={{
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderLeft: '3px solid var(--accent-cyan)'
      }}>
        {/* Speedometer */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{
              fontSize: '24px',
              fontWeight: '900',
              color: 'var(--text-primary)',
              lineHeight: '1',
              fontFamily: 'var(--font-main)'
            }}>
              {displaySpeed}
            </span>
            <span
              onClick={() => setUseMph(!useMph)}
              style={{
                fontSize: '10px',
                fontWeight: '700',
                color: 'var(--accent-cyan)',
                cursor: 'pointer'
              }}
              title="Click to toggle KM/H / MPH"
            >
              {speedUnit}
            </span>
          </div>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {vehicleConfig.driveType}
          </span>
        </div>

        {/* Compact RPM Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '68px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>RPM</span>
            <span style={{ color: rpmPercent > 80 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: '700' }}>
              {Math.round(rpm / 1000)}k
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '5px',
            backgroundColor: 'var(--panel-border)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${rpmPercent}%`,
              height: '100%',
              background: rpmPercent > 80
                ? 'linear-gradient(90deg, #0284c7, var(--accent-red))'
                : 'linear-gradient(90deg, #0284c7, var(--accent-green))',
              transition: 'width 0.05s ease-out'
            }} />
          </div>
        </div>

        {/* Shocks toggle button */}
        <button
          onClick={() => setShowSuspension(!showSuspension)}
          className="btn-action glass-pill"
          style={{
            padding: '4px 6px',
            fontSize: '9px',
            fontWeight: '700',
            color: showSuspension ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderColor: showSuspension ? 'var(--accent-cyan)' : 'var(--panel-border)'
          }}
          title="Toggle 4-corner suspension telemetry"
        >
          {showSuspension ? '▲' : '▼'}
        </button>
      </div>

      {/* Expandable 4-Wheel Suspension & Drift Slip Gauges */}
      {showSuspension && (
        <div className="glass-panel" style={{
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '9px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontWeight: '700' }}>
            <span>4-CORNER TRAVEL</span>
            <span style={{ color: lateralSlip > 0.3 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
              SLIP: {slipPercent}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {['FL', 'FR', 'RL', 'RR'].map((corner, i) => {
              const comp = Math.round((suspensionCompression[i] || 0) * 100);
              return (
                <div key={corner} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '16px', color: 'var(--text-muted)' }}>{corner}</span>
                  <div style={{
                    flex: 1,
                    height: '4px',
                    backgroundColor: 'var(--panel-border)',
                    borderRadius: '2px',
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
      )}
    </div>
  );
};
