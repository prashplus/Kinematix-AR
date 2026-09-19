import React from 'react';
import { soundManager } from '../audio/RCAudioEngine';

/**
 * Kinematix AR - Inspection Overlay & Control Ribbon
 * Handles physics pause, 360 inspection mode, real-time vertex repair lerping,
 * car respawn/flip, and prop spawning.
 */
export const InspectionOverlay = ({
  isInspectMode,
  onToggleInspect,
  onRepairCar,
  onRespawnCar,
  onOpenCarousel,
  onSpawnWall,
  onSpawnRamp,
  onSpawnBarrels,
  onClearProps,
  isARActive,
  onToggleAR
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'flex-end',
      zIndex: 25
    }}>
      {/* Primary Action Ribbon */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {/* AR Mode Toggle */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleAR();
          }}
          className={`btn-action ${isARActive ? 'btn-danger' : 'btn-primary'}`}
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '12px'
          }}
        >
          {isARActive ? '✕ Exit AR' : '◈ Enter AR'}
        </button>

        {/* Change Vehicle */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenCarousel();
          }}
          className="btn-action glass-pill"
          style={{ padding: '8px 14px', fontSize: '12px' }}
        >
          🏎 Garage
        </button>

        {/* Inspect / Drive Mode */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleInspect();
          }}
          className="btn-action glass-pill"
          style={{
            padding: '8px 14px',
            fontSize: '12px',
            borderColor: isInspectMode ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.15)',
            color: isInspectMode ? 'var(--accent-cyan)' : '#fff'
          }}
        >
          {isInspectMode ? '▶ Drive' : '🔍 Inspect'}
        </button>
      </div>

      {/* Secondary Ribbon: Quick Actions */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {/* Repair Car Vertices */}
        <button
          onClick={() => {
            soundManager.playClick();
            onRepairCar();
          }}
          className="btn-action glass-pill"
          title="Smoothly restore crumpled vertices"
          style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--accent-green)' }}
        >
          🔧 Repair
        </button>

        {/* Flip / Respawn */}
        <button
          onClick={() => {
            soundManager.playClick();
            onRespawnCar();
          }}
          className="btn-action glass-pill"
          title="Flip car upright and reset velocity"
          style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--accent-amber)' }}
        >
          ↺ Flip
        </button>
      </div>

      {/* Obstacle Props Toolbar */}
      <div className="glass-panel" style={{
        padding: '6px 10px',
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        marginTop: '4px'
      }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', paddingRight: '4px' }}>
          PROPS:
        </span>
        <button
          onClick={() => { soundManager.playClick(); onSpawnWall(); }}
          className="btn-action glass-pill"
          style={{ padding: '4px 10px', fontSize: '11px' }}
          title="Place static concrete crash barrier"
        >
          🧱 Wall
        </button>
        <button
          onClick={() => { soundManager.playClick(); onSpawnRamp(); }}
          className="btn-action glass-pill"
          style={{ padding: '4px 10px', fontSize: '11px' }}
          title="Place stunt jump ramp"
        >
          📐 Ramp
        </button>
        <button
          onClick={() => { soundManager.playClick(); onSpawnBarrels(); }}
          className="btn-action glass-pill"
          style={{ padding: '4px 10px', fontSize: '11px' }}
          title="Place dynamic scattering barrel stack"
        >
          🛢 Barrels
        </button>
        <button
          onClick={() => { soundManager.playClick(); onClearProps(); }}
          className="btn-action glass-pill"
          style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--accent-red)' }}
          title="Clear all props"
        >
          ✕
        </button>
      </div>

      {/* Inspection Mode Banner */}
      {isInspectMode && (
        <div className="glass-panel" style={{
          padding: '8px 14px',
          borderLeft: '3px solid var(--accent-cyan)',
          marginTop: '6px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
            INSPECTION MODE ACTIVE
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            Drag to orbit & zoom • Inspect dents, parts & suspension
          </div>
        </div>
      )}
    </div>
  );
};
