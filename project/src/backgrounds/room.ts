import type { CanvasRenderingContext2D } from 'canvas';
import { WIDTH, HEIGHT } from '../timeline/timeline.js';
import { lerp } from '../utils/math.js';

export interface Camera {
  x: number; // pan offset
  y: number;
  zoom: number;
  shake: number;
}

export function defaultCamera(): Camera {
  return { x: 0, y: 0, zoom: 1, shake: 0 };
}

function drawWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#FFF5EB');
  g.addColorStop(0.55, '#FFE8D6');
  g.addColorStop(1, '#FFD6BA');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Soft polka / cloud pattern
  ctx.fillStyle = 'rgba(255,200,170,0.22)';
  for (let y = 40; y < h * 0.62; y += 70) {
    for (let x = 30; x < w; x += 80) {
      const ox = ((y / 70) % 2) * 40;
      ctx.beginPath();
      ctx.arc(x + ox, y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWindow(ctx: CanvasRenderingContext2D, t: number, parallax: number) {
  const wx = 1180 + parallax * 20;
  const wy = 90;
  const ww = 520;
  const wh = 420;

  // Frame shadow
  ctx.fillStyle = 'rgba(120,80,40,0.12)';
  ctx.fillRect(wx + 10, wy + 14, ww, wh);

  // Outer frame
  ctx.fillStyle = '#F8FAFC';
  roundRect(ctx, wx - 16, wy - 16, ww + 32, wh + 32, 18);
  ctx.fill();
  ctx.fillStyle = '#E2E8F0';
  roundRect(ctx, wx - 8, wy - 8, ww + 16, wh + 16, 12);
  ctx.fill();

  // Sky
  const sky = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  sky.addColorStop(0, '#7DD3FC');
  sky.addColorStop(0.55, '#BAE6FD');
  sky.addColorStop(1, '#FEF3C7');
  ctx.fillStyle = sky;
  ctx.fillRect(wx, wy, ww, wh);

  // Soft clouds
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  const drift = (t * 8) % 80;
  drawCloud(ctx, wx + 80 + drift * 0.3, wy + 90, 1.1);
  drawCloud(ctx, wx + 300 - drift * 0.2, wy + 140, 0.85);
  drawCloud(ctx, wx + 200 + drift * 0.15, wy + 70, 0.6);

  // Sun
  const sunG = ctx.createRadialGradient(wx + 400, wy + 80, 10, wx + 400, wy + 80, 70);
  sunG.addColorStop(0, '#FFFBEB');
  sunG.addColorStop(0.4, '#FDE68A');
  sunG.addColorStop(1, 'rgba(253,230,138,0)');
  ctx.fillStyle = sunG;
  ctx.beginPath();
  ctx.arc(wx + 400, wy + 80, 70, 0, Math.PI * 2);
  ctx.fill();

  // Cross bars
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(wx + ww / 2 - 8, wy, 16, wh);
  ctx.fillRect(wx, wy + wh / 2 - 8, ww, 16);

  // Curtains
  const curtain = ctx.createLinearGradient(0, wy, 0, wy + wh);
  curtain.addColorStop(0, '#FCA5A5');
  curtain.addColorStop(1, '#F87171');
  ctx.fillStyle = curtain;
  ctx.beginPath();
  ctx.moveTo(wx - 30, wy - 20);
  ctx.quadraticCurveTo(wx + 40, wy + wh * 0.4, wx - 10, wy + wh + 10);
  ctx.lineTo(wx - 50, wy + wh + 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(wx + ww + 30, wy - 20);
  ctx.quadraticCurveTo(wx + ww - 40, wy + wh * 0.4, wx + ww + 10, wy + wh + 10);
  ctx.lineTo(wx + ww + 50, wy + wh + 10);
  ctx.closePath();
  ctx.fill();
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 24 * s, y - 8 * s, 28 * s, 0, Math.PI * 2);
  ctx.arc(x + 50 * s, y, 20 * s, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(
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

function drawFloor(ctx: CanvasRenderingContext2D) {
  const fy = 620;
  const wood = ctx.createLinearGradient(0, fy, 0, HEIGHT);
  wood.addColorStop(0, '#E8C39E');
  wood.addColorStop(1, '#C9956C');
  ctx.fillStyle = wood;
  ctx.fillRect(0, fy, WIDTH, HEIGHT - fy);

  ctx.strokeStyle = 'rgba(120,70,30,0.12)';
  ctx.lineWidth = 2;
  for (let y = fy + 28; y < HEIGHT; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y + 8);
    ctx.stroke();
  }
  // plank seams
  for (let x = 0; x < WIDTH; x += 140) {
    ctx.beginPath();
    ctx.moveTo(x, fy);
    ctx.lineTo(x - 40, HEIGHT);
    ctx.stroke();
  }
}

function drawRug(ctx: CanvasRenderingContext2D, t: number) {
  const cx = 900;
  const cy = 820;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.42);
  const rg = ctx.createRadialGradient(0, 0, 40, 0, 0, 420);
  rg.addColorStop(0, '#FDE68A');
  rg.addColorStop(0.35, '#FCA5A5');
  rg.addColorStop(0.7, '#93C5FD');
  rg.addColorStop(1, '#A78BFA');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(0, 0, 420, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(0, 0, 380, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(0, 0, 250, 0, Math.PI * 2);
  ctx.stroke();
  // subtle pattern spin feel via dots
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + t * 0.05;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 320, Math.sin(a) * 320, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBed(ctx: CanvasRenderingContext2D, parallax: number) {
  const x = 40 + parallax * 12;
  const y = 470;
  // frame
  ctx.fillStyle = '#FBBF24';
  roundRect(ctx, x, y + 80, 340, 120, 20);
  ctx.fill();
  ctx.fillStyle = '#FDE68A';
  roundRect(ctx, x + 20, y + 40, 300, 90, 24);
  ctx.fill();
  // pillow
  ctx.fillStyle = '#BFDBFE';
  roundRect(ctx, x + 40, y + 50, 90, 55, 18);
  ctx.fill();
  ctx.fillStyle = '#FBCFE8';
  roundRect(ctx, x + 120, y + 55, 70, 45, 16);
  ctx.fill();
  // blanket pattern
  ctx.fillStyle = '#86EFAC';
  roundRect(ctx, x + 40, y + 100, 260, 70, 16);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x + 55 + i * 48, y + 110, 20, 50);
  }
}

function drawWardrobe(ctx: CanvasRenderingContext2D, parallax: number) {
  const x = 40 + parallax * 8;
  const y = 160;
  ctx.fillStyle = '#D6A56A';
  roundRect(ctx, x, y, 200, 320, 16);
  ctx.fill();
  ctx.fillStyle = '#C48A4A';
  ctx.fillRect(x + 98, y + 10, 6, 300);
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.arc(x + 70, y + 160, 8, 0, Math.PI * 2);
  ctx.arc(x + 140, y + 160, 8, 0, Math.PI * 2);
  ctx.fill();
  // top boxes
  const colors = ['#F87171', '#60A5FA', '#34D399'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = colors[i];
    roundRect(ctx, x + 20 + i * 55, y - 45, 48, 40, 8);
    ctx.fill();
  }
}

function drawShelves(ctx: CanvasRenderingContext2D, parallax: number, t: number) {
  const x = 280 + parallax * 10;
  const y = 180;
  ctx.fillStyle = '#C4A484';
  roundRect(ctx, x, y, 280, 16, 6);
  ctx.fill();
  roundRect(ctx, x, y + 120, 280, 16, 6);
  ctx.fill();

  // toys on shelves
  drawPlush(ctx, x + 40, y - 10, '#F9A8D4');
  drawPlush(ctx, x + 120, y - 5, '#93C5FD');
  drawBall(ctx, x + 200, y - 5, 22, '#FB7185');
  drawBall(ctx, x + 245, y, 16, '#4ADE80');

  drawCar(ctx, x + 50, y + 95, '#F97316', 0.7);
  drawBlocks(ctx, x + 150, y + 70, t);
  drawPlush(ctx, x + 230, y + 95, '#FDE68A');
}

function drawPlush(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y + 28, 20, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(x - 7, y - 2, 3, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y + 4, 5, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.35, color);
  g.addColorStop(1, shade(color, -40));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  roundRect(ctx, -35, -12, 70, 24, 8);
  ctx.fill();
  ctx.fillStyle = shade(color, 30);
  roundRect(ctx, -18, -28, 40, 20, 8);
  ctx.fill();
  ctx.fillStyle = '#7DD3FC';
  roundRect(ctx, -12, -24, 14, 12, 4);
  ctx.fill();
  roundRect(ctx, 4, -24, 14, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(-22, 12, 10, 0, Math.PI * 2);
  ctx.arc(22, 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#94A3B8';
  ctx.beginPath();
  ctx.arc(-22, 12, 4, 0, Math.PI * 2);
  ctx.arc(22, 12, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBlocks(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const cols = ['#F87171', '#60A5FA', '#FBBF24'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = cols[i];
    const bob = Math.sin(t * 2 + i) * 1.5;
    roundRect(ctx, x + i * 28, y + 20 - i * 18 + bob, 26, 26, 5);
    ctx.fill();
  }
}

function drawWallArt(ctx: CanvasRenderingContext2D, parallax: number) {
  const arts = [
    { x: 600, y: 160, c: '#FCA5A5' },
    { x: 720, y: 200, c: '#93C5FD' },
    { x: 820, y: 150, c: '#86EFAC' },
  ];
  for (const a of arts) {
    const x = a.x + parallax * 6;
    ctx.fillStyle = '#FFF';
    roundRect(ctx, x, a.y, 70, 70, 8);
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = a.c;
    ctx.beginPath();
    ctx.moveTo(x + 15, a.y + 50);
    ctx.lineTo(x + 35, a.y + 20);
    ctx.lineTo(x + 55, a.y + 50);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 45, a.y + 25, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // number poster
  const px = 980 + parallax * 5;
  ctx.fillStyle = '#FFF7ED';
  roundRect(ctx, px, 140, 100, 120, 12);
  ctx.fill();
  ctx.fillStyle = '#FB923C';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('123', px + 50, 210);
}

function drawToyBox(ctx: CanvasRenderingContext2D, x: number, y: number, highlight = false) {
  ctx.fillStyle = highlight ? '#FDBA74' : '#F59E0B';
  roundRect(ctx, x, y, 160, 100, 12);
  ctx.fill();
  ctx.fillStyle = '#FBBF24';
  roundRect(ctx, x - 8, y - 18, 176, 28, 10);
  ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ИГРУШКИ', x + 80, y + 55);
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = clampByte(((n >> 16) & 255) + amt);
  const g = clampByte(((n >> 8) & 255) + amt);
  const b = clampByte((n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}
function clampByte(v: number) {
  return Math.max(0, Math.min(255, v | 0));
}

export function drawRoom(
  ctx: CanvasRenderingContext2D,
  t: number,
  camera: Camera,
  opts: { showToyBox?: boolean; toyBoxX?: number; toyBoxY?: number } = {}
) {
  ctx.save();
  const shakeX = camera.shake ? Math.sin(t * 40) * camera.shake : 0;
  const shakeY = camera.shake ? Math.cos(t * 37) * camera.shake : 0;
  ctx.translate(WIDTH / 2 + camera.x + shakeX, HEIGHT / 2 + camera.y + shakeY);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-WIDTH / 2, -HEIGHT / 2);

  const parallax = camera.x * -0.15;

  drawWallpaper(ctx, WIDTH, HEIGHT);
  drawWindow(ctx, t, parallax);
  drawSunbeams(ctx, t);
  drawWardrobe(ctx, parallax);
  drawShelves(ctx, parallax, t);
  drawWallArt(ctx, parallax);
  drawBed(ctx, parallax);
  drawFloor(ctx);
  drawRug(ctx, t);

  if (opts.showToyBox !== false) {
    drawToyBox(ctx, opts.toyBoxX ?? 1500, opts.toyBoxY ?? 680);
  }

  // Floating dust motes in sun
  ctx.fillStyle = 'rgba(255,255,220,0.35)';
  for (let i = 0; i < 18; i++) {
    const px = 1100 + ((i * 97) % 500);
    const py = 200 + ((i * 53) % 400);
    const bob = Math.sin(t * 1.2 + i) * 8;
    ctx.beginPath();
    ctx.arc(px + parallax * 3, py + bob, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSunbeams(ctx: CanvasRenderingContext2D, t: number) {
  ctx.save();
  ctx.globalAlpha = 0.12 + Math.sin(t * 0.8) * 0.02;
  const g = ctx.createLinearGradient(1400, 100, 700, 900);
  g.addColorStop(0, 'rgba(255,250,200,0.9)');
  g.addColorStop(1, 'rgba(255,250,200,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(1300, 120);
  ctx.lineTo(1700, 120);
  ctx.lineTo(1100, 900);
  ctx.lineTo(400, 900);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export { drawBall, drawCar, drawToyBox, roundRect, shade };
