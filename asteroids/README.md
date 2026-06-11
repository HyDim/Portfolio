# Asteroids — PixiJS v8 + TypeScript

Classic Asteroids arcade game built with PixiJS v8, TypeScript (strict, no `any`), pixi-filters, and Howler.js. No image or audio assets — entities are drawn with `Graphics` and every sound is synthesised into WAV data URIs at startup.

## Features

- **Gameplay** — rotating/thrusting ship, asteroids in 3 sizes that split when shot (large → medium → small → destroyed), waves that grow each clear, 3 lives, score, game-over screen with restart (Enter or click)
- **Entities** — shared `Entity` shape (position, velocity, circle collider) over `Ship`, `Asteroid`, `Bullet`
- **Particles** — PixiJS `ParticleContainer`: 20–38 particle explosion bursts that fade and shrink over ~0.5s, continuous engine trail, bullet impact flash
- **Effects** — glow filters on ship and bullets (pixi-filters), screen shake on large asteroid destroys, respawn invulnerability blink
- **Audio (Howler.js)** — thrust loop while accelerating, laser shot, three explosion variants scaled to asteroid size, background heartbeat that speeds up as the field empties
- **Loop** — delta-time movement (frame-rate independent, clamped), circle-vs-circle collision system, toroidal screen wrap on everything

## Controls

| Key | Action |
| --- | --- |
| ← → / A D | rotate |
| ↑ / W | thrust |
| Space | fire |
| Enter | restart |

## Run

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build
```

## Structure

```
src/
  entities/
    components.ts   # Entity/Vec2/Collider shapes, wrap + rand helpers
    Ship.ts
    Asteroid.ts
    Bullet.ts
    Particle.ts     # single particle motion/fade state
  systems/
    CollisionSystem.ts
    ParticleSystem.ts
    InputSystem.ts
  audio/
    SoundManager.ts  # Howler.js over synthesised WAV data URIs
  main.ts            # game loop, waves, lives, HUD, screen shake
```
