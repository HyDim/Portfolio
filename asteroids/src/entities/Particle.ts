import { Particle as PixiParticle, type Texture } from 'pixi.js';

export interface ParticleOptions {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly life: number;
  readonly tint: number;
  readonly startScale: number;
  readonly endScale: number;
  readonly drag: number;
}

/**
 * One particle: a lightweight PixiJS Particle plus its own motion state.
 * Fades and shrinks (or grows) linearly over its lifetime.
 */
export class Particle {
  readonly sprite: PixiParticle;

  private vx: number;
  private vy: number;
  private life: number;
  private readonly maxLife: number;
  private readonly startScale: number;
  private readonly endScale: number;
  private readonly drag: number;

  constructor(texture: Texture, options: ParticleOptions) {
    this.vx = options.vx;
    this.vy = options.vy;
    this.life = options.life;
    this.maxLife = options.life;
    this.startScale = options.startScale;
    this.endScale = options.endScale;
    this.drag = options.drag;

    this.sprite = new PixiParticle({
      texture,
      x: options.x,
      y: options.y,
      anchorX: 0.5,
      anchorY: 0.5,
      scaleX: options.startScale,
      scaleY: options.startScale,
      tint: options.tint,
    });
  }

  /** Advance the particle; returns false once it has expired. */
  update(dt: number): boolean {
    this.life -= dt;
    if (this.life <= 0) return false;

    const keep = Math.pow(this.drag, dt);
    this.vx *= keep;
    this.vy *= keep;
    this.sprite.x += this.vx * dt;
    this.sprite.y += this.vy * dt;

    const t = this.life / this.maxLife; // 1 -> 0
    this.sprite.alpha = t;
    const scale = this.endScale + (this.startScale - this.endScale) * t;
    this.sprite.scaleX = scale;
    this.sprite.scaleY = scale;
    return true;
  }
}
