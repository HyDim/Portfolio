import { Container, Graphics } from 'pixi.js';
import { type Collider, type Entity, type Vec2, wrap } from './components';

const SPEED = 500; // px/s
const LIFETIME = 1.05; // s

export class Bullet implements Entity {
  readonly view: Container;
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly collider: Collider = { radius: 3 };
  alive = true;

  private life = LIFETIME;

  constructor(origin: Vec2, angle: number) {
    this.position = { x: origin.x, y: origin.y };
    this.velocity = { x: Math.cos(angle) * SPEED, y: Math.sin(angle) * SPEED };

    this.view = new Container();
    const dot = new Graphics()
      .roundRect(-5, -1.5, 10, 3, 1.5)
      .fill(0x00d4ff);
    this.view.addChild(dot);
    this.view.rotation = angle;
    this.view.position.set(origin.x, origin.y);
  }

  update(dt: number, width: number, height: number): void {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    wrap(this.position, width, height, 6);
    this.view.position.set(this.position.x, this.position.y);
  }
}
