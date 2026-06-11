import type { Container } from 'pixi.js';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Collider {
  readonly radius: number;
}

/** Common shape for anything that moves, collides, and renders. */
export interface Entity {
  readonly view: Container;
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly collider: Collider;
  alive: boolean;
}

/** Toroidal screen wrap: leaving one edge re-enters the opposite one. */
export function wrap(p: Vec2, width: number, height: number, margin: number): void {
  const spanX = width + margin * 2;
  const spanY = height + margin * 2;
  if (p.x < -margin) p.x += spanX;
  else if (p.x > width + margin) p.x -= spanX;
  if (p.y < -margin) p.y += spanY;
  else if (p.y > height + margin) p.y -= spanY;
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}
