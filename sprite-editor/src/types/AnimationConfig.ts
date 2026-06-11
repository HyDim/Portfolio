export interface AnimationConfig {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  startFrame: number;
  fps: number;
  loop: boolean;
  pingPong: boolean;
}

/** Shape written by the export panel — the runtime-consumable subset. */
export interface ExportedAnimationConfig {
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly frameCount: number;
  readonly fps: number;
  readonly loop: boolean;
  readonly pingPong: boolean;
}

export function toExported(config: AnimationConfig): ExportedAnimationConfig {
  return {
    frameWidth: config.frameWidth,
    frameHeight: config.frameHeight,
    frameCount: config.frameCount,
    fps: config.fps,
    loop: config.loop,
    pingPong: config.pingPong,
  };
}

export const DEFAULT_CONFIG: AnimationConfig = {
  frameWidth: 64,
  frameHeight: 64,
  frameCount: 8,
  startFrame: 0,
  fps: 12,
  loop: true,
  pingPong: false,
};
