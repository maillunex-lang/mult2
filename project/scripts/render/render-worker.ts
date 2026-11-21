/**
 * Worker: render a frame range to an MP4 segment via ffmpeg pipe.
 * Usage: tsx scripts/render/render-worker.ts <startFrame> <endFrameExclusive> <outPath>
 */
import { spawn } from 'node:child_process';
import { createCanvas } from 'canvas';
import { WIDTH, HEIGHT, FPS } from '../../src/timeline/timeline.js';
import { drawFrame } from '../../src/scenes/director.js';

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const outPath = process.argv[4];

if (!Number.isFinite(start) || !Number.isFinite(end) || !outPath) {
  console.error('Usage: render-worker <start> <endExclusive> <out.mp4>');
  process.exit(1);
}

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

const ff = spawn(
  'ffmpeg',
  [
    '-y',
    '-f',
    'image2pipe',
    '-framerate',
    String(FPS),
    '-i',
    'pipe:0',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-an',
    '-movflags',
    '+faststart',
    outPath,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] }
);

async function run() {
  const total = end - start;
  for (let f = start; f < end; f++) {
    const t = f / FPS;
    drawFrame(ctx, t);
    const buf = canvas.toBuffer('image/jpeg', { quality: 0.93 });
    const ok = ff.stdin.write(buf);
    if (!ok) await new Promise<void>((r) => ff.stdin.once('drain', r));
    if ((f - start) % 60 === 0) {
      const pct = (((f - start) / total) * 100).toFixed(1);
      console.log(`[worker ${start}-${end}] frame ${f} (${pct}%)`);
    }
  }
  ff.stdin.end();
  await new Promise<void>((resolve, reject) => {
    ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
  });
  console.log(`[worker ${start}-${end}] done -> ${outPath}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
