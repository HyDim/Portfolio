import type { AnimationConfig } from '../types/AnimationConfig';

export interface ControlPanelCallbacks {
  /** Sheet geometry changed — re-slice and rebuild the timeline. */
  onSheetConfigChange(): void;
  /** Playback-only setting changed (fps/loop/pingPong). */
  onPlaybackConfigChange(): void;
  onPlayToggle(): void;
  onStep(direction: 1 | -1): void;
  onBackgroundColor(color: string): void;
  onCheckerToggle(checked: boolean): void;
}

/**
 * Left-hand panel. Inputs write straight into the shared AnimationConfig
 * (single source of truth, passed by reference) and notify via callbacks.
 */
export class ControlPanel {
  private readonly config: AnimationConfig;
  private readonly callbacks: ControlPanelCallbacks;

  private readonly frameWidthInput: HTMLInputElement;
  private readonly frameHeightInput: HTMLInputElement;
  private readonly frameCountInput: HTMLInputElement;
  private readonly startFrameInput: HTMLInputElement;
  private readonly fpsInput: HTMLInputElement;
  private readonly fpsValue: HTMLElement;
  private readonly loopInput: HTMLInputElement;
  private readonly pingPongInput: HTMLInputElement;
  private readonly playButton: HTMLButtonElement;

  constructor(mount: HTMLElement, config: AnimationConfig, callbacks: ControlPanelCallbacks) {
    this.config = config;
    this.callbacks = callbacks;

    mount.insertAdjacentHTML(
      'afterbegin',
      `
      <div class="panel-section">
        <div class="panel-title">Spritesheet</div>
        <div class="field"><label for="in-fw">frame width</label><input id="in-fw" type="number" min="1" /></div>
        <div class="field"><label for="in-fh">frame height</label><input id="in-fh" type="number" min="1" /></div>
        <div class="field"><label for="in-fc">frame count</label><input id="in-fc" type="number" min="1" /></div>
        <div class="field"><label for="in-sf">start frame</label><input id="in-sf" type="number" min="0" /></div>
      </div>
      <div class="panel-section">
        <div class="panel-title">Playback</div>
        <div class="btn-row" style="margin-bottom:0.7rem">
          <button id="btn-step-back" class="secondary" title="Step back">&#9664;|</button>
          <button id="btn-play">&#9654; PLAY</button>
          <button id="btn-step-fwd" class="secondary" title="Step forward">|&#9654;</button>
        </div>
        <div class="field">
          <label for="in-fps">fps</label>
          <input id="in-fps" type="range" min="1" max="60" step="1" />
          <span class="range-value" id="fps-value"></span>
        </div>
        <div class="field"><label for="in-loop">loop</label><input id="in-loop" type="checkbox" /></div>
        <div class="field"><label for="in-pp">ping-pong</label><input id="in-pp" type="checkbox" /></div>
      </div>
      <div class="panel-section">
        <div class="panel-title">Preview</div>
        <div class="field"><label for="in-bg">background</label><input id="in-bg" type="color" value="#10151d" /></div>
        <div class="field"><label for="in-checker">checkerboard</label><input id="in-checker" type="checkbox" /></div>
      </div>`,
    );

    this.frameWidthInput = ControlPanel.input(mount, '#in-fw');
    this.frameHeightInput = ControlPanel.input(mount, '#in-fh');
    this.frameCountInput = ControlPanel.input(mount, '#in-fc');
    this.startFrameInput = ControlPanel.input(mount, '#in-sf');
    this.fpsInput = ControlPanel.input(mount, '#in-fps');
    this.loopInput = ControlPanel.input(mount, '#in-loop');
    this.pingPongInput = ControlPanel.input(mount, '#in-pp');

    const fpsValue = mount.querySelector('#fps-value');
    const playButton = mount.querySelector('#btn-play');
    if (!(fpsValue instanceof HTMLElement) || !(playButton instanceof HTMLButtonElement)) {
      throw new Error('Control panel mount failed');
    }
    this.fpsValue = fpsValue;
    this.playButton = playButton;

    this.bind();
    this.syncFromConfig();
  }

  private static input(root: HTMLElement, selector: string): HTMLInputElement {
    const element = root.querySelector(selector);
    if (!(element instanceof HTMLInputElement)) throw new Error(`Missing input ${selector}`);
    return element;
  }

  private bind(): void {
    const sheetField = (input: HTMLInputElement, write: (value: number) => void): void => {
      input.addEventListener('change', () => {
        write(Number(input.value));
        this.callbacks.onSheetConfigChange();
      });
    };
    sheetField(this.frameWidthInput, (v) => (this.config.frameWidth = v));
    sheetField(this.frameHeightInput, (v) => (this.config.frameHeight = v));
    sheetField(this.frameCountInput, (v) => (this.config.frameCount = v));
    sheetField(this.startFrameInput, (v) => (this.config.startFrame = v));

    this.fpsInput.addEventListener('input', () => {
      this.config.fps = Number(this.fpsInput.value);
      this.fpsValue.textContent = String(this.config.fps);
      this.callbacks.onPlaybackConfigChange();
    });
    this.loopInput.addEventListener('change', () => {
      this.config.loop = this.loopInput.checked;
      this.callbacks.onPlaybackConfigChange();
    });
    this.pingPongInput.addEventListener('change', () => {
      this.config.pingPong = this.pingPongInput.checked;
      this.callbacks.onPlaybackConfigChange();
    });

    this.playButton.addEventListener('click', () => this.callbacks.onPlayToggle());
    const back = document.getElementById('btn-step-back');
    const forward = document.getElementById('btn-step-fwd');
    back?.addEventListener('click', () => this.callbacks.onStep(-1));
    forward?.addEventListener('click', () => this.callbacks.onStep(1));

    const bg = document.getElementById('in-bg');
    if (bg instanceof HTMLInputElement) {
      bg.addEventListener('input', () => this.callbacks.onBackgroundColor(bg.value));
    }
    const checker = document.getElementById('in-checker');
    if (checker instanceof HTMLInputElement) {
      checker.addEventListener('change', () => this.callbacks.onCheckerToggle(checker.checked));
    }
  }

  /** Push (possibly clamped) config values back into the inputs. */
  syncFromConfig(): void {
    this.frameWidthInput.value = String(this.config.frameWidth);
    this.frameHeightInput.value = String(this.config.frameHeight);
    this.frameCountInput.value = String(this.config.frameCount);
    this.startFrameInput.value = String(this.config.startFrame);
    this.fpsInput.value = String(this.config.fps);
    this.fpsValue.textContent = String(this.config.fps);
    this.loopInput.checked = this.config.loop;
    this.pingPongInput.checked = this.config.pingPong;
  }

  setPlaying(playing: boolean): void {
    this.playButton.innerHTML = playing ? '&#10074;&#10074; PAUSE' : '&#9654; PLAY';
  }
}
