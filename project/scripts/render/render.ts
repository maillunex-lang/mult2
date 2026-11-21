/**
 * Full pipeline: parallel scene-batch render → concat → final MP4
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOTAL_FRAMES, FPS, DURATION, WIDTH, HEIGHT } from '../../src/timeline/timeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'output');
const SEG_DIR = path.join(OUT_DIR, 'segments');
const FINAL = path.join(OUT_DIR, 'robot_counting_1_to_10.mp4');

const WORKERS = Math.max(1, Math.min(4, Number(process.env.RENDER_WORKERS || 4)));

async function run(cmd: string, args: string[], cwd = ROOT): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: 'inherit' });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function main() {
  console.log('=== Robot Counting Cartoon Render ===');
  console.log(`Frames: ${TOTAL_FRAMES} | ${WIDTH}x${HEIGHT} @ ${FPS}fps | ${DURATION}s`);
  console.log(`Workers: ${WORKERS}`);

  await mkdir(SEG_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  // Clean old segments
  try {
    await rm(SEG_DIR, { recursive: true, force: true });
    await mkdir(SEG_DIR, { recursive: true });
  } catch {
    /* ignore */
  }

  const chunk = Math.ceil(TOTAL_FRAMES / WORKERS);
  const jobs: Promise<void>[] = [];
  const segments: string[] = [];

  for (let i = 0; i < WORKERS; i++) {
    const start = i * chunk;
    const end = Math.min(TOTAL_FRAMES, (i + 1) * chunk);
    if (start >= end) break;
    const segPath = path.join(SEG_DIR, `seg_${String(i).padStart(2, '0')}.mp4`);
    segments.push(segPath);
    const workerScript = path.join(__dirname, 'render-worker.ts');
    jobs.push(
      run('npx', ['tsx', workerScript, String(start), String(end), segPath]).then(() => {
        console.log(`Segment ${i} complete`);
      })
    );
  }

  const t0 = Date.now();
  await Promise.all(jobs);
  console.log(`All segments rendered in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // Concat list
  const listPath = path.join(SEG_DIR, 'concat.txt');
  const listBody = segments.map((s) => `file '${s.replace(/'/g, "'\\''")}'`).join('\n');
  await writeFile(listPath, listBody, 'utf8');

  console.log('Concatenating segments...');
  await run('ffmpeg', [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listPath,
    '-c',
    'copy',
    '-an',
    '-movflags',
    '+faststart',
    FINAL,
  ]);

  // Re-encode once to ensure exact continuity / faststart (copy can have timestamp quirks)
  const tmpFinal = path.join(OUT_DIR, '_final_reencode.mp4');
  await run('ffmpeg', [
    '-y',
    '-i',
    FINAL,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(FPS),
    '-an',
    '-movflags',
    '+faststart',
    tmpFinal,
  ]);
  await run('mv', [tmpFinal, FINAL]);

  await access(FINAL);
  console.log(`\n✅ Final video: ${FINAL}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
