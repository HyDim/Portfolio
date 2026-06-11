import type { SymbolId } from './config';

export interface WinResult {
  readonly isWin: boolean;
  readonly symbol: SymbolId | null;
  readonly payout: number;
}

/** Evaluates the centre payline: all symbols matching pays out. */
export class WinEvaluator {
  constructor(private readonly payout: number) {}

  evaluate(centerRow: readonly SymbolId[]): WinResult {
    const first = centerRow[0];
    const isWin =
      first !== undefined && centerRow.length > 1 && centerRow.every((s) => s === first);
    return isWin
      ? { isWin: true, symbol: first, payout: this.payout }
      : { isWin: false, symbol: null, payout: 0 };
  }
}
