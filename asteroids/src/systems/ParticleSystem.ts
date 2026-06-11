import { Graphics, ParticleContainer, type Renderer, type Texture } from 'pixi.js';
import { Particle } from '../entities/Particle';
import { rand, randInt, type Vec2 } from '../entities/components';

export interface BurstOptions {
  readonly count: number;
  readonly tint: number;
  readonly speedMin: number;
  readonly speedMax: number;
  readonly life: number;
  readonly startScale: number;
}

/** Owns the ParticleContainer and the lifecycle of every particle. */
export class ParticleSystem {
  readonly view: ParticleContainer;

  private readonly texture: Texture;
  private particles: Particle[] = [];

  constructor(renderer: Renderer) {
    this.view = new ParticleContainer({
      dynamicProperties: { position: true, scale: true, rotation: false, color: true },
    });
    const dot = new Graphics().circle(0, 0, 4).fill(0xffffff);
    this.texture = renderer.generateTexture(dot);
    dot.destroy();
  }

  /** Radial explosion burst — used when asteroids break or the ship dies. */
  burst(at: Vec2, options: BurstOptions): void {
    for (let i = 0; i < options.count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(options.speedMin, options.speedMax);
      this.add(
        new Particle(this.texture, {
          x: at.x,
          y: at.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: options.life * rand(0.6, 1),
          tint: options.tint,
          startScale: options.startScale * rand(0.6, 1.2),
          endScale: 0,
          drag: 0.2,
        }),
      );
    }
  }

  /** Continuous engine exhaust behind the thrusting ship. */
  trail(at: Vec2, backAngle: number): void {
    const count = 1 + randInt(2);
    for (let i = 0; i < count; i++) {
      const spread = rand(-0.35, 0.35);
      const speed = rand(60, 130);
      this.add(
        new Particle(this.texture, {
          x: at.x + rand(-2, 2),
          y: at.y + rand(-2, 2),
          vx: Math.cos(backAngle + spread) * speed,
          vy: Math.sin(backAngle + spread) * speed,
          life: rand(0.18, 0.32),
          tint: Math.random() > 0.4 ? 0xff6b35 : 0xffc14d,
          startScale: rand(0.35, 0.6),
          endScale: 0,
          drag: 0.5,
        }),
      );
    }
  }

  /** Single bright, fast-fading flash — bullet impact feedback. */
  flash(at: Vec2): void {
    this.add(
      new Particle(this.texture, {
        x: at.x,
        y: at.y,
        vx: 0,
        vy: 0,
        life: 0.14,
        tint: 0xffffff,
        startScale: 2.6,
        endScale: 4.5,
        drag: 1,
      }),
    );
  }

  update(dt: number): void {
    const survivors: Particle[] = [];
    for (const particle of this.particles) {
      if (particle.update(dt)) {
        survivors.push(particle);
      } else {
        this.view.removeParticle(particle.sprite);
      }
    }
    this.particles = survivors;
  }

  clear(): void {
    for (const particle of this.particles) {
      this.view.removeParticle(particle.sprite);
    }
    this.particles = [];
  }

  private add(particle: Particle): void {
    this.particles.push(particle);
    this.view.addParticle(particle.sprite);
  }
}
