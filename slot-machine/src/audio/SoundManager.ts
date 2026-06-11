/**
 * All sounds are synthesised with the Web Audio API so the game ships
 * with zero audio assets. The context is created lazily on the first
 * user gesture to satisfy browser autoplay policies.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private spinSource: AudioBufferSourceNode | null = null;
  private spinGain: GainNode | null = null;

  private ensureContext(): AudioContext {
    if (this.ctx === null) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /** Low rumble + ticking loop while the reels are moving. */
  startSpinLoop(): void {
    const ctx = this.ensureContext();
    this.stopSpinLoop();

    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(ctx, 0.4);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.15);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();

    this.spinSource = source;
    this.spinGain = gain;
  }

  stopSpinLoop(): void {
    if (this.spinSource === null || this.spinGain === null) return;
    const ctx = this.ensureContext();
    this.spinGain.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
    this.spinSource.stop(ctx.currentTime + 0.2);
    this.spinSource = null;
    this.spinGain = null;
  }

  /** Short mechanical click when a reel locks into place. */
  playReelStop(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Rising arpeggio on a win. */
  playWinJingle(): void {
    const ctx = this.ensureContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((frequency, i) => {
      const start = ctx.currentTime + i * 0.13;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = frequency;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  }
}
