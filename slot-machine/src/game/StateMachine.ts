export type GameState = 'IDLE' | 'SPINNING' | 'EVALUATING' | 'WIN' | 'LOSE';

const TRANSITIONS: Readonly<Record<GameState, readonly GameState[]>> = {
  IDLE: ['SPINNING'],
  SPINNING: ['EVALUATING'],
  EVALUATING: ['WIN', 'LOSE'],
  WIN: ['IDLE'],
  LOSE: ['IDLE'],
};

export type StateListener = (next: GameState, previous: GameState) => void;

/**
 * Minimal finite state machine for the game flow:
 * IDLE -> SPINNING -> EVALUATING -> WIN | LOSE -> IDLE
 */
export class StateMachine {
  private current: GameState = 'IDLE';
  private readonly enterListeners = new Map<GameState, StateListener[]>();

  get state(): GameState {
    return this.current;
  }

  canTransition(to: GameState): boolean {
    return TRANSITIONS[this.current].includes(to);
  }

  transition(to: GameState): void {
    if (!this.canTransition(to)) {
      throw new Error(`Illegal state transition: ${this.current} -> ${to}`);
    }
    const previous = this.current;
    this.current = to;
    for (const listener of this.enterListeners.get(to) ?? []) {
      listener(to, previous);
    }
  }

  onEnter(state: GameState, listener: StateListener): void {
    const listeners = this.enterListeners.get(state) ?? [];
    listeners.push(listener);
    this.enterListeners.set(state, listeners);
  }
}
