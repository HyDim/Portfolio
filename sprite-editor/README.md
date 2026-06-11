# Sprite Animation Editor — PixiJS v8 + TypeScript

A lightweight in-browser tool for previewing and configuring spritesheet animations — the "in-house tooling" use case for game teams. Built with PixiJS v8 and strict TypeScript (no `any`). Ships with a procedurally generated demo spritesheet so it works out of the box.

## Features

- **Preview stage (PixiJS v8)** — central animation preview, scroll-wheel zoom (25%–1200%), background color picker, checkerboard transparency mode
- **Spritesheet loader** — drag & drop a PNG; configure frame width/height, frame count, and start frame; auto-slices the sheet into sub-`Texture`s
- **Playback** — play/pause, step forward/back, 1–60 FPS slider, loop toggle, ping-pong toggle
- **Frame timeline** — thumbnail per frame (drawn from the source image), click to jump, active-frame highlight
- **Export** — live JSON view of `{ frameWidth, frameHeight, frameCount, fps, loop, pingPong }` with copy-to-clipboard
- **Per-frame audio (Web Audio API)** — drop an audio file onto a timeline frame; it plays whenever playback enters that frame

All state lives in a single `AnimationConfig` object shared by reference between the panels, player, and slicer.

## Run

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build
```

## Structure

```
src/
  types/
    AnimationConfig.ts   # shared config interfaces + export shape
  editor/
    SpritesheetLoader.ts  # PNG load, grid math, Texture slicing, demo sheet
    AnimationPlayer.ts    # play/pause/step, fps timing, loop + ping-pong
    FrameTimeline.ts      # thumbnails, jump-to-frame, audio drop targets
  ui/
    ControlPanel.ts       # left panel inputs -> shared config
    ExportPanel.ts        # JSON view + clipboard copy
  audio/
    FrameAudio.ts         # Web Audio per-frame sound playback
  main.ts                 # composition root, drag-drop, zoom, rebuild pipeline
```
