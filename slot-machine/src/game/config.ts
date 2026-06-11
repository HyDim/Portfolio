export type SymbolId = 'cherry' | 'lemon' | 'orange' | 'bell' | 'seven';

export interface SymbolDef {
  readonly id: SymbolId;
  readonly label: string;
  readonly color: number;
}

export const SYMBOLS: readonly SymbolDef[] = [
  { id: 'cherry', label: 'CHERRY', color: 0xe2434e },
  { id: 'lemon', label: 'LEMON', color: 0xf2d33c },
  { id: 'orange', label: 'ORANGE', color: 0xf28b30 },
  { id: 'bell', label: 'BELL', color: 0xc9a86a },
  { id: 'seven', label: 'SEVEN', color: 0x00ff88 },
];

export const REEL_COUNT = 3;
export const VISIBLE_ROWS = 3;
export const CELL_WIDTH = 120;
export const CELL_HEIGHT = 90;
export const REEL_GAP = 14;
export const REEL_WINDOW_HEIGHT = VISIBLE_ROWS * CELL_HEIGHT;

export const START_BALANCE = 100;
export const SPIN_COST = 10;
export const WIN_PAYOUT = 50;
