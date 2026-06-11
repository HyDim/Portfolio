import { Container, Graphics, Text } from 'pixi.js';

const WIDTH = 190;
const HEIGHT = 54;

export class SpinButton {
  readonly view: Container;

  private readonly bg: Graphics;
  private readonly label: Text;
  private enabledState = true;
  private hovered = false;

  constructor(onPress: () => void) {
    this.view = new Container();
    this.bg = new Graphics();
    this.label = new Text({
      text: 'SPIN',
      style: {
        fontFamily: 'ui-monospace, monospace',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 5,
        fill: 0x00ff88,
      },
    });
    this.label.anchor.set(0.5);
    this.view.addChild(this.bg, this.label);

    this.view.eventMode = 'static';
    this.view.cursor = 'pointer';
    this.view.on('pointertap', () => {
      if (this.enabledState) onPress();
    });
    this.view.on('pointerover', () => {
      this.hovered = true;
      this.redraw();
    });
    this.view.on('pointerout', () => {
      this.hovered = false;
      this.redraw();
    });

    this.redraw();
  }

  get enabled(): boolean {
    return this.enabledState;
  }

  set enabled(value: boolean) {
    this.enabledState = value;
    this.view.eventMode = value ? 'static' : 'none';
    this.redraw();
  }

  private redraw(): void {
    const color = this.enabledState ? 0x00ff88 : 0x2a3a4a;
    const fillAlpha = this.enabledState ? (this.hovered ? 0.22 : 0.1) : 0.05;
    this.bg
      .clear()
      .roundRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, 8)
      .fill({ color, alpha: fillAlpha })
      .stroke({ width: 1.5, color, alpha: this.enabledState ? 1 : 0.6 });
    this.label.style.fill = color;
    this.view.alpha = this.enabledState ? 1 : 0.7;
  }
}
