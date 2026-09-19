import React from 'react';
import { VEHICLE_ARCHETYPES } from '../vehicles/VehicleConfigs';
import { soundManager } from '../audio/RCAudioEngine';

/**
 * Kinematix AR - Vehicle Carousel Selector
 * Switch between Baja Trophy Truck, GT Supercar, and Drift Muscle Spec with live stats.
 */
export const VehicleCarousel = ({ currentVehicleId, onSelectVehicle, isVisible, onClose }) => {
  if (!isVisible) return null;

  const vehicleList = Object.values(VEHICLE_ARCHETYPES);
  const currentIndex = vehicleList.findIndex((v) => v.id === currentVehicleId);

  const handlePrev = () => {
    soundManager.playClick();
    const nextIdx = (currentIndex - 1 + vehicleList.length) % vehicleList.length;
    onSelectVehicle(vehicleList[nextIdx].id);
  };

  const handleNext = () => {
    soundManager.playClick();
    const nextIdx = (currentIndex + 1) % vehicleList.length;
    onSelectVehicle(vehicleList[nextIdx].id);
  };

  const selected = vehicleList[currentIndex] || vehicleList[0];

  return (
    <div style={{
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        border: '1px solid var(--panel-border)',
        boxShadow: 'var(--panel-shadow)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '800', letterSpacing: '0.1em' }}>
              VEHICLE ROSTER
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
              {selected.name}
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {selected.tagline}
            </span>
          </div>

          <button
            onClick={onClose}
            className="btn-action glass-pill"
            style={{ width: '36px', height: '36px', borderRadius: '50%', padding: '0', fontSize: '16px' }}
          >
            ✕
          </button>
        </div>

        {/* Archetype Indicator Badge */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="glass-pill" style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '700', color: selected.color }}>
            ● {selected.category}
          </span>
          <span className="glass-pill" style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
            ⚙ {selected.driveType}
          </span>
        </div>

        {/* Spec Radar Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Top Speed */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Top Speed</span>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{selected.engine.topSpeedKmH} km/h</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--panel-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${(selected.engine.topSpeedKmH / 85) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--accent-cyan)'
              }} />
            </div>
          </div>

          {/* Suspension Travel */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Suspension Travel</span>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{Math.round(selected.suspension.maxSuspensionTravel * 100)} cm</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--panel-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${(selected.suspension.maxSuspensionTravel / 0.35) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--accent-green)'
              }} />
            </div>
          </div>

          {/* Lateral Drift Bias */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Lateral Slip & Oversteer</span>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                {selected.id === 'drift_muscle' ? 'Extreme Drift' : selected.id === 'trophy_truck' ? 'High Body Roll' : 'Razor Grip'}
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--panel-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: selected.id === 'drift_muscle' ? '92%' : selected.id === 'trophy_truck' ? '65%' : '20%',
                height: '100%',
                backgroundColor: 'var(--accent-amber)'
              }} />
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          {selected.description}
        </p>

        {/* Navigation & Selection Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={handlePrev}
            className="btn-action"
            style={{ flex: 1, padding: '12px', borderRadius: '12px' }}
          >
            ◀ Previous
          </button>
          <button
            onClick={onClose}
            className="btn-action btn-primary"
            style={{ flex: 2, padding: '12px', borderRadius: '12px' }}
          >
            Drive {selected.name}
          </button>
          <button
            onClick={handleNext}
            className="btn-action"
            style={{ flex: 1, padding: '12px', borderRadius: '12px' }}
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
};
