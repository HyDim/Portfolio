import { Rectangle, Texture } from 'pixi.js';
import type { AnimationConfig } from '../types/AnimationConfig';

/** A loaded sheet: the GPU texture plus a 2D-drawable source for thumbnails. */
export interface SpritesheetData {
  readonly image: ImageBitmap | HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  readonly baseTexture: Texture;
}

export class SpritesheetLoader {
  /** Wrap a drawable source as a sheet, using nearest filtering for crisp pixels. */
  static fromSource(image: ImageBitmap | HTMLCanvasElement): SpritesheetData {
    const baseTexture = Texture.from(image);
    baseTexture.source.scaleMode = 'nearest';
    return { image, width: image.width, height: image.height, baseTexture };
  }

  /** Load a dropped PNG file. */
  static async fromFile(file: File): Promise<SpritesheetData> {
    const bitmap = await createImageBitmap(file);
    return SpritesheetLoader.fromSource(bitmap);
  }

  /** Grid columns available for a frame width. */
  static columns(sheet: SpritesheetData, config: AnimationConfig): number {
    return Math.max(1, Math.floor(sheet.width / config.frameWidth));
  }

  /** Total frames the grid can hold. */
  static capacity(sheet: SpritesheetData, config: AnimationConfig): number {
    const cols = SpritesheetLoader.columns(sheet, config);
    const rows = Math.max(1, Math.floor(sheet.height / config.frameHeight));
    return cols * rows;
  }

  /** Top-left pixel of animation frame `index` (after startFrame offset). */
  static frameOrigin(
    sheet: SpritesheetData,
    config: AnimationConfig,
    index: number,
  ): { x: number; y: number } {
    const cols = SpritesheetLoader.columns(sheet, config);
    const cell = config.startFrame + index;
    return {
      x: (cell % cols) * config.frameWidth,
      y: Math.floor(cell / cols) * config.frameHeight,
    };
  }

  /** Auto-slice the sheet into one sub-texture per animation frame. */
  static slice(sheet: SpritesheetData, config: AnimationConfig): Texture[] {
    const frames: Texture[] = [];
    for (let i = 0; i < config.frameCount; i++) {
      const { x, y } = SpritesheetLoader.frameOrigin(sheet, config, i);
      frames.push(
        new Texture({
          source: sheet.baseTexture.source,
          frame: new Rectangle(x, y, config.frameWidth, config.frameHeight),
        }),
      );
    }
    return frames;
  }

  /**
   * Procedural demo sheet (8 frames, 64x64) so the editor has something
   * to play before a real spritesheet is dropped in.
   */
  static demoSheet(): SpritesheetData {
    const frameSize = 64;
    const frames = 8;
    const canvas = document.createElement('canvas');
    canvas.width = frameSize * frames;
    canvas.height = frameSize;
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('2D context unavailable');

    for (let i = 0; i < frames; i++) {
      const t = i / frames;
      const cx = i * frameSize + frameSize / 2;
      const bounce = Math.abs(Math.sin(t * Math.PI * 2));
      const cy = 46 - bounce * 24;
      const squash = 1 - 0.25 * (1 - bounce);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1 / squash, squash);

      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff88';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-4, -5, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#bfffe0';
      ctx.fill();
      ctx.restore();

      // orbiting satellite
      const angle = t * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * 24, cy + Math.sin(angle) * 24, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();

      // ground shadow
      ctx.beginPath();
      ctx.ellipse(cx, 58, 12 + 6 * (1 - bounce), 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();
    }
    return SpritesheetLoader.fromSource(canvas);
  }
}
