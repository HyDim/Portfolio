import { Container, Graphics } from 'pixi.js';
import { type Collider, type Entity, type Vec2, rand, randInt, wrap } from './components';

export type AsteroidSize = 'large' | 'medium' | 'small';

interface SizeDef {
  readonly radius: number;
  readonly speedMin: number;
  readonly speedMax: number;
  readonly score: number;
  readonly next: AsteroidSize | null;
}

const SIZES: Readonly<Record<AsteroidSize, SizeDef>> = {
  large: { radius: 42, speedMin: 35, speedMax: 70, score: 20, next: 'medium' },
  medium: { radius: 25, speedMin: 65, speedMax: 115, score: 50, next: 'small' },
  small: { radius: 13, speedMin: 110, speedMax: 175, score: 100, next: null },
};

export class Asteroid implements Entity {
  readonly view: Container;
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly collider: Collider;
  readonly size: AsteroidSize;
  alive = true;

  private readonly spin: number;

  constructor(size: AsteroidSize, x: number, y: number, direction?: number) {
    this.size = size;
    const def = SIZES[size];
    this.position = { x, y };
    this.collider = { radius: def.radius * 0.88 };

    const angle = direction ?? rand(0, Math.PI * 2);
    const speed = rand(def.speedMin, def.speedMax);
    this.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
    this.spin = rand(-1.2, 1.2);

    this.view = new Container();
    this.view.addChild(Asteroid.makeShape(def.radius));
    this.view.position.set(x, y);
  }

  get score(): number {
    return SIZES[this.size].score;
  }

  update(dt: number, width: number, height: number): void {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    wrap(this.position, width, height, SIZES[this.size].radius);
    this.view.position.set(this.position.x, this.position.y);
    this.view.rotation += this.spin * dt;
  }

  /** Break into two of the next size down; smallest returns nothing. */
  split(): Asteroid[] {
    const next = SIZES[this.size].next;
    if (next === null) return [];
    const base = rand(0, Math.PI * 2);
    return [
      new Asteroid(next, this.position.x, this.position.y, base),
      new Asteroid(next, this.position.x, this.position.y, base + Math.PI * rand(0.6, 1.4)),
    ];
  }

  /** Spawn a large asteroid on a random screen edge, drifting inward. */
  static spawnFromEdge(width: number, height: number): Asteroid {
    const edge = randInt(4);
    let x: number;
    let y: number;
    if (edge === 0) {
      x = -40;
      y = rand(0, height);
    } else if (edge === 1) {
      x = width + 40;
      y = rand(0, height);
    } else if (edge === 2) {
      x = rand(0, width);
      y = -40;
    } else {
      x = rand(0, width);
      y = height + 40;
    }
    const toCenter = Math.atan2(height / 2 - y, width / 2 - x);
    return new Asteroid('large', x, y, toCenter + rand(-0.7, 0.7));
  }

  private static makeShape(radius: number): Graphics {
    const points: number[] = [];
    const vertexCount = 9 + randInt(4);
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const r = radius * rand(0.74, 1.06);
      points.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    return new Graphics()
      .poly(points)
      .stroke({ width: 1.5, color: 0x8da3b8 })
      .fill({ color: 0x101822, alpha: 0.85 });
  }
}
