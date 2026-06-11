import { Container, Graphics } from 'pixi.js';
import { type Collider, type Entity, type Vec2, wrap } from './components';

const ROTATION_SPEED = 4.3; // rad/s
const THRUST = 360; // px/s^2
const MAX_SPEED = 400; // px/s
const DRAG = 0.45; // fraction of velocity retained per second

export class Ship implements Entity {
  readonly view: Container;
  readonly position: Vec2;
  readonly velocity: Vec2 = { x: 0, y: 0 };
  readonly collider: Collider = { radius: 11 };
  alive = true;
  rotation = -Math.PI / 2;
  thrusting = false;
  invulnerableFor = 0;

  private readonly flame: Graphics;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.view = new Container();

    // body points along +x; rotation steers it
    const body = new Graphics()
      .poly([16, 0, -11, 9, -6, 0, -11, -9])
      .stroke({ width: 1.6, color: 0x00ff88 })
      .fill({ color: 0x00ff88, alpha: 0.08 });

    this.flame = new Graphics()
      .poly([-9, 4, -18, 0, -9, -4])
      .stroke({ width: 1.4, color: 0xff6b35 });
    this.flame.visible = false;

    this.view.addChild(this.flame, body);
    this.syncView();
  }

  rotate(direction: -1 | 0 | 1, dt: number): void {
    this.rotation += direction * ROTATION_SPEED * dt;
  }

  update(dt: number, width: number, height: number): void {
    if (this.thrusting) {
      this.velocity.x += Math.cos(this.rotation) * THRUST * dt;
      this.velocity.y += Math.sin(this.rotation) * THRUST * dt;
    }

    const keep = Math.pow(DRAG, dt);
    this.velocity.x *= keep;
    this.velocity.y *= keep;

    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
    }

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    wrap(this.position, width, height, this.collider.radius);

    if (this.invulnerableFor > 0) {
      this.invulnerableFor = Math.max(0, this.invulnerableFor - dt);
      // respawn blink
      this.view.alpha = Math.sin(this.invulnerableFor * 24) > 0 ? 0.25 : 1;
    } else {
      this.view.alpha = 1;
    }

    this.flame.visible = this.thrusting && Math.random() > 0.25;
    this.syncView();
  }

  get isInvulnerable(): boolean {
    return this.invulnerableFor > 0;
  }

  /** World position of the gun muzzle (ship nose). */
  get nose(): Vec2 {
    return {
      x: this.position.x + Math.cos(this.rotation) * 17,
      y: this.position.y + Math.sin(this.rotation) * 17,
    };
  }

  /** World position just behind the ship, where the engine trail emits. */
  get tail(): Vec2 {
    return {
      x: this.position.x - Math.cos(this.rotation) * 12,
      y: this.position.y - Math.sin(this.rotation) * 12,
    };
  }

  respawn(x: number, y: number, invulnerableSeconds: number): void {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.rotation = -Math.PI / 2;
    this.alive = true;
    this.invulnerableFor = invulnerableSeconds;
    this.view.visible = true;
    this.syncView();
  }

  private syncView(): void {
    this.view.position.set(this.position.x, this.position.y);
    this.view.rotation = this.rotation;
  }
}
