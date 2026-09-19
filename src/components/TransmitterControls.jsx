import React, { useState, useEffect, useRef } from 'react';

/**
 * Kinematix AR - Dual-Stick Virtual RC Transmitter
 * Robust Multi-Touch via PointerEvents (with PointerCapture per finger),
 * Proportional Steering (left) + Proportional Throttle & Reverse (right)
 * + Keyboard fallback (WASD / Arrows / Space)
 */
export const TransmitterControls = ({ onInputChange, isInspectMode }) => {
  const [steerVal, setSteerVal] = useState(0); // -1 (left) to 1 (right)
  const [throttleVal, setThrottleVal] = useState(0); // -1 (reverse/brake) to 1 (throttle)
  const [handbrake, setHandbrake] = useState(false);

  const leftStickRef = useRef(null);
  const rightStickRef = useRef(null);
  const leftPointerId = useRef(null);
  const rightPointerId = useRef(null);

  // Sync inputs to parent callback
  useEffect(() => {
    if (onInputChange && !isInspectMode) {
      onInputChange({
        steer: steerVal,
        throttle: throttleVal,
        handbrake: handbrake
      });
    }
  }, [steerVal, throttleVal, handbrake, onInputChange, isInspectMode]);

  // Keyboard Event Listeners
  useEffect(() => {
    const keysDown = {};

    const updateFromKeys = () => {
      let s = 0;
      let t = 0;
      let h = false;

      if (keysDown['KeyA'] || keysDown['ArrowLeft']) s -= 1.0;
      if (keysDown['KeyD'] || keysDown['ArrowRight']) s += 1.0;
      if (keysDown['KeyW'] || keysDown['ArrowUp']) t += 1.0;
      if (keysDown['KeyS'] || keysDown['ArrowDown']) t -= 1.0;
      if (keysDown['Space']) h = true;

      setSteerVal(s);
      setThrottleVal(t);
      setHandbrake(h);
    };

    const handleKeyDown = (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysDown[e.code] = true;
      updateFromKeys();
    };

    const handleKeyUp = (e) => {
      delete keysDown[e.code];
      updateFromKeys();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Left Steering Pointer Handlers (Multi-Touch Independent)
  const updateSteerFromClientX = (clientX) => {
    if (!leftStickRef.current) return;
    const rect = leftStickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const maxRadius = rect.width * 0.42;
    const deltaX = clientX - centerX;
    const norm = Math.max(-1, Math.min(1, deltaX / maxRadius));
    setSteerVal(norm);
  };

  const handleLeftPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    leftPointerId.current = e.pointerId;
    updateSteerFromClientX(e.clientX);
  };

  const handleLeftPointerMove = (e) => {
    if (leftPointerId.current !== e.pointerId) return;
    e.preventDefault();
    updateSteerFromClientX(e.clientX);
  };

  const handleLeftPointerUp = (e) => {
    if (leftPointerId.current === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      leftPointerId.current = null;
      setSteerVal(0);
    }
  };

  // Right Throttle Pointer Handlers (Multi-Touch Independent)
  const updateThrottleFromClientY = (clientY) => {
    if (!rightStickRef.current) return;
    const rect = rightStickRef.current.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    // Dragging up is forward (+), dragging down is reverse/brake (-)
    const deltaY = -(clientY - centerY);
    const maxRadius = rect.height * 0.38;
    const norm = Math.max(-1, Math.min(1, deltaY / maxRadius));
    setThrottleVal(norm);
  };

  const handleRightPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    rightPointerId.current = e.pointerId;
    updateThrottleFromClientY(e.clientY);
  };

  const handleRightPointerMove = (e) => {
    if (rightPointerId.current !== e.pointerId) return;
    e.preventDefault();
    updateThrottleFromClientY(e.clientY);
  };

  const handleRightPointerUp = (e) => {
    if (rightPointerId.current === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      rightPointerId.current = null;
      setThrottleVal(0);
    }
  };

  if (isInspectMode) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      left: '0',
      right: '0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      padding: '0 16px',
      pointerEvents: 'none',
      zIndex: 30,
      userSelect: 'none',
      WebkitUserSelect: 'none'
    }}>
      {/* Left Steering Wheel / Joystick */}
      <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          ref={leftStickRef}
          onPointerDown={handleLeftPointerDown}
          onPointerMove={handleLeftPointerMove}
          onPointerUp={handleLeftPointerUp}
          onPointerCancel={handleLeftPointerUp}
          style={{
            width: '114px',
            height: '114px',
            borderRadius: '50%',
            background: 'var(--stick-bg)',
            border: '2px solid var(--stick-border)',
            boxShadow: 'var(--stick-shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'grab',
            touchAction: 'none'
          }}
        >
          {/* Subtle guide tick marks */}
          <div style={{ position: 'absolute', width: '80%', height: '1px', backgroundColor: 'var(--panel-border)' }} />

          {/* Steering Hub & Thumbstick Knob */}
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0284c7 100%)',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
            transform: `translateX(${steerVal * 34}px)`,
            transition: steerVal === 0 ? 'transform 0.12s ease-out' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '800',
            pointerEvents: 'none'
          }}>
            ◀ ▶
          </div>
        </div>
        <span style={{
          marginTop: '6px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.06em',
          color: 'var(--accent-cyan)',
          textShadow: '0 0 8px var(--panel-glow)'
        }}>
          STEERING
        </span>
      </div>

      {/* Handbrake Button Center */}
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
        <button
          className="btn-action glass-pill"
          onPointerDown={(e) => { e.preventDefault(); setHandbrake(true); }}
          onPointerUp={() => setHandbrake(false)}
          onPointerCancel={() => setHandbrake(false)}
          style={{
            padding: '12px 18px',
            fontSize: '12px',
            fontWeight: '800',
            color: handbrake ? 'var(--accent-red)' : 'var(--text-primary)',
            borderColor: handbrake ? 'var(--accent-red)' : 'var(--panel-border)',
            boxShadow: handbrake ? '0 0 16px rgba(220, 38, 38, 0.4)' : 'none',
            touchAction: 'none'
          }}
        >
          (P) BRAKE
        </button>
      </div>

      {/* Right Throttle / Brake Trigger Slider */}
      <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          ref={rightStickRef}
          onPointerDown={handleRightPointerDown}
          onPointerMove={handleRightPointerMove}
          onPointerUp={handleRightPointerUp}
          onPointerCancel={handleRightPointerUp}
          style={{
            width: '84px',
            height: '148px',
            borderRadius: '42px',
            background: 'var(--stick-bg)',
            border: '2px solid var(--stick-border)',
            boxShadow: 'var(--stick-shadow)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            position: 'relative',
            cursor: 'grab',
            touchAction: 'none'
          }}
        >
          {/* Top Hold Target: Forward */}
          <div style={{
            fontSize: '10px',
            fontWeight: '800',
            color: throttleVal > 0.1 ? 'var(--accent-green)' : 'var(--text-muted)',
            pointerEvents: 'none'
          }}>
            ▲ FWD
          </div>

          {/* Center Draggable Knob */}
          <div style={{
            width: '68px',
            height: '46px',
            borderRadius: '23px',
            background: throttleVal > 0.05
              ? 'linear-gradient(135deg, var(--accent-green) 0%, #0284c7 100%)'
              : throttleVal < -0.05
              ? 'linear-gradient(135deg, var(--accent-red) 0%, var(--accent-amber) 100%)'
              : 'linear-gradient(135deg, rgba(2, 132, 199, 0.85) 0%, rgba(37, 99, 235, 0.85) 100%)',
            boxShadow: throttleVal > 0.05
              ? '0 4px 16px rgba(22, 163, 74, 0.5)'
              : throttleVal < -0.05
              ? '0 4px 16px rgba(220, 38, 38, 0.5)'
              : '0 2px 10px rgba(0, 0, 0, 0.15)',
            transform: `translateY(${-throttleVal * 44}px)`,
            transition: throttleVal === 0 ? 'transform 0.12s ease-out' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '900',
            letterSpacing: '0.04em',
            pointerEvents: 'none'
          }}>
            {throttleVal > 0.1 ? '▲ GO' : throttleVal < -0.1 ? '▼ REV' : 'DRIVE'}
          </div>

          {/* Bottom Hold Target: Reverse */}
          <div style={{
            fontSize: '10px',
            fontWeight: '800',
            color: throttleVal < -0.1 ? 'var(--accent-red)' : 'var(--text-muted)',
            pointerEvents: 'none'
          }}>
            ▼ REV
          </div>
        </div>

        <span style={{
          marginTop: '6px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.06em',
          color: 'var(--accent-green)',
          textShadow: '0 0 8px var(--panel-glow)'
        }}>
          THROTTLE
        </span>
      </div>
    </div>
  );
};
