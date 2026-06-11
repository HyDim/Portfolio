import { Sprite, Texture } from 'pixi.js';
import type { AnimationConfig } from '../types/AnimationConfig';

export type FrameChangeListener = (frameIndex: number, viaPlayback: boolean) => void;

/**
 * Drives the preview sprite through the sliced frames: play/pause,
 * single-step, loop and ping-pong modes, FPS-based timing.
 */
export class AnimationPlayer {
  readonly sprite: Sprite;

  private frames: Texture[] = [];
  private index = 0;
  private direction: 1 | -1 = 1;
  private playing = false;
  private elapsed = 0;
  private readonly onFrameChange: FrameChangeListener;

  constructor(private readonly config: AnimationConfig, onFrameChange: FrameChangeListener) {
    this.sprite = new Sprite(Texture.EMPTY);
    this.sprite.anchor.set(0.5);
    this.onFrameChange = onFrameChange;
  }

  get currentFrame(): number {
    return this.index;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  setFrames(frames: Texture[]): void {
    this.frames = frames;
    this.index = Math.min(this.index, Math.max(0, frames.length - 1));
    this.direction = 1;
    this.apply(false);
  }

  play(): void {
    this.playing = true;
    this.elapsed = 0;
  }

  pause(): void {
    this.playing = false;
  }

  toggle(): boolean {
    this.playing = !this.playing;
    this.elapsed = 0;
    return this.playing;
  }

  /** Manual single-step; pauses playback. */
  step(direction: 1 | -1): void {
    this.pause();
    const count = this.frames.length;
    if (count === 0) return;
    this.index = (this.index + direction + count) % count;
    this.apply(false);
  }

  /** Jump straight to a frame (timeline click); pauses playback. */
  goTo(frameIndex: number): void {
    this.pause();
    if (frameIndex < 0 || frameIndex >= this.frames.length) return;
    this.index = frameIndex;
    this.apply(false);
  }

  update(dtSeconds: number): void {
    if (!this.playing || this.frames.length <= 1) return;
    this.elapsed += dtSeconds;
    const frameDuration = 1 / Math.max(1, this.config.fps);
    while (this.elapsed >= frameDuration && this.playing) {
      this.elapsed -= frameDuration;
      this.advance();
    }
  }

  private advance(): void {
    const count = this.frames.length;
    const last = count - 1;
    let next = this.index + this.direction;

    if (this.config.pingPong) {
      if (next > last || next < 0) {
        if (!this.config.loop && this.direction === -1) {
          // completed a full out-and-back pass
          this.pause();
          return;
        }
        this.direction = (this.direction * -1) as 1 | -1;
        next = this.index + this.direction;
      }
    } else if (next > last) {
      if (!this.config.loop) {
        this.pause();
        return;
      }
      next = 0;
    }

    this.index = Math.max(0, Math.min(last, next));
    this.apply(true);
  }

  private apply(viaPlayback: boolean): void {
    const texture = this.frames[this.index];
    this.sprite.texture = texture ?? Texture.EMPTY;
    this.onFrameChange(this.index, viaPlayback);
  }
}
