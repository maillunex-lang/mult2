/**
 * Render representative frames from all 13 scenes into a contact sheet.
 */
import { createCanvas, loadImage } from 'canvas';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { SCENES, WIDTH, HEIGHT } from '../../src/timeline/timeline.js';
import { createFrameCanvas, renderFrameToCanvas } from '../../src/render/draw.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../../output');
const SHEET = path.join(OUT_DIR, 'contact_sheet.jpg');
const PREVIEWS = path.join(OUT_DIR, 'previews');

async function main() {
  await mkdir(PREVIEWS, { recursive: true });
  const thumbs: string[] = [];
  const canvas = createFrameCanvas();

  for (const scene of SCENES) {
    const mid = (scene.start + scene.end) / 2;
    const frame = Math.round(mid * 30);
    renderFrameToCanvas(canvas, frame);
    const file = path.join(PREVIEWS, `scene_${String(scene.id).padStart(2, '0')}_${scene.name}.jpg`);
    await writeFile(file, canvas.toBuffer('image/jpeg', { quality: 0.9 }));
    thumbs.push(file);
    console.log(`Preview scene ${scene.id} @ ${mid.toFixed(1)}s -> ${file}`);
  }

  // Contact sheet: 4 columns
  const cols = 4;
  const rows = Math.ceil(thumbs.length / cols);
  const tw = 480;
  const th = 270;
  const pad = 16;
  const labelH = 36;
  const sheet = createCanvas(cols * (tw + pad) + pad, rows * (th + pad + labelH) + pad);
  const ctx = sheet.getContext('2d');
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  for (let i = 0; i < thumbs.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (tw + pad);
    const y = pad + row * (th + pad + labelH);
    const img = await loadImage(thumbs[i]);
    ctx.drawImage(img, x, y + labelH, tw, th);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(
      `Сцена ${SCENES[i].id}: ${SCENES[i].name} (${SCENES[i].start}-${SCENES[i].end}s)`,
      x,
      y + 24
    );
  }

  await writeFile(SHEET, sheet.toBuffer('image/jpeg', { quality: 0.92 }));
  console.log(`Contact sheet: ${SHEET}`);

  // Also extract a few frames from final MP4 if present for sanity
  const finalMp4 = path.join(OUT_DIR, 'robot_counting_1_to_10.mp4');
  try {
    await new Promise<void>((resolve, reject) => {
      const p = spawn(
        'ffmpeg',
        [
          '-y',
          '-i',
          finalMp4,
          '-vf',
          'select=eq(n\\,450)+eq(n\\,1350)+eq(n\\,2700)+eq(n\\,4050)+eq(n\\,5200)',
          '-vsync',
          'vfr',
          path.join(PREVIEWS, 'from_mp4_%02d.jpg'),
        ],
        { stdio: 'inherit' }
      );
      p.on('close', (c) => (c === 0 ? resolve() : reject(new Error('ffmpeg extract failed'))));
    });
    console.log('Extracted sample frames from final MP4');
  } catch {
    console.log('Final MP4 not ready for frame extract (ok if pre-render)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
