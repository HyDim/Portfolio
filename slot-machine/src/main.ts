import { Application, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  REEL_COUNT,
  REEL_GAP,
  REEL_WINDOW_HEIGHT,
  SPIN_COST,
  START_BALANCE,
  WIN_PAYOUT,
} from './game/config';
import { StateMachine } from './game/StateMachine';
import { Reel } from './game/Reel';
import { WinEvaluator } from './game/WinEvaluator';
import { SoundManager } from './audio/SoundManager';
import { BalanceDisplay } from './ui/BalanceDisplay';
import { SpinButton } from './ui/SpinButton';

const WIDTH = 560;
const HEIGHT = 640;

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

async function bootstrap(): Promise<void> {
  const app = new Application();
  await app.init({ width: WIDTH, height: HEIGHT, background: '#080d14', antialias: true });
  const mount = document.getElementById('app');
  if (mount === null) throw new Error('Missing #app mount point');
  mount.appendChild(app.canvas);

  const machine = new StateMachine();
  const evaluator = new WinEvaluator(WIN_PAYOUT);
  const sound = new SoundManager();
  let balance = START_BALANCE;

  // ── Static chrome ────────────────────────────────────────────────
  const title = new Text({
    text: 'SLOT MACHINE',
    style: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: 6,
      fill: 0xffffff,
    },
  });
  title.anchor.set(0.5, 0);
  title.position.set(WIDTH / 2, 26);
  app.stage.addChild(title);

  const subtitle = new Text({
    text: '3 OF A KIND ON THE CENTER ROW PAYS +' + String(WIN_PAYOUT),
    style: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: 10,
      letterSpacing: 2,
      fill: 0x5a7084,
    },
  });
  subtitle.anchor.set(0.5, 0);
  subtitle.position.set(WIDTH / 2, 60);
  app.stage.addChild(subtitle);

  const balanceDisplay = new BalanceDisplay(balance);
  balanceDisplay.view.position.set(24, 24);
  app.stage.addChild(balanceDisplay.view);

  // ── Reels ────────────────────────────────────────────────────────
  const reelsTotalWidth = REEL_COUNT * CELL_WIDTH + (REEL_COUNT - 1) * REEL_GAP;
  const reelsX = (WIDTH - reelsTotalWidth) / 2;
  const reelsY = 110;

  const frame = new Graphics()
    .roundRect(reelsX - 16, reelsY - 16, reelsTotalWidth + 32, REEL_WINDOW_HEIGHT + 32, 12)
    .fill(0x0d1520)
    .stroke({ width: 1, color: 0x1a2535 });
  app.stage.addChild(frame);

  const reels: Reel[] = [];
  for (let i = 0; i < REEL_COUNT; i++) {
    const reel = new Reel();
    reel.view.position.set(reelsX + i * (CELL_WIDTH + REEL_GAP), reelsY);
    app.stage.addChild(reel.view);
    reels.push(reel);
  }

  const payline = new Graphics()
    .roundRect(reelsX - 10, reelsY + CELL_HEIGHT - 3, reelsTotalWidth + 20, CELL_HEIGHT + 6, 6)
    .stroke({ width: 2, color: 0x00ff88, alpha: 0.5 });
  app.stage.addChild(payline);

  // ── Message + controls ───────────────────────────────────────────
  const message = new Text({
    text: '',
    style: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 3,
      fill: 0x00ff88,
    },
  });
  message.anchor.set(0.5);
  message.position.set(WIDTH / 2, reelsY + REEL_WINDOW_HEIGHT + 62);
  message.visible = false;
  app.stage.addChild(message);

  const spinButton = new SpinButton(() => requestSpin());
  spinButton.view.position.set(WIDTH / 2, HEIGHT - 80);
  app.stage.addChild(spinButton.view);

  const costNote = new Text({
    text: `${SPIN_COST} CREDITS PER SPIN`,
    style: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: 10,
      letterSpacing: 2,
      fill: 0x5a7084,
    },
  });
  costNote.anchor.set(0.5);
  costNote.position.set(WIDTH / 2, HEIGHT - 42);
  app.stage.addChild(costNote);

  const flashOverlay = new Graphics().rect(0, 0, WIDTH, HEIGHT).fill(0xffffff);
  flashOverlay.alpha = 0;
  flashOverlay.eventMode = 'none';
  app.stage.addChild(flashOverlay);

  function showMessage(text: string, color: number): void {
    message.text = text;
    message.style.fill = color;
    message.visible = true;
    message.alpha = 0;
    gsap.to(message, { alpha: 1, duration: 0.25 });
  }

  function screenFlash(): void {
    gsap.fromTo(
      flashOverlay,
      { alpha: 0.35 },
      { alpha: 0, duration: 0.5, ease: 'power2.out' },
    );
  }

  // ── Game flow ────────────────────────────────────────────────────
  function requestSpin(): void {
    if (machine.state !== 'IDLE' || balance < SPIN_COST) return;
    balance -= SPIN_COST;
    balanceDisplay.set(balance);
    machine.transition('SPINNING');
  }

  machine.onEnter('SPINNING', () => {
    spinButton.enabled = false;
    message.visible = false;
    sound.startSpinLoop();
    const spins = reels.map((reel, i) =>
      reel
        .spinTo(randomInt(reel.stripLength), i)
        .then(() => sound.playReelStop()),
    );
    void Promise.all(spins).then(() => {
      sound.stopSpinLoop();
      machine.transition('EVALUATING');
    });
  });

  machine.onEnter('EVALUATING', () => {
    const result = evaluator.evaluate(reels.map((reel) => reel.centerSymbol));
    machine.transition(result.isWin ? 'WIN' : 'LOSE');
  });

  machine.onEnter('WIN', () => {
    balance += WIN_PAYOUT;
    sound.playWinJingle();
    screenFlash();
    reels.forEach((reel) => reel.pulseCenter());
    balanceDisplay.animateTo(balance);
    showMessage(`WIN! +${WIN_PAYOUT} CREDITS`, 0x00ff88);
    gsap.delayedCall(1.7, () => machine.transition('IDLE'));
  });

  machine.onEnter('LOSE', () => {
    showMessage('NO WIN — TRY AGAIN', 0x5a7084);
    gsap.delayedCall(0.9, () => machine.transition('IDLE'));
  });

  machine.onEnter('IDLE', () => {
    if (balance >= SPIN_COST) {
      spinButton.enabled = true;
    } else {
      spinButton.enabled = false;
      showMessage('OUT OF CREDITS', 0xff6b35);
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      requestSpin();
    }
  });
}

void bootstrap();
