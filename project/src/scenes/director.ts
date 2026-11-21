import type { CanvasRenderingContext2D } from 'canvas';
import {
  applyIdle,
  celebrate,
  defaultPose,
  drawBeep,
  hopAt,
  walkCycle,
  type BeepPose,
} from '../characters/beep.js';
import { defaultCamera, drawRoom, type Camera } from '../backgrounds/room.js';
import {
  BALLOON_COLORS,
  CAR_COLORS,
  CUBE_COLORS,
  RING_COLORS,
  STAR_COLORS,
  drawBalloon,
  drawCube,
  drawRing,
  drawStar,
  drawToyBall,
  drawToyCar,
} from '../objects/toys.js';
import { appearScale, bounceY, drawBigNumber, drawTitle } from '../objects/numbers.js';
import { DIGIT_COLORS, sceneAt, WIDTH, HEIGHT } from '../timeline/timeline.js';
import { easeInOutCubic, easeOutCubic, easeOutBounce, tween } from '../utils/easing.js';
import { clamp } from '../utils/math.js';

export function drawFrame(ctx: CanvasRenderingContext2D, t: number) {
  const scene = sceneAt(t);
  const camera = defaultCamera();
  let pose = defaultPose();
  pose.x = 960;
  pose.y = 740;

  // Clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Per-scene setup (camera + robot + overlays)
  const overlays: Array<(c: CanvasRenderingContext2D) => void> = [];

  switch (scene.id) {
    case 1:
      setupIntro(t, camera, pose, overlays);
      break;
    case 2:
      setupDigit(t, 1, 15, camera, pose, overlays, drawDigit1);
      break;
    case 3:
      setupDigit(t, 2, 28, camera, pose, overlays, drawDigit2);
      break;
    case 4:
      setupDigit(t, 3, 41, camera, pose, overlays, drawDigit3);
      break;
    case 5:
      setupDigit(t, 4, 54, camera, pose, overlays, drawDigit4);
      break;
    case 6:
      setupDigit(t, 5, 67, camera, pose, overlays, drawDigit5);
      break;
    case 7:
      setupDigit(t, 6, 80, camera, pose, overlays, drawDigit6);
      break;
    case 8:
      setupDigit(t, 7, 93, camera, pose, overlays, drawDigit7);
      break;
    case 9:
      setupDigit(t, 8, 106, camera, pose, overlays, drawDigit8);
      break;
    case 10:
      setupDigit(t, 9, 119, camera, pose, overlays, drawDigit9);
      break;
    case 11:
      setupDigit(t, 10, 132, camera, pose, overlays, drawDigit10);
      break;
    case 12:
      setupReview(t, camera, pose, overlays);
      break;
    case 13:
      setupFinale(t, camera, pose, overlays);
      break;
  }

  drawRoom(ctx, t, camera);

  // Draw scene objects under robot (most toys)
  for (const o of overlays) o(ctx);

  pose = applyIdle(pose, t, scene.id);
  drawBeep(ctx, pose);

  // Vignette
  const vig = ctx.createRadialGradient(960, 540, 400, 960, 540, 1100);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(40,30,20,0.18)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Fade in/out
  if (t < 0.8) {
    ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.8})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  if (t > 176) {
    ctx.fillStyle = `rgba(0,0,0,${(t - 176) / 4})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

type Overlay = (c: CanvasRenderingContext2D) => void;

function setupDigit(
  t: number,
  n: number,
  start: number,
  camera: Camera,
  pose: BeepPose,
  overlays: Overlay[],
  drawer: (t: number, local: number, pose: BeepPose, overlays: Overlay[]) => void
) {
  const local = t - start;
  camera.x = Math.sin(t * 0.35) * 12;
  camera.y = Math.cos(t * 0.28) * 6;
  camera.zoom = 1.02;
  pose.x = 720;
  pose.y = 760;
  pose.emotion = 'curious';
  drawer(t, local, pose, overlays);

  // Big number on right
  const sc = appearScale(local, 0.15, 0.5);
  const by = bounceY(local, 0.7, 14);
  overlays.push((ctx) => {
    if (sc > 0.01) {
      drawBigNumber(ctx, n, 1480, 280, sc, {
        bounce: by,
        glow: 0.5 + Math.sin(t * 3) * 0.3,
        gold: n === 10,
      });
    }
  });
}

function setupIntro(t: number, camera: Camera, pose: BeepPose, overlays: Overlay[]) {
  const local = t;
  // Slow camera pan across room
  camera.x = tween(local, 0, 4, 80, -20, easeInOutCubic);
  camera.y = tween(local, 0, 4, -30, 10, easeInOutCubic);
  camera.zoom = tween(local, 0, 5, 1.12, 1.0, easeInOutCubic);

  // Beep appears from behind toy box (~3s)
  if (local < 3.2) {
    pose.opacity = 0;
  } else {
    const appear = tween(local, 3.2, 4.5, 0, 1, easeOutCubic);
    pose.opacity = appear;
    pose.x = tween(local, 3.2, 5.5, 1550, 960, easeOutCubic);
    pose.y = 760;
    const walk = walkCycle(local * 1.2, 1);
    if (local < 5.5) Object.assign(pose, walk);
    if (local >= 5.5 && local < 8) {
      pose.wave = tween(local, 5.5, 6, 0, 1, easeOutCubic);
      if (local > 7.2) pose.wave = tween(local, 7.2, 8, 1, 0, easeOutCubic);
      pose.emotion = 'happy';
      pose.armR = -50;
    }
    if (local >= 8 && local < 10) {
      const hop = hopAt(local, 8.1, 50);
      pose.bounce = -hop.y;
      pose.squash = hop.squash;
      pose.emotion = 'joy';
      Object.assign(pose, celebrate(local, 8.1));
    }
    if (local >= 10) {
      pose.emotion = 'smile';
      pose.x = 960;
    }
  }

  overlays.push((ctx) => {
    // Title
    const ts = appearScale(local, 9.5, 0.6);
    if (ts > 0.01) {
      drawTitle(ctx, 'УЧИМСЯ СЧИТАТЬ!', 960, 160, ts, '#FFF7ED');
    }
    // Numbers 1-10 appear
    if (local > 11) {
      for (let i = 1; i <= 10; i++) {
        const s = appearScale(local, 11 + i * 0.22, 0.35);
        if (s > 0.01) {
          const x = 280 + (i - 1) * 140;
          ctx.save();
          ctx.globalAlpha = clamp(s, 0, 1);
          ctx.translate(x, 280);
          ctx.scale(s, s);
          ctx.fillStyle = DIGIT_COLORS[i];
          ctx.font = 'bold 64px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#fff';
          ctx.strokeText(String(i), 0, 0);
          ctx.fillText(String(i), 0, 0);
          ctx.restore();
        }
      }
    }
  });
}

function drawDigit1(_t: number, local: number, pose: BeepPose, overlays: Overlay[]) {
  pose.x = 700;
  // Show one finger (raise right arm)
  if (local > 2) {
    pose.pointing = 'right';
    pose.armR = -110;
    pose.emotion = 'smile';
    pose.pupilX = 0.6;
  }
  if (local > 5) {
    Object.assign(pose, celebrate(local, 5));
  }

  overlays.push((ctx) => {
    const roll = tween(local, 3, 5, -200, 0, easeOutCubic);
    const hx = local > 4.5 && local < 7 ? 1 : 0;
    const x = 980 + roll;
    const y = 780;
    drawToyBall(ctx, x, y, 55, '#EF4444', hx > 0, local * 2);
  });
}

function drawDigit2(_t: number, local: number, pose: BeepPose, overlays: Overlay[]) {
  pose.x = 680;
  const highlight = local > 4 && local < 6 ? 0 : local > 6 && local < 8 ? 1 : -1;
  if (local > 4 && local < 6) {
    pose.pointing = 'right';
    pose.pupilX = 0.3;
  } else if (local > 6 && local < 8) {
    pose.pointing = 'right';
    pose.pupilX = 0.7;
    pose.x = 720;
  } else if (local > 9) {
    Object.assign(pose, celebrate(local, 9));
  }

  overlays.push((ctx) => {
    const balls = [
      { c: '#3B82F6', tx: 920 },
      { c: '#22C55E', tx: 1080 },
    ];
    balls.forEach((b, i) => {
      const x = tween(local, 2 + i * 0.5, 3.5 + i * 0.5, 1400, b.tx, easeOutCubic);
      drawToyBall(ctx, x, 780, 48, b.c, highlight === i, local * 1.5 + i);
    });
  });
}

function drawDigit3(_t: number, local: number, pose: BeepPose, overlays: Overlay[]) {
  pose.x = 650;
  if (local > 5) {
    const idx = Math.min(2, Math.floor((local - 5) / 1.2));
    pose.pointing = 'right';
    pose.pupilX = 0.2 + idx * 0.25;
  }
  if (local > 10) Object.assign(pose, celebrate(local, 10));

  overlays.push((ctx) => {
    const cols = ['#F43F5E', '#3B82F6', '#EAB308'];
    const letters = ['A', 'B', 'C'];
    for (let i = 0; i < 3; i++) {
      const dropStart = 2 + i * 0.45;
      const y = tween(local, dropStart, dropStart + 0.7, -100, 760, easeOutBounce);
      const x = 900 + i * 100;
      const rot = tween(local, dropStart, dropStart + 0.7, 0.8, 0, easeOutCubic);
      const hi = local > 5 + i * 1.2 && local < 5 + (i + 1) * 1.2;
      drawCube(ctx, x, y, 70, cols[i], letters[i], hi, rot);
    }
  });
}

function drawDigit4(_t: number, local: number, pose: BeepPose, overlays: Overlay[]) {
  pose.x = 620;
  pose.emotion = 'curious';
  if (local > 2) {
    // Follow cars with eyes
    const carIdx = clamp(Math.floor((local - 2) / 1.4), 0, 3);
    pose.pupilX = -0.2 + carIdx * 0.3;
    pose.headRot = -8 + carIdx * 5;
  }
  if (local > 10) Object.assign(pose, celebrate(local, 10));

  overlays.push((ctx) => {
    for (let i = 0; i < 4; i++) {
      const start = 2 + i * 1.2;
      const x = tween(local, start, start + 1.1, -100, 820 + i * 130, easeOutCubic);
      const hi = local > start + 1.0 && local < start + 1.8;
      drawToyCar(ctx, x, 790, CAR_COLORS[i], 1.15, hi);
    }
  });
}

function drawDigit5(t: number, local: number, pose: BeepPose, overlays: Overlay[]) {
  pose.x = 960;
  pose.y = 780;
  if (local > 3) {
    pose.emotion = 'joy';
    pose.armL = 30 + Math.sin(t * 8) * 20;
    pose.armR = -30 - Math.sin(t * 8) * 20;
  }
  if (local > 5) {
    const hop = hopAt(local, 5.2, 60);
    pose.bounce = -hop.y;
    pose.squash = hop.squash;
  }
  if (local > 8) Object.assign(pose, celebrate(local, 8));

  overlays.push((ctx) => {
    for (let i = 0; i < 5; i++) {
      const s = appearScale(local, 1.5 + i * 0.35, 0.45);
      const angle = -Math.PI * 0.8 + (i / 4) * Math.PI * 1.6;
      const radius = 180;
      const x = 960 + Math.cos(angle) * radius;
      const y = 420 + Math.sin(angle) * 40 - 40;
      if (s > 0.01) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        drawStar(ctx, 0, 0, 36, STAR_COLORS[i], t * 0.8 + i, local > 4 + i * 0.3 && local < 5 + i * 0.3);
        ctx.restore();
      }
    }
  });
}

function drawDigit6(_t: number, local: number, pose: BeepPose, overlays: Overlay[]) {
  pose.x = 640;
  if (local > 4) {
    const idx = clamp(Math.floor((local - 4) / 0.9), 0, 5);
    pose.pointing = 'right';
    pose.pupilX = (idx % 3) * 0.25;
    pose.pupilY = idx < 3 ? -0.2 : 0.3;
  }
  if (local > 10) Object.assign(pose, celebrate(local, 10));

  overlays.push((ctx) => {
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const s = appearScale(local, 1.5 + i * 0.25, 0.4);
      const x = 880 + col * 110;
      const y = 680 + row * 100;
      const hi = local > 4 + i * 0.9 && local < 4 + (i + 1) * 0.9;
      if (s > 0.01) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        drawCube(ctx, 0, 0, 64, CUBE_COLORS[i], String(i + 1), hi);
        ctx.restore();
      }
    }
  });
}

function drawDigit7(t: number, local: number, pose: BeepPose, overlays: Overlay[]) {
  pose.x = 700;
  if (local > 3) {
    pose.emotion = 'surprise';
    pose.mouth = 1;
    pose.pupilY = -0.7;
    pose.headRot = -10;
    pose.armL = 20;
    pose.armR = -20;
  }
  if (local > 10) {
    pose.emotion = 'joy';
    Object.assign(pose, celebrate(local, 10));
  }

  overlays.push((ctx) => {
    for (let i = 0; i < 7; i++) {
      const start = 2 + i * 0.4;
      const y = tween(local, start, start + 1.5, 720, 280 - (i % 3) * 30, easeOutCubic);
      const x = 860 + i * 85 + Math.sin(t + i) * 8;
      const sway = Math.sin(t * 1.5 + i) * 0.12;
      const sc = appearScale(local, start, 0.3);
      if (sc > 0.01) {
        drawBalloon(ctx, x, y, BALLOON_COLORS[i % BALLOON_COLORS.length], sc * 1.1, sway);
      }
    }
  });
}

function drawDigit8(_t: number, local: number, pose: BeepPose, overlays: Overlay[]) {
  pose.x = 620;
  if (local > 5) {
    pose.pointing = 'right';
    pose.emotion = 'proud';
  }
  if (local > 10) Object.assign(pose, celebrate(local, 10));

  overlays.push((ctx) => {
    for (let i = 0; i < 8; i++) {
      const s = appearScale(local, 1.2 + i * 0.28, 0.4);
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 880 + col * 100;
      const y = 700 + row * 90;
      const r = 28 + (i % 3) * 4;
      const hi = local > 5 + i * 0.5 && local < 5.5 + i * 0.5;
      if (s > 0.01) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        drawRing(ctx, 0, 0, r, RING_COLORS[i], hi);
        ctx.restore();
      }
    }
  });
}

function drawDigit9(t: number, local: number, pose: BeepPose, overlays: Overlay[]) {
  pose.x = 960;
  pose.y = 800;
  if (local > 4) {
    pose.wave = 1;
    pose.emotion = 'joy';
    pose.armL = 40 + Math.sin(t * 9) * 20;
  }
  if (local > 8) Object.assign(pose, celebrate(local, 8));

  overlays.push((ctx) => {
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const s = appearScale(local, 1.5 + i * 0.22, 0.4);
      const x = 820 + col * 140;
      const y = 280 + row * 120;
      if (s > 0.01) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        drawStar(ctx, 0, 0, 32, STAR_COLORS[i], t + i * 0.4, true);
        ctx.restore();
      }
    }
  });
}

function drawDigit10(_t: number, local: number, pose: BeepPose, overlays: Overlay[]) {
  pose.x = 560;
  if (local > 2) {
    const idx = clamp(Math.floor((local - 2) / 0.7), 0, 9);
    pose.pointing = 'right';
    pose.pupilX = 0.3 + (idx % 5) * 0.1;
  }
  if (local > 12) {
    Object.assign(pose, celebrate(local, 12));
    pose.emotion = 'joy';
  }

  overlays.push((ctx) => {
    // Cubes appear then form tower
    for (let i = 0; i < 10; i++) {
      const appear = 1.5 + i * 0.55;
      const towerStart = 10;
      const spreadX = 780 + (i % 5) * 100;
      const spreadY = 760 - Math.floor(i / 5) * 90;
      const towerX = 1050;
      const towerY = 780 - i * 48;
      let x = spreadX;
      let y = -80;
      if (local > appear) {
        y = tween(local, appear, appear + 0.5, -80, spreadY, easeOutBounce);
      }
      if (local > towerStart) {
        x = tween(local, towerStart, towerStart + 1.5, spreadX, towerX, easeInOutCubic);
        y = tween(local, towerStart, towerStart + 1.5, spreadY, towerY, easeInOutCubic);
      }
      const hi = local > appear + 0.4 && local < appear + 1.0;
      const sc = local > appear ? 1 : 0;
      if (sc) {
        drawCube(ctx, x, y, 52, CUBE_COLORS[i], String(i + 1), hi);
      }
    }
  });
}

function setupReview(t: number, camera: Camera, pose: BeepPose, overlays: Overlay[]) {
  const local = t - 148;
  camera.zoom = 1.05;
  camera.x = tween(local, 0, 20, 40, -40, easeInOutCubic);

  // Board
  overlays.push((ctx) => {
    // Board background
    ctx.fillStyle = '#1E3A5F';
    roundRectPath(ctx, 160, 120, 1600, 520, 28);
    ctx.fill();
    ctx.fillStyle = '#F0F9FF';
    roundRectPath(ctx, 180, 140, 1560, 480, 22);
    ctx.fill();
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('СЧИТАЕМ ВМЕСТЕ!', 960, 190);

    // Reveal digits sequentially
    for (let i = 1; i <= 10; i++) {
      const reveal = 1.5 + (i - 1) * 1.7;
      if (local < reveal) continue;
      const s = appearScale(local, reveal, 0.35);
      const x = 260 + ((i - 1) % 5) * 300;
      const y = i <= 5 ? 280 : 480;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.fillStyle = DIGIT_COLORS[i];
      ctx.font = 'bold 70px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 6;
      ctx.strokeText(String(i), 0, 0);
      ctx.fillText(String(i), 0, 0);

      // Mini items under digit
      for (let k = 0; k < i; k++) {
        const mx = -((i - 1) * 10) + k * 20;
        const my = 55;
        ctx.fillStyle = DIGIT_COLORS[i];
        ctx.beginPath();
        ctx.arc(mx, my, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  });

  // Robot walks along board under the revealed digits
  const digitIdx = clamp(Math.floor((local - 1.5) / 1.7), 0, 9);
  const col = digitIdx % 5;
  const row = digitIdx < 5 ? 0 : 1;
  pose.x = 260 + col * 300;
  pose.y = 700 + row * 100;
  const wc = walkCycle(local * 1.5, 1);
  pose.legL = wc.legL;
  pose.legR = wc.legR;
  pose.bounce = wc.bounce;
  pose.bodyRot = wc.bodyRot;
  pose.armL = -100;
  pose.armR = 80;
  pose.pointing = 'up';
  pose.emotion = 'happy';
  pose.scale = 0.85;
}

function setupFinale(t: number, camera: Camera, pose: BeepPose, overlays: Overlay[]) {
  const local = t - 170;
  camera.zoom = tween(local, 6, 10, 1.05, 0.88, easeInOutCubic);
  camera.y = tween(local, 6, 10, 0, -20, easeInOutCubic);

  pose.x = 960;
  pose.y = 760;
  pose.emotion = 'joy';
  pose.wave = local > 2 && local < 8 ? 1 : tween(local, 2, 2.5, 0, 1, easeOutCubic);
  if (local > 1) {
    const hop = hopAt(local, 1.2, 45);
    pose.bounce = -hop.y;
    pose.squash = hop.squash;
  }

  overlays.push((ctx) => {
    for (let i = 1; i <= 10; i++) {
      const s = appearScale(local, 0.3 + i * 0.15, 0.4);
      const angle = ((i - 1) / 10) * Math.PI * 2 - Math.PI / 2 + local * 0.12;
      const radius = 340;
      const x = 960 + Math.cos(angle) * radius;
      const y = 560 + Math.sin(angle) * radius * 0.62;
      if (s > 0.01) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s * 0.55, s * 0.55);
        drawBigNumber(ctx, i, 0, 0, 1, { glow: 0.4 });
        ctx.restore();
      }
    }

    const t1 = appearScale(local, 4, 0.5);
    if (t1 > 0.01) drawTitle(ctx, 'МОЛОДЕЦ!', 960, 140, t1 * 1.1, '#FEF08A');
    const t2 = appearScale(local, 6.5, 0.5);
    if (t2 > 0.01) drawTitle(ctx, 'ДО НОВЫХ ВСТРЕЧ!', 960, 230, t2 * 0.9, '#FFFFFF');
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
