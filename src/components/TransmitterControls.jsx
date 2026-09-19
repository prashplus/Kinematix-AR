import React, { useState, useEffect, useRef } from 'react';

/**
 * Kinematix AR - Dual-Stick Virtual RC Transmitter
 * Proportional steering joystick (left) + Proportional throttle/brake trigger (right)
 * + Multi-touch support & Keyboard fallback (WASD / Arrows / Space)
 */
export const TransmitterControls = ({ onInputChange, isInspectMode }) => {
  const [steerVal, setSteerVal] = useState(0); // -1 (full left) to 1 (full right)
  const [throttleVal, setThrottleVal] = useState(0); // -1 (reverse/brake) to 1 (full throttle)
  const [handbrake, setHandbrake] = useState(false);

  // References for touch tracking
  const leftStickRef = useRef(null);
  const rightStickRef = useRef(null);
  const activeTouchesRef = useRef({ left: null, right: null });

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

  // Virtual Steering Joystick Touch Handler (Left)
  const handleLeftTouchMove = (e) => {
    if (!leftStickRef.current) return;
    const touch = e.touches[0];
    const rect = leftStickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const maxRadius = rect.width / 2;

    const deltaX = touch.clientX - centerX;
    const normalized = Math.max(-1, Math.min(1, deltaX / maxRadius));
    setSteerVal(normalized);
  };

  const handleLeftTouchEnd = () => {
    // Spring back to center
    setSteerVal(0);
  };

  // Virtual Throttle Trigger Touch Handler (Right)
  const handleRightTouchMove = (e) => {
    if (!rightStickRef.current) return;
    const touch = e.touches[0];
    const rect = rightStickRef.current.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.height / 2;

    // Up is positive throttle, Down is reverse/brake
    const deltaY = -(touch.clientY - centerY);
    const normalized = Math.max(-1, Math.min(1, deltaY / maxRadius));
    setThrottleVal(normalized);
  };

  const handleRightTouchEnd = () => {
    setThrottleVal(0);
  };

  if (isInspectMode) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '18px',
      left: '0',
      right: '0',
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0 24px',
      pointerEvents: 'none',
      zIndex: 20
    }}>
      {/* Left Steering Wheel / Joystick */}
      <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          ref={leftStickRef}
          onTouchMove={handleLeftTouchMove}
          onTouchEnd={handleLeftTouchEnd}
          onTouchCancel={handleLeftTouchEnd}
          onMouseDown={(e) => {
            const handleMouseMove = (moveEvent) => {
              if (!leftStickRef.current) return;
              const rect = leftStickRef.current.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const deltaX = moveEvent.clientX - centerX;
              setSteerVal(Math.max(-1, Math.min(1, deltaX / (rect.width / 2))));
            };
            const handleMouseUp = () => {
              setSteerVal(0);
              window.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('mouseup', handleMouseUp);
            };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          }}
          style={{
            width: '120px',
            height: '120px',
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
          {/* Steering Hub & Thumbstick Knob */}
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0284c7 100%)',
            boxShadow: '0 2px 12px rgba(2, 132, 199, 0.4)',
            transform: `translateX(${steerVal * 36}px)`,
            transition: steerVal === 0 ? 'transform 0.15s ease-out' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '800'
          }}>
            ◀ ▶
          </div>
        </div>
        <span style={{
          marginTop: '6px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          color: 'var(--accent-cyan)',
          textShadow: '0 0 8px var(--panel-glow)'
        }}>
          STEERING [A/D]
        </span>
      </div>

      {/* Handbrake Button Center */}
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
        <button
          className="btn-action glass-pill"
          onMouseDown={() => setHandbrake(true)}
          onMouseUp={() => setHandbrake(false)}
          onTouchStart={() => setHandbrake(true)}
          onTouchEnd={() => setHandbrake(false)}
          style={{
            padding: '10px 18px',
            fontSize: '12px',
            fontWeight: '800',
            color: handbrake ? 'var(--accent-red)' : 'var(--text-primary)',
            borderColor: handbrake ? 'var(--accent-red)' : 'var(--panel-border)',
            boxShadow: handbrake ? '0 0 16px rgba(220, 38, 38, 0.4)' : 'none'
          }}
        >
          (P) E-BRAKE
        </button>
      </div>

      {/* Right Throttle / Brake Trigger Slider */}
      <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          ref={rightStickRef}
          onTouchMove={handleRightTouchMove}
          onTouchEnd={handleRightTouchEnd}
          onTouchCancel={handleRightTouchEnd}
          onMouseDown={(e) => {
            const handleMouseMove = (moveEvent) => {
              if (!rightStickRef.current) return;
              const rect = rightStickRef.current.getBoundingClientRect();
              const centerY = rect.top + rect.height / 2;
              const deltaY = -(moveEvent.clientY - centerY);
              setThrottleVal(Math.max(-1, Math.min(1, deltaY / (rect.height / 2))));
            };
            const handleMouseUp = () => {
              setThrottleVal(0);
              window.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('mouseup', handleMouseUp);
            };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          }}
          style={{
            width: '74px',
            height: '140px',
            borderRadius: '37px',
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
          {/* Throttle Knob */}
          <div style={{
            width: '54px',
            height: '42px',
            borderRadius: '21px',
            background: throttleVal >= 0
              ? 'linear-gradient(135deg, var(--accent-green) 0%, #0284c7 100%)'
              : 'linear-gradient(135deg, var(--accent-red) 0%, var(--accent-amber) 100%)',
            boxShadow: throttleVal >= 0
              ? '0 2px 12px rgba(22, 163, 74, 0.4)'
              : '0 2px 12px rgba(220, 38, 38, 0.4)',
            transform: `translateY(${-throttleVal * 44}px)`,
            transition: throttleVal === 0 ? 'transform 0.15s ease-out' : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: '900'
          }}>
            <span>▲ FWD</span>
            <span>▼ REV</span>
          </div>
        </div>
        <span style={{
          marginTop: '6px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          color: 'var(--accent-green)',
          textShadow: '0 0 8px var(--panel-glow)'
        }}>
          THROTTLE [W/S]
        </span>
      </div>
    </div>
  );
};
