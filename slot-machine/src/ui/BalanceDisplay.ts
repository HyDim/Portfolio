import { Container, Text } from 'pixi.js';
import gsap from 'gsap';

export class BalanceDisplay {
  readonly view: Container;

  private readonly valueText: Text;
  private displayed: number;

  constructor(initial: number) {
    this.displayed = initial;
    this.view = new Container();

    const label = new Text({
      text: 'BALANCE',
      style: {
        fontFamily: 'ui-monospace, monospace',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 2,
        fill: 0x5a7084,
      },
    });

    this.valueText = new Text({
      text: this.format(initial),
      style: {
        fontFamily: 'ui-monospace, monospace',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 1,
        fill: 0x00d4ff,
      },
    });
    this.valueText.y = 16;

    this.view.addChild(label, this.valueText);
  }

  /** Immediate update (e.g. deducting the spin cost). */
  set(value: number): void {
    gsap.killTweensOf(this);
    this.displayed = value;
    this.valueText.text = this.format(value);
  }

  /** Count-up animation (e.g. crediting a win). */
  animateTo(value: number): void {
    gsap.killTweensOf(this);
    gsap.to(this, {
      displayed: value,
      duration: 0.9,
      ease: 'power1.out',
      onUpdate: () => {
        this.valueText.text = this.format(Math.round(this.displayed));
      },
    });
  }

  private format(value: number): string {
    return `${value} CR`;
  }
}
