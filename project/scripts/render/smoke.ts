/** Quick smoke: render key frames to output/smoke/ */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFrameCanvas, renderFrameToCanvas } from '../../src/render/draw.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../output/smoke');

const TIMES = [2, 8, 12, 20, 34, 47, 60, 73, 86, 99, 112, 125, 140, 160, 175];

async function main() {
  await mkdir(OUT, { recursive: true });
  const canvas = createFrameCanvas();
  for (const t of TIMES) {
    const frame = Math.round(t * 30);
    renderFrameToCanvas(canvas, frame);
    const file = path.join(OUT, `t${String(t).padStart(3, '0')}.jpg`);
    await writeFile(file, canvas.toBuffer('image/jpeg', { quality: 0.92 }));
    console.log('wrote', file);
  }
}

main();
