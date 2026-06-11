import { Application } from 'pixi.js';
import { DEFAULT_CONFIG, type AnimationConfig } from './types/AnimationConfig';
import { SpritesheetLoader, type SpritesheetData } from './editor/SpritesheetLoader';
import { AnimationPlayer } from './editor/AnimationPlayer';
import { FrameTimeline } from './editor/FrameTimeline';
import { ControlPanel } from './ui/ControlPanel';
import { ExportPanel } from './ui/ExportPanel';
import { FrameAudio } from './audio/FrameAudio';

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 12;

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`Missing #${id}`);
  return element;
}

async function bootstrap(): Promise<void> {
  const stageWrap = requireElement('stage-wrap');
  const zoomLabel = requireElement('zoom-label');

  // Single source of truth — every module reads/writes this one object.
  const config: AnimationConfig = { ...DEFAULT_CONFIG };

  const app = new Application();
  await app.init({ resizeTo: stageWrap, backgroundAlpha: 0, antialias: false });
  stageWrap.appendChild(app.canvas);

  let sheet: SpritesheetData = SpritesheetLoader.demoSheet();
  let zoom = 2;

  const frameAudio = new FrameAudio();

  const timeline = new FrameTimeline(requireElement('timeline-panel'), {
    onSelect: (frameIndex) => player.goTo(frameIndex),
    onAudioDrop: (frameIndex, file) => {
      void frameAudio.assign(frameIndex, file).then((ok) => {
        timeline.markSound(frameIndex, ok && frameAudio.has(frameIndex));
      });
    },
  });

  const player = new AnimationPlayer(config, (frameIndex, viaPlayback) => {
    timeline.highlight(frameIndex);
    if (viaPlayback) frameAudio.play(frameIndex);
    controls.setPlaying(player.isPlaying);
  });
  app.stage.addChild(player.sprite);

  const controlsMount = requireElement('controls');
  const controls = new ControlPanel(controlsMount, config, {
    onSheetConfigChange: () => rebuild(),
    onPlaybackConfigChange: () => exportPanel.refresh(),
    onPlayToggle: () => controls.setPlaying(player.toggle()),
    onStep: (direction) => player.step(direction),
    onBackgroundColor: (color) => {
      stageWrap.classList.remove('checker');
      stageWrap.style.background = color;
    },
    onCheckerToggle: (checked) => {
      stageWrap.style.background = '';
      stageWrap.classList.toggle('checker', checked);
    },
  });
  const exportPanel = new ExportPanel(controlsMount, config);

  /** Clamp config to what the current sheet can hold, then re-slice everything. */
  function rebuild(): void {
    config.frameWidth = Math.max(1, Math.min(Math.floor(config.frameWidth) || 1, sheet.width));
    config.frameHeight = Math.max(1, Math.min(Math.floor(config.frameHeight) || 1, sheet.height));
    const capacity = SpritesheetLoader.capacity(sheet, config);
    config.startFrame = Math.max(0, Math.min(Math.floor(config.startFrame) || 0, capacity - 1));
    const available = capacity - config.startFrame;
    config.frameCount = Math.max(1, Math.min(Math.floor(config.frameCount) || 1, available));

    player.setFrames(SpritesheetLoader.slice(sheet, config));
    timeline.rebuild(sheet, config);
    timeline.highlight(player.currentFrame);
    controls.syncFromConfig();
    exportPanel.refresh();
  }

  // ── Stage: center sprite, wheel zoom ─────────────────────────────
  function layout(): void {
    player.sprite.position.set(app.screen.width / 2, app.screen.height / 2);
    player.sprite.scale.set(zoom);
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  }

  stageWrap.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * factor));
      layout();
    },
    { passive: false },
  );

  // ── Drag & drop PNG spritesheet ──────────────────────────────────
  stageWrap.addEventListener('dragover', (event) => {
    event.preventDefault();
    stageWrap.classList.add('dragover');
  });
  stageWrap.addEventListener('dragleave', () => stageWrap.classList.remove('dragover'));
  stageWrap.addEventListener('drop', (event) => {
    event.preventDefault();
    stageWrap.classList.remove('dragover');
    const file = event.dataTransfer?.files[0];
    if (file === undefined || !file.type.startsWith('image/')) return;
    void SpritesheetLoader.fromFile(file).then((loaded) => {
      sheet = loaded;
      frameAudio.clear();
      player.goTo(0);
      rebuild();
      player.play();
      controls.setPlaying(true);
    });
  });

  // ── Main loop ────────────────────────────────────────────────────
  app.ticker.add(() => {
    player.update(app.ticker.deltaMS / 1000);
    layout();
  });

  rebuild();
  player.play();
  controls.setPlaying(true);
}

void bootstrap();
