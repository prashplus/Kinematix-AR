/**
 * Kinematix AR - Procedural Web Audio Engine
 * Generates realistic RC brushless electric motor whines, tire skid squeals,
 * impact crunch sounds, and interface audio feedback using Web Audio API.
 */
class RCAudioEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.isMuted = false;

    // Motor sound nodes
    this.motorOsc1 = null;
    this.motorOsc2 = null;
    this.motorFilter = null;
    this.motorGain = null;

    // Tire squeal nodes
    this.skidNoise = null;
    this.skidFilter = null;
    this.skidGain = null;

    // Master bus
    this.masterGain = null;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupMotorSynth();
      this.setupSkidSynth();

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupMotorSynth() {
    if (!this.ctx) return;

    // Oscillator 1: fundamental electric whine (sawtooth)
    this.motorOsc1 = this.ctx.createOscillator();
    this.motorOsc1.type = 'sawtooth';
    this.motorOsc1.frequency.setValueAtTime(60, this.ctx.currentTime);

    // Oscillator 2: high harmonic brushless inverter whine (sine)
    this.motorOsc2 = this.ctx.createOscillator();
    this.motorOsc2.type = 'sine';
    this.motorOsc2.frequency.setValueAtTime(180, this.ctx.currentTime);

    // Resonant lowpass filter to shape electric motor timbre
    this.motorFilter = this.ctx.createBiquadFilter();
    this.motorFilter.type = 'lowpass';
    this.motorFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    this.motorFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.motorGain = this.ctx.createGain();
    this.motorGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    this.motorOsc1.connect(this.motorFilter);
    this.motorOsc2.connect(this.motorFilter);
    this.motorFilter.connect(this.motorGain);
    this.motorGain.connect(this.masterGain);

    this.motorOsc1.start();
    this.motorOsc2.start();
  }

  setupSkidSynth() {
    if (!this.ctx) return;

    // 2-second white noise buffer loop
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.skidNoise = this.ctx.createBufferSource();
    this.skidNoise.buffer = noiseBuffer;
    this.skidNoise.loop = true;

    // Bandpass filter for tire asphalt/rubber friction
    this.skidFilter = this.ctx.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    this.skidFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.skidNoise.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.masterGain);

    this.skidNoise.start();
  }

  /**
   * Update continuous audio based on telemetry
   * @param {number} rpm - Motor RPM (0 - 15000)
   * @param {number} throttle - Throttle input (-1 to 1)
   * @param {number} slipRatio - Lateral & longitudinal slip (0 to 1+)
   */
  updateTelemetry(rpm, throttle, slipRatio) {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Map RPM to frequencies
    const normRpm = Math.max(0, Math.min(rpm / 12000, 1.2));
    const baseFreq = 55 + normRpm * 380; // 55Hz - 510Hz
    const harmonicFreq = baseFreq * 2.8; // High-pitched brushless whine

    if (this.motorOsc1 && this.motorOsc2) {
      this.motorOsc1.frequency.setTargetAtTime(baseFreq, t, 0.05);
      this.motorOsc2.frequency.setTargetAtTime(harmonicFreq, t, 0.05);
    }

    if (this.motorFilter) {
      const filterCutoff = 350 + normRpm * 1400;
      this.motorFilter.frequency.setTargetAtTime(filterCutoff, t, 0.05);
    }

    if (this.motorGain) {
      const absThrottle = Math.abs(throttle);
      const targetGain = 0.03 + absThrottle * 0.12 + (normRpm > 0.05 ? 0.04 : 0);
      this.motorGain.gain.setTargetAtTime(targetGain, t, 0.06);
    }

    // Tire squeal gain & pitch
    if (this.skidGain && this.skidFilter) {
      const clampedSlip = Math.max(0, Math.min((slipRatio - 0.2) * 1.5, 1.0));
      const skidVol = clampedSlip * 0.18;
      this.skidGain.gain.setTargetAtTime(skidVol, t, 0.08);

      const skidFreq = 900 + clampedSlip * 500;
      this.skidFilter.frequency.setTargetAtTime(skidFreq, t, 0.08);
    }
  }

  /**
   * Play dynamic collision crunch
   * @param {number} impulseMagnitude - Collision force
   */
  playImpact(impulseMagnitude = 10) {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const normForce = Math.min(impulseMagnitude / 40, 1.0);
    if (normForce < 0.08) return; // Ignore micro-bumps

    // Low-end thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);

    oscGain.gain.setValueAtTime(0.35 * normForce, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);

    // High metallic crunch noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200 + Math.random() * 600, t);
    noiseFilter.Q.setValueAtTime(2.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * normForce, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
  }

  /**
   * Sound effect for car vertex repair / nanotech restore
   */
  playRepair() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.35);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.42);
  }

  playClick() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

export const soundManager = new RCAudioEngine();
