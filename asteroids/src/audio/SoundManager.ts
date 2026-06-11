import { Howl } from 'howler';
import type { AsteroidSize } from '../entities/Asteroid';

/**
 * All audio is synthesised at startup into 16-bit PCM WAV data URIs and
 * played through Howler.js — the game ships with zero audio assets.
 */

const SAMPLE_RATE = 22050;

function encodeWav(samples: Float32Array): string {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function seconds(duration: number): Float32Array {
  return new Float32Array(Math.floor(SAMPLE_RATE * duration));
}

/** Square-wave laser zap with a falling pitch sweep. */
function synthShoot(): string {
  const samples = seconds(0.14);
  let phase = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / samples.length;
    const frequency = 880 - 560 * t;
    phase += (frequency / SAMPLE_RATE) * Math.PI * 2;
    const envelope = Math.pow(1 - t, 1.8) * 0.5;
    samples[i] = (Math.sin(phase) > 0 ? 1 : -1) * envelope;
  }
  return encodeWav(samples);
}

/** Filtered-noise boom; bigger sizes are longer and bassier. */
function synthExplosion(duration: number, cutoff: number): string {
  const samples = seconds(duration);
  let filtered = 0;
  const alpha = cutoff / SAMPLE_RATE;
  for (let i = 0; i < samples.length; i++) {
    const t = i / samples.length;
    filtered += alpha * (Math.random() * 2 - 1 - filtered);
    samples[i] = filtered * Math.pow(1 - t, 1.4) * 6;
  }
  return encodeWav(samples);
}

/** Smooth low rumble that loops while the engine burns. */
function synthThrustLoop(): string {
  const samples = seconds(0.6);
  let brown = 0;
  for (let i = 0; i < samples.length; i++) {
    brown += (Math.random() * 2 - 1) * 0.04;
    brown *= 0.985;
    // short fade at both ends to keep the loop click-free
    const edge = Math.min(1, i / 400, (samples.length - i) / 400);
    samples[i] = brown * 2.2 * edge;
  }
  return encodeWav(samples);
}

/** Single bass thump for the background heartbeat. */
function synthPulse(): string {
  const samples = seconds(0.16);
  for (let i = 0; i < samples.length; i++) {
    const t = i / samples.length;
    samples[i] = Math.sin(2 * Math.PI * 62 * (i / SAMPLE_RATE)) * Math.pow(1 - t, 2.2) * 0.6;
  }
  return encodeWav(samples);
}

export class SoundManager {
  private readonly shoot: Howl;
  private readonly explosions: Readonly<Record<AsteroidSize, Howl>>;
  private readonly thrust: Howl;
  private readonly pulse: Howl;

  private thrustPlaying = false;
  private pulseTimer: number | null = null;
  private pulseInterval = 1.1; // seconds between heartbeats

  constructor() {
    this.shoot = new Howl({ src: [synthShoot()], format: ['wav'], volume: 0.35 });
    this.explosions = {
      small: new Howl({ src: [synthExplosion(0.25, 2600)], format: ['wav'], volume: 0.4 }),
      medium: new Howl({ src: [synthExplosion(0.42, 1400)], format: ['wav'], volume: 0.5 }),
      large: new Howl({ src: [synthExplosion(0.65, 700)], format: ['wav'], volume: 0.6 }),
    };
    this.thrust = new Howl({ src: [synthThrustLoop()], format: ['wav'], loop: true, volume: 0 });
    this.pulse = new Howl({ src: [synthPulse()], format: ['wav'], volume: 0.5 });
  }

  playShoot(): void {
    this.shoot.play();
  }

  playExplosion(size: AsteroidSize): void {
    this.explosions[size].play();
  }

  setThrusting(active: boolean): void {
    if (active && !this.thrustPlaying) {
      this.thrustPlaying = true;
      this.thrust.play();
      this.thrust.fade(0, 0.4, 90);
    } else if (!active && this.thrustPlaying) {
      this.thrustPlaying = false;
      this.thrust.fade(this.thrust.volume(), 0, 120);
      window.setTimeout(() => {
        if (!this.thrustPlaying) this.thrust.stop();
      }, 140);
    }
  }

  /** Heartbeat speeds up as the field empties: ~1.2s down to ~0.35s. */
  setAsteroidCount(count: number): void {
    this.pulseInterval = Math.min(1.2, 0.35 + count * 0.07);
  }

  startPulse(): void {
    if (this.pulseTimer !== null) return;
    const tick = (): void => {
      this.pulse.play();
      this.pulseTimer = window.setTimeout(tick, this.pulseInterval * 1000);
    };
    this.pulseTimer = window.setTimeout(tick, this.pulseInterval * 1000);
  }

  stopPulse(): void {
    if (this.pulseTimer !== null) {
      window.clearTimeout(this.pulseTimer);
      this.pulseTimer = null;
    }
  }
}
