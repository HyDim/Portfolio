/**
 * Optional per-frame sounds: drop an audio file onto a timeline frame and
 * it plays (Web Audio API) whenever playback enters that frame.
 */
export class FrameAudio {
  private ctx: AudioContext | null = null;
  private readonly buffers = new Map<number, AudioBuffer>();

  private ensureContext(): AudioContext {
    if (this.ctx === null) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Decode and assign a sound to a frame; resolves false if undecodable. */
  async assign(frameIndex: number, file: File): Promise<boolean> {
    try {
      const ctx = this.ensureContext();
      const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
      this.buffers.set(frameIndex, buffer);
      return true;
    } catch {
      return false;
    }
  }

  has(frameIndex: number): boolean {
    return this.buffers.has(frameIndex);
  }

  play(frameIndex: number): void {
    const buffer = this.buffers.get(frameIndex);
    if (buffer === undefined) return;
    const ctx = this.ensureContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.6;
    source.connect(gain).connect(ctx.destination);
    source.start();
  }

  clear(): void {
    this.buffers.clear();
  }
}
