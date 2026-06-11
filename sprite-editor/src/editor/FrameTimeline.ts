import type { AnimationConfig } from '../types/AnimationConfig';
import { SpritesheetLoader, type SpritesheetData } from './SpritesheetLoader';

export interface FrameTimelineCallbacks {
  onSelect(frameIndex: number): void;
  onAudioDrop(frameIndex: number, file: File): void;
}

const THUMB_SIZE = 44;

/** Right-hand panel: one clickable thumbnail per frame, drop audio to assign. */
export class FrameTimeline {
  private readonly framesRoot: HTMLElement;
  private thumbs: HTMLButtonElement[] = [];

  constructor(mount: HTMLElement, private readonly callbacks: FrameTimelineCallbacks) {
    mount.innerHTML = `
      <div class="panel-section">
        <div class="panel-title">Timeline</div>
        <div id="frames"></div>
        <p class="hint" style="margin-top:0.8rem">
          <b>click</b> a frame to jump to it<br />
          <b>drop audio</b> on a frame to play it during preview
        </p>
      </div>`;
    const framesRoot = mount.querySelector('#frames');
    if (!(framesRoot instanceof HTMLElement)) throw new Error('Timeline mount failed');
    this.framesRoot = framesRoot;
  }

  rebuild(sheet: SpritesheetData, config: AnimationConfig): void {
    this.framesRoot.replaceChildren();
    this.thumbs = [];

    for (let i = 0; i < config.frameCount; i++) {
      const thumb = document.createElement('button');
      thumb.className = 'frame-thumb';
      thumb.type = 'button';

      const canvas = document.createElement('canvas');
      canvas.width = THUMB_SIZE;
      canvas.height = THUMB_SIZE;
      const ctx = canvas.getContext('2d');
      if (ctx !== null) {
        const { x, y } = SpritesheetLoader.frameOrigin(sheet, config, i);
        ctx.imageSmoothingEnabled = false;
        const scale = Math.min(THUMB_SIZE / config.frameWidth, THUMB_SIZE / config.frameHeight);
        const w = config.frameWidth * scale;
        const h = config.frameHeight * scale;
        ctx.drawImage(
          sheet.image,
          x, y, config.frameWidth, config.frameHeight,
          (THUMB_SIZE - w) / 2, (THUMB_SIZE - h) / 2, w, h,
        );
      }

      const num = document.createElement('span');
      num.textContent = `#${String(i).padStart(2, '0')}`;
      const soundDot = document.createElement('span');
      soundDot.className = 'sound-dot';
      soundDot.textContent = '♪';

      thumb.append(canvas, num, soundDot);
      thumb.addEventListener('click', () => this.callbacks.onSelect(i));
      thumb.addEventListener('dragover', (event) => {
        event.preventDefault();
        thumb.classList.add('dragover');
      });
      thumb.addEventListener('dragleave', () => thumb.classList.remove('dragover'));
      thumb.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        thumb.classList.remove('dragover');
        const file = event.dataTransfer?.files[0];
        if (file !== undefined) this.callbacks.onAudioDrop(i, file);
      });

      this.framesRoot.appendChild(thumb);
      this.thumbs.push(thumb);
    }
  }

  highlight(frameIndex: number): void {
    this.thumbs.forEach((thumb, i) => thumb.classList.toggle('active', i === frameIndex));
  }

  markSound(frameIndex: number, hasSound: boolean): void {
    this.thumbs[frameIndex]?.classList.toggle('has-sound', hasSound);
  }
}
