export type InputAction = 'left' | 'right' | 'thrust' | 'fire' | 'restart';

const KEY_MAP: Readonly<Record<string, InputAction>> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'thrust',
  KeyW: 'thrust',
  Space: 'fire',
  Enter: 'restart',
};

export class InputSystem {
  private readonly held = new Set<InputAction>();
  private readonly pressed = new Set<InputAction>();

  constructor(target: Window) {
    target.addEventListener('keydown', (event: KeyboardEvent) => {
      const action = KEY_MAP[event.code];
      if (action === undefined) return;
      event.preventDefault();
      if (!event.repeat) this.pressed.add(action);
      this.held.add(action);
    });
    target.addEventListener('keyup', (event: KeyboardEvent) => {
      const action = KEY_MAP[event.code];
      if (action === undefined) return;
      this.held.delete(action);
    });
  }

  isDown(action: InputAction): boolean {
    return this.held.has(action);
  }

  /** True once per physical key press; clears the edge-trigger flag. */
  consumePressed(action: InputAction): boolean {
    if (!this.pressed.has(action)) return false;
    this.pressed.delete(action);
    return true;
  }

  /** Call at the end of each frame so stale edge-triggers don't pile up. */
  endFrame(): void {
    this.pressed.clear();
  }
}
