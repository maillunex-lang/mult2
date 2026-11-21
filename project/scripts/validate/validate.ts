import { spawn } from 'node:child_process';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOTAL_FRAMES, FPS, DURATION, WIDTH, HEIGHT } from '../../src/timeline/timeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FINAL = path.resolve(__dirname, '../../output/robot_counting_1_to_10.mp4');

function ffprobeJson(file: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const p = spawn(
      'ffprobe',
      ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', file],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => {
      if (code !== 0) reject(new Error(err || `ffprobe ${code}`));
      else resolve(JSON.parse(out));
    });
  });
}

async function main() {
  console.log('=== Validating', FINAL, '===');
  await access(FINAL);
  const st = await stat(FINAL);
  console.log(`Size: ${(st.size / 1024 / 1024).toFixed(2)} MB`);

  const info = await ffprobeJson(FINAL);
  const format = info.format as Record<string, string>;
  const streams = info.streams as Array<Record<string, string>>;
  const video = streams.find((s) => s.codec_type === 'video');
  const audio = streams.find((s) => s.codec_type === 'audio');

  const checks: Array<[string, boolean, string]> = [];

  checks.push(['File exists', true, FINAL]);
  const dur = parseFloat(format.duration);
  checks.push(['Duration ~180s', Math.abs(dur - DURATION) < 0.15, `${dur}s`]);
  checks.push(['Width 1920', Number(video?.width) === WIDTH, String(video?.width)]);
  checks.push(['Height 1080', Number(video?.height) === HEIGHT, String(video?.height)]);
  checks.push(['Codec h264', video?.codec_name === 'h264', String(video?.codec_name)]);
  checks.push(['No audio', !audio, audio ? 'HAS AUDIO' : 'none']);
  checks.push(['Pix fmt yuv420p', video?.pix_fmt === 'yuv420p', String(video?.pix_fmt)]);

  // FPS
  let fps = 0;
  if (video?.r_frame_rate) {
    const [a, b] = video.r_frame_rate.split('/').map(Number);
    fps = b ? a / b : a;
  }
  checks.push(['FPS 30', Math.abs(fps - FPS) < 0.1, String(fps)]);

  // Frame count via nb_frames or duration*fps
  let frames = Number(video?.nb_frames || 0);
  if (!frames) frames = Math.round(dur * FPS);
  checks.push(['Frames ~5400', Math.abs(frames - TOTAL_FRAMES) <= 2, String(frames)]);

  let failed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`${ok ? '✅' : '❌'} ${name}: ${detail}`);
    if (!ok) failed++;
  }

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log('\nAll validation checks passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
