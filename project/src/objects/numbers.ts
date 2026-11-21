import type { CanvasRenderingContext2D } from 'canvas';
import { DIGIT_COLORS } from '../timeline/timeline.js';
import { easeOutBack, easeOutCubic, tween } from '../utils/easing.js';
import { lerp } from '../utils/math.js';

export function drawBigNumber(
  ctx: CanvasRenderingContext2D,
  n: number,
  x: number,
  y: number,
  scale: number,
  opts: { bounce?: number; glow?: number; gold?: boolean } = {}
) {
  const color = opts.gold ? '#FFD700' : DIGIT_COLORS[n] || '#38BDF8';
  const label = String(n);
  ctx.save();
  ctx.translate(x, y + (opts.bounce || 0));
  ctx.scale(scale, scale);

  // soft glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 30 + (opts.glow || 0) * 20;

  // depth shadow
  ctx.fillStyle = 'rgba(30,40,60,0.25)';
  ctx.font = 'bold 220px "Segoe UI", "Arial Rounded MT Bold", "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 6, 10);

  // main fill
  const g = ctx.createLinearGradient(0, -100, 0, 120);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.35, color);
  g.addColorStop(1, shadeHex(color, -40));
  ctx.fillStyle = g;
  ctx.fillText(label, 0, 0);

  // outline
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 8;
  ctx.strokeText(label, 0, 0);
  ctx.strokeStyle = shadeHex(color, -60);
  ctx.lineWidth = 3;
  ctx.strokeText(label, 0, 0);

  ctx.restore();
}

export function drawTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  color = '#FFFFFF'
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 72px "Segoe UI", "Arial Rounded MT Bold", "Arial", sans-serif';
  ctx.fillStyle = 'rgba(30,40,70,0.25)';
  ctx.fillText(text, 4, 6);
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#1E3A5F';
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  // shine
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(text, 0, -2);
  ctx.restore();
}

export function appearScale(t: number, start: number, dur = 0.55): number {
  return tween(t, start, start + dur, 0, 1, easeOutBack);
}

export function bounceY(t: number, start: number, amp = 18): number {
  const local = t - start;
  if (local < 0 || local > 1.2) return 0;
  return -Math.abs(Math.sin(local * Math.PI * 3)) * amp * Math.exp(-local * 2);
}

function shadeHex(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

export function drawCountBadge(
  ctx: CanvasRenderingContext2D,
  count: number,
  x: number,
  y: number,
  active: boolean
) {
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.35;
  ctx.fillStyle = active ? DIGIT_COLORS[count] : '#94A3B8';
  ctx.beginPath();
  ctx.arc(x, y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(count), x, y + 1);
  ctx.restore();
}
