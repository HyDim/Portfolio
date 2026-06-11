# Slot Machine — PixiJS v8 + TypeScript

A 3-reel slot machine built with PixiJS v8, TypeScript (strict, no `any`), GSAP, and the Web Audio API. No image or audio assets — symbols are rendered shapes and all sounds are synthesised.

## Features

- **Reel engine** — masked looping symbol strips with fast spin-up, constant cruise, and a decelerating settle with overshoot bounce (`back.out` easing); staggered stop timing across reels
- **State machine** — `IDLE → SPINNING → EVALUATING → WIN | LOSE → IDLE` with validated transitions
- **Win evaluation** — RNG stop positions, 3 matching symbols on the centre payline pays +50
- **Balance** — starts at 100 credits, −10 per spin, GSAP count-up animation on win
- **Audio** — Web Audio synthesis: noise-loop spin rumble, per-reel stop click, arpeggio win jingle
- **Effects** — winning symbols pulse, screen flash on win

## Run

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build
```

## Structure

```
src/
  game/
    config.ts        # symbols, dimensions, economy constants
    StateMachine.ts   # game flow FSM
    Reel.ts           # reel rendering + spin physics
    WinEvaluator.ts   # payline evaluation (pure logic)
  audio/
    SoundManager.ts   # Web Audio synthesis
  ui/
    BalanceDisplay.ts
    SpinButton.ts
  main.ts             # composition root
```
