import { Application, Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { Ship } from './entities/Ship';
import { Asteroid } from './entities/Asteroid';
import { Bullet } from './entities/Bullet';
import { rand } from './entities/components';
import { CollisionSystem } from './systems/CollisionSystem';
import { ParticleSystem } from './systems/ParticleSystem';
import { InputSystem } from './systems/InputSystem';
import { SoundManager } from './audio/SoundManager';

const WIDTH = 800;
const HEIGHT = 600;
const START_LIVES = 3;
const FIRE_COOLDOWN = 0.22; // s
const RESPAWN_DELAY = 1; // s
const RESPAWN_INVULNERABILITY = 2.5; // s

const HUD_STYLE: TextStyleOptions = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: 16,
  fontWeight: '700',
  letterSpacing: 2,
  fill: 0xc8d6e5,
};

type GamePhase = 'PLAYING' | 'GAMEOVER';

class Game {
  private readonly world: Container;
  private readonly asteroidLayer = new Container();
  private readonly bulletLayer = new Container();
  private readonly particles: ParticleSystem;
  private readonly input = new InputSystem(window);
  private readonly sound = new SoundManager();

  private readonly ship: Ship;
  private asteroids: Asteroid[] = [];
  private bullets: Bullet[] = [];

  private phase: GamePhase = 'PLAYING';
  private score = 0;
  private lives = START_LIVES;
  private wave = 0;
  private fireCooldown = 0;
  private respawnIn = 0;
  private shakeTime = 0;
  private shakeStrength = 0;

  private readonly scoreText: Text;
  private readonly livesText: Text;
  private readonly gameOverLayer: Container;
  private readonly finalScoreText: Text;

  constructor(private readonly app: Application) {
    this.world = new Container();
    app.stage.addChild(this.world);

    // faint starfield backdrop
    const stars = new Graphics();
    for (let i = 0; i < 70; i++) {
      stars.circle(rand(0, WIDTH), rand(0, HEIGHT), rand(0.4, 1.3)).fill({
        color: 0xc8d6e5,
        alpha: rand(0.08, 0.35),
      });
    }
    this.world.addChild(stars);

    this.particles = new ParticleSystem(app.renderer);
    this.world.addChild(this.particles.view);

    this.world.addChild(this.asteroidLayer);

    this.bulletLayer.filters = [
      new GlowFilter({ distance: 10, outerStrength: 2.2, color: 0x00d4ff, quality: 0.25 }),
    ];
    this.world.addChild(this.bulletLayer);

    this.ship = new Ship(WIDTH / 2, HEIGHT / 2);
    this.ship.view.filters = [
      new GlowFilter({ distance: 12, outerStrength: 1.8, color: 0x00ff88, quality: 0.25 }),
    ];
    this.world.addChild(this.ship.view);

    // ── HUD ──────────────────────────────────────────────────────
    this.scoreText = new Text({ text: 'SCORE 0', style: HUD_STYLE });
    this.scoreText.position.set(20, 16);
    app.stage.addChild(this.scoreText);

    this.livesText = new Text({ text: '', style: { ...HUD_STYLE, fill: 0x00ff88 } });
    this.livesText.anchor.set(1, 0);
    this.livesText.position.set(WIDTH - 20, 16);
    app.stage.addChild(this.livesText);

    // ── Game over overlay ────────────────────────────────────────
    this.gameOverLayer = new Container();
    const dim = new Graphics().rect(0, 0, WIDTH, HEIGHT).fill({ color: 0x04080e, alpha: 0.78 });
    const gameOverText = new Text({
      text: 'GAME OVER',
      style: { ...HUD_STYLE, fontSize: 44, letterSpacing: 10, fill: 0xff6b35 },
    });
    gameOverText.anchor.set(0.5);
    gameOverText.position.set(WIDTH / 2, HEIGHT / 2 - 48);
    this.finalScoreText = new Text({
      text: '',
      style: { ...HUD_STYLE, fontSize: 20, fill: 0xc8d6e5 },
    });
    this.finalScoreText.anchor.set(0.5);
    this.finalScoreText.position.set(WIDTH / 2, HEIGHT / 2 + 6);
    const restartText = new Text({
      text: 'PRESS ENTER TO RESTART',
      style: { ...HUD_STYLE, fontSize: 14, fill: 0x00ff88 },
    });
    restartText.anchor.set(0.5);
    restartText.position.set(WIDTH / 2, HEIGHT / 2 + 52);
    this.gameOverLayer.addChild(dim, gameOverText, this.finalScoreText, restartText);
    this.gameOverLayer.visible = false;
    this.gameOverLayer.eventMode = 'static';
    this.gameOverLayer.cursor = 'pointer';
    this.gameOverLayer.on('pointertap', () => this.restart());
    app.stage.addChild(this.gameOverLayer);

    this.updateHud();
    this.spawnWave();
    this.sound.startPulse();

    app.ticker.add(() => {
      const dt = Math.min(this.app.ticker.deltaMS / 1000, 1 / 30);
      this.update(dt);
      this.input.endFrame();
    });
  }

  // ── Frame update ───────────────────────────────────────────────
  private update(dt: number): void {
    if (this.phase === 'GAMEOVER') {
      if (this.input.consumePressed('restart')) this.restart();
    } else {
      this.updatePlaying(dt);
    }

    for (const asteroid of this.asteroids) asteroid.update(dt, WIDTH, HEIGHT);
    for (const bullet of this.bullets) bullet.update(dt, WIDTH, HEIGHT);
    this.bullets = this.bullets.filter((b) => {
      if (!b.alive) this.bulletLayer.removeChild(b.view);
      return b.alive;
    });

    this.particles.update(dt);
    this.updateShake(dt);
  }

  private updatePlaying(dt: number): void {
    const ship = this.ship;

    if (ship.alive) {
      const turn = (this.input.isDown('right') ? 1 : 0) - (this.input.isDown('left') ? 1 : 0);
      ship.rotate(turn as -1 | 0 | 1, dt);
      ship.thrusting = this.input.isDown('thrust');
      ship.update(dt, WIDTH, HEIGHT);
      this.sound.setThrusting(ship.thrusting);
      if (ship.thrusting) this.particles.trail(ship.tail, ship.rotation + Math.PI);

      this.fireCooldown -= dt;
      if (this.input.isDown('fire') && this.fireCooldown <= 0) {
        this.fireCooldown = FIRE_COOLDOWN;
        const bullet = new Bullet(ship.nose, ship.rotation);
        this.bullets.push(bullet);
        this.bulletLayer.addChild(bullet.view);
        this.sound.playShoot();
      }
    } else {
      this.sound.setThrusting(false);
      this.respawnIn -= dt;
      if (this.respawnIn <= 0) {
        ship.respawn(WIDTH / 2, HEIGHT / 2, RESPAWN_INVULNERABILITY);
      }
    }

    // bullets vs asteroids
    CollisionSystem.forEachHit(this.bullets, this.asteroids, (bullet, asteroid) => {
      bullet.alive = false;
      this.particles.flash(bullet.position);
      this.destroyAsteroid(asteroid);
    });

    // ship vs asteroids
    if (ship.alive && !ship.isInvulnerable) {
      const hit = CollisionSystem.firstHit(ship, this.asteroids);
      if (hit !== null) this.killShip();
    }

    if (this.asteroids.length === 0) this.spawnWave();
  }

  // ── Events ─────────────────────────────────────────────────────
  private destroyAsteroid(asteroid: Asteroid): void {
    asteroid.alive = false;
    this.asteroidLayer.removeChild(asteroid.view);
    this.asteroids = this.asteroids.filter((a) => a.alive);

    this.score += asteroid.score;
    this.sound.playExplosion(asteroid.size);
    this.particles.burst(asteroid.position, {
      count: asteroid.size === 'large' ? 38 : asteroid.size === 'medium' ? 28 : 20,
      tint: 0x8da3b8,
      speedMin: 40,
      speedMax: asteroid.size === 'large' ? 260 : 200,
      life: 0.5,
      startScale: 0.7,
    });
    if (asteroid.size === 'large') this.shake(0.35, 9);

    for (const fragment of asteroid.split()) {
      this.asteroids.push(fragment);
      this.asteroidLayer.addChild(fragment.view);
    }
    this.sound.setAsteroidCount(this.asteroids.length);
    this.updateHud();
  }

  private killShip(): void {
    this.ship.alive = false;
    this.ship.view.visible = false;
    this.sound.playExplosion('large');
    this.particles.burst(this.ship.position, {
      count: 36,
      tint: 0x00ff88,
      speedMin: 50,
      speedMax: 240,
      life: 0.6,
      startScale: 0.7,
    });
    this.shake(0.4, 11);

    this.lives -= 1;
    this.updateHud();
    if (this.lives <= 0) {
      this.phase = 'GAMEOVER';
      this.finalScoreText.text = `FINAL SCORE ${this.score}`;
      this.gameOverLayer.visible = true;
      this.sound.stopPulse();
      this.sound.setThrusting(false);
    } else {
      this.respawnIn = RESPAWN_DELAY;
    }
  }

  private spawnWave(): void {
    this.wave += 1;
    const count = 2 + this.wave;
    for (let i = 0; i < count; i++) {
      const asteroid = Asteroid.spawnFromEdge(WIDTH, HEIGHT);
      this.asteroids.push(asteroid);
      this.asteroidLayer.addChild(asteroid.view);
    }
    this.sound.setAsteroidCount(this.asteroids.length);
  }

  private restart(): void {
    for (const asteroid of this.asteroids) this.asteroidLayer.removeChild(asteroid.view);
    for (const bullet of this.bullets) this.bulletLayer.removeChild(bullet.view);
    this.asteroids = [];
    this.bullets = [];
    this.particles.clear();

    this.score = 0;
    this.lives = START_LIVES;
    this.wave = 0;
    this.fireCooldown = 0;
    this.phase = 'PLAYING';
    this.gameOverLayer.visible = false;
    this.ship.respawn(WIDTH / 2, HEIGHT / 2, RESPAWN_INVULNERABILITY);
    this.updateHud();
    this.spawnWave();
    this.sound.startPulse();
  }

  // ── Presentation helpers ───────────────────────────────────────
  private shake(duration: number, strength: number): void {
    this.shakeTime = Math.max(this.shakeTime, duration);
    this.shakeStrength = Math.max(this.shakeStrength, strength);
  }

  private updateShake(dt: number): void {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const falloff = Math.max(this.shakeTime, 0) * this.shakeStrength * 2.8;
      this.world.position.set(rand(-falloff, falloff), rand(-falloff, falloff));
      if (this.shakeTime <= 0) {
        this.shakeStrength = 0;
        this.world.position.set(0, 0);
      }
    }
  }

  private updateHud(): void {
    this.scoreText.text = `SCORE ${this.score}`;
    this.livesText.text = '▲ '.repeat(Math.max(this.lives, 0)).trimEnd();
  }
}

async function bootstrap(): Promise<void> {
  const app = new Application();
  await app.init({ width: WIDTH, height: HEIGHT, background: '#080d14', antialias: true });
  const mount = document.getElementById('app');
  if (mount === null) throw new Error('Missing #app mount point');
  mount.appendChild(app.canvas);
  new Game(app);
}

void bootstrap();
