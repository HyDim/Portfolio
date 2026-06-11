import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  REEL_WINDOW_HEIGHT,
  SYMBOLS,
  type SymbolDef,
  type SymbolId,
} from './config';

interface Cell {
  readonly root: Container;
  readonly bg: Graphics;
  readonly label: Text;
  symbolId: SymbolId | null;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function shuffled<T>(source: readonly T[]): T[] {
  const result = [...source];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = result[i] as T;
    result[i] = result[j] as T;
    result[j] = a;
  }
  return result;
}

/**
 * One reel: a masked window of 3 rows over a looping symbol strip.
 * `position` is measured in symbol units; the symbol whose strip index
 * equals round(position) sits on the centre payline.
 */
export class Reel {
  readonly view: Container;

  private readonly strip: readonly SymbolDef[];
  private readonly cells: Cell[] = [];
  private centerCell: Cell;
  private position = 0;
  private timeline: gsap.core.Timeline | null = null;

  constructor() {
    this.strip = shuffled(SYMBOLS);
    this.view = new Container();

    const bg = new Graphics()
      .roundRect(0, 0, CELL_WIDTH, REEL_WINDOW_HEIGHT, 6)
      .fill(0x0a121c);
    this.view.addChild(bg);

    const symbolLayer = new Container();
    this.view.addChild(symbolLayer);

    const mask = new Graphics().rect(0, 0, CELL_WIDTH, REEL_WINDOW_HEIGHT).fill(0xffffff);
    this.view.addChild(mask);
    symbolLayer.mask = mask;

    // 2 spare cells beyond the window so symbols stream in seamlessly
    for (let i = 0; i < 5; i++) {
      const root = new Container();
      root.x = CELL_WIDTH / 2;
      const cellBg = new Graphics();
      const label = new Text({
        text: '',
        style: {
          fontFamily: 'ui-monospace, monospace',
          fontSize: 15,
          fontWeight: '700',
          letterSpacing: 1,
          fill: 0x08111c,
        },
      });
      label.anchor.set(0.5);
      root.addChild(cellBg, label);
      symbolLayer.addChild(root);
      this.cells.push({ root, bg: cellBg, label, symbolId: null });
    }
    this.centerCell = this.cells[2] as Cell;

    this.draw();
  }

  get stripLength(): number {
    return this.strip.length;
  }

  get centerSymbol(): SymbolId {
    const def = this.strip[mod(Math.round(this.position), this.strip.length)] as SymbolDef;
    return def.id;
  }

  get isSpinning(): boolean {
    return this.timeline?.isActive() ?? false;
  }

  /**
   * Spin to land `stopIndex` on the centre row. Fast spin-up, constant
   * cruise, then a decelerating settle with a slight overshoot bounce.
   * `extraLoops` lengthens the cruise so reels stop staggered.
   */
  spinTo(stopIndex: number, extraLoops: number): Promise<void> {
    const len = this.strip.length;
    const accelDistance = 1.2;
    const settleDistance = 2;
    const cruiseSpeed = 13; // symbols per second

    // Land below the current position (reel streams downward),
    // on an integer congruent to stopIndex.
    const minTarget = Math.round(this.position) - (4 + extraLoops) * len;
    const target = minTarget - mod(minTarget - stopIndex, len);
    const cruiseDistance = this.position - target - accelDistance - settleDistance;

    this.timeline?.kill();
    const tl = gsap.timeline({ onUpdate: () => this.draw() });
    tl.to(this, {
      position: this.position - accelDistance,
      duration: 0.28,
      ease: 'power2.in',
    });
    tl.to(this, {
      position: target + settleDistance,
      duration: cruiseDistance / cruiseSpeed,
      ease: 'none',
    });
    tl.to(this, {
      position: target,
      duration: 0.55,
      ease: 'back.out(1.7)',
    });
    this.timeline = tl;
    return new Promise((resolve) => {
      tl.eventCallback('onComplete', () => resolve());
    });
  }

  /** Pulse the centre symbol — used for win celebration. */
  pulseCenter(): void {
    gsap.to(this.centerCell.root.scale, {
      x: 1.16,
      y: 1.16,
      duration: 0.18,
      repeat: 5,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  private draw(): void {
    const len = this.strip.length;
    const base = Math.floor(this.position);
    const centerIndex = Math.round(this.position);
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i] as Cell;
      const stripIndex = base - 2 + i;
      const def = this.strip[mod(stripIndex, len)] as SymbolDef;
      this.applySymbol(cell, def);
      cell.root.y = REEL_WINDOW_HEIGHT / 2 + (stripIndex - this.position) * CELL_HEIGHT;
      if (stripIndex === centerIndex) this.centerCell = cell;
    }
  }

  private applySymbol(cell: Cell, def: SymbolDef): void {
    if (cell.symbolId === def.id) return;
    cell.symbolId = def.id;
    cell.bg
      .clear()
      .roundRect(-CELL_WIDTH / 2 + 7, -CELL_HEIGHT / 2 + 6, CELL_WIDTH - 14, CELL_HEIGHT - 12, 8)
      .fill(def.color)
      .stroke({ width: 1, color: 0x08111c, alpha: 0.45 });
    cell.label.text = def.label;
  }
}
