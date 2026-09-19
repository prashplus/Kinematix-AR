import React, { useState } from 'react';
import { soundManager } from '../audio/RCAudioEngine';
import { Sun, Moon, Volume2, VolumeX, HelpCircle, Wrench, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Kinematix AR - Responsive Top-Right Controller & Tools Drawer
 * Provides clean mobile-friendly access to AR mode, Garage, Props placement,
 * Repair, Flip, Inspection, and Settings without overlapping.
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
  onToggleAR,
  theme,
  onToggleTheme,
  isMuted,
  onToggleMute,
  onOpenHelp
}) => {
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      alignItems: 'flex-end',
      pointerEvents: 'auto',
      maxWidth: '320px'
    }}>
      {/* Primary Top Bar Buttons */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {/* AR Mode Toggle */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleAR();
          }}
          className={`btn-action ${isARActive ? 'btn-danger' : 'btn-primary'}`}
          style={{
            padding: '7px 12px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: '800'
          }}
        >
          {isARActive ? '✕ Exit AR' : '◈ Enter AR'}
        </button>

        {/* Change Vehicle / Garage */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenCarousel();
          }}
          className="btn-action glass-pill"
          style={{ padding: '7px 10px', fontSize: '11px' }}
        >
          🏎️ Garage
        </button>

        {/* Tools & Props Drawer Toggle */}
        <button
          onClick={() => {
            soundManager.playClick();
            setToolsOpen(!toolsOpen);
          }}
          className="btn-action glass-pill"
          style={{
            padding: '7px 10px',
            fontSize: '11px',
            borderColor: toolsOpen ? 'var(--accent-cyan)' : 'var(--panel-border)',
            color: toolsOpen ? 'var(--accent-cyan)' : 'var(--text-primary)'
          }}
          title="Toggle Props & Vehicle Tools Drawer"
        >
          <Wrench size={13} style={{ marginRight: '2px' }} />
          <span>Tools</span>
          {toolsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Floating Tools Drawer (Collapsible for uncluttered AR view) */}
      {toolsOpen && (
        <div className="glass-panel" style={{
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderRadius: '14px',
          boxShadow: 'var(--panel-shadow)',
          border: '1px solid var(--panel-border)',
          marginTop: '2px',
          width: '100%'
        }}>
          {/* Props Placement Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.05em' }}>
              SPAWN PROPS
            </span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { soundManager.playClick(); onSpawnWall(); }}
                className="btn-action glass-pill"
                style={{ padding: '5px 8px', fontSize: '11px', flex: 1 }}
              >
                🧱 Wall
              </button>
              <button
                onClick={() => { soundManager.playClick(); onSpawnRamp(); }}
                className="btn-action glass-pill"
                style={{ padding: '5px 8px', fontSize: '11px', flex: 1 }}
              >
                📐 Ramp
              </button>
              <button
                onClick={() => { soundManager.playClick(); onSpawnBarrels(); }}
                className="btn-action glass-pill"
                style={{ padding: '5px 8px', fontSize: '11px', flex: 1 }}
              >
                🛢️ Barrels
              </button>
              <button
                onClick={() => { soundManager.playClick(); onClearProps(); }}
                className="btn-action glass-pill"
                style={{ padding: '5px 8px', fontSize: '11px', color: 'var(--accent-red)' }}
                title="Clear all props"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Vehicle Actions Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.05em' }}>
              VEHICLE ACTIONS
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => { soundManager.playClick(); onRepairCar(); }}
                className="btn-action glass-pill"
                style={{ padding: '5px 8px', fontSize: '11px', color: 'var(--accent-green)', flex: 1 }}
              >
                🔧 Repair
              </button>
              <button
                onClick={() => { soundManager.playClick(); onRespawnCar(); }}
                className="btn-action glass-pill"
                style={{ padding: '5px 8px', fontSize: '11px', color: 'var(--accent-amber)', flex: 1 }}
              >
                ↺ Flip
              </button>
              <button
                onClick={() => { soundManager.playClick(); onToggleInspect(); }}
                className="btn-action glass-pill"
                style={{
                  padding: '5px 8px',
                  fontSize: '11px',
                  borderColor: isInspectMode ? 'var(--accent-cyan)' : 'var(--panel-border)',
                  color: isInspectMode ? 'var(--accent-cyan)' : 'var(--text-primary)',
                  flex: 1
                }}
              >
                {isInspectMode ? '▶ Drive' : '🔍 Inspect'}
              </button>
            </div>
          </div>

          {/* Quick Settings & Help */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid var(--panel-border)' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700' }}>
              SETTINGS
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={onToggleTheme}
                className="btn-action glass-pill"
                style={{ width: '28px', height: '28px', borderRadius: '50%', padding: 0 }}
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={13} color="var(--accent-purple)" /> : <Sun size={13} color="var(--accent-amber)" />}
              </button>
              <button
                onClick={onToggleMute}
                className="btn-action glass-pill"
                style={{ width: '28px', height: '28px', borderRadius: '50%', padding: 0 }}
                title="Toggle Audio"
              >
                {isMuted ? <VolumeX size={13} color="var(--accent-red)" /> : <Volume2 size={13} color="var(--accent-cyan)" />}
              </button>
              <button
                onClick={onOpenHelp}
                className="btn-action glass-pill"
                style={{ width: '28px', height: '28px', borderRadius: '50%', padding: 0 }}
                title="Help Guide"
              >
                <HelpCircle size={13} color="var(--text-secondary)" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Mode Status Banner */}
      {isInspectMode && (
        <div className="glass-panel" style={{
          padding: '6px 10px',
          borderLeft: '3px solid var(--accent-cyan)',
          marginTop: '2px',
          maxWidth: '220px'
        }}>
          <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
            INSPECTION MODE ACTIVE
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
            Drag to orbit 360° • Zoom to inspect damage
          </div>
        </div>
      )}
    </div>
  );
};
