import { createCanvas, type Canvas } from 'canvas';
import { WIDTH, HEIGHT } from '../timeline/timeline.js';
import { drawFrame } from '../scenes/director.js';

export function createFrameCanvas(): Canvas {
  return createCanvas(WIDTH, HEIGHT);
}

export function renderFrameToCanvas(canvas: Canvas, frameIndex: number, fps = 30): void {
  const ctx = canvas.getContext('2d');
  const t = frameIndex / fps;
  drawFrame(ctx, t);
}

export function renderFrameBuffer(frameIndex: number, fps = 30): Buffer {
  const canvas = createFrameCanvas();
  renderFrameToCanvas(canvas, frameIndex, fps);
  return canvas.toBuffer('image/jpeg', { quality: 0.92 });
}
