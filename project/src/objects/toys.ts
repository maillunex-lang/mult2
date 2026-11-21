import type { CanvasRenderingContext2D } from 'canvas';
import { drawBall, drawCar, roundRect, shade } from '../backgrounds/room.js';

export function drawToyBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  highlight = false,
  rot = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // shadow
  ctx.save();
  ctx.scale(1, 0.3);
  ctx.fillStyle = 'rgba(40,50,70,0.25)';
  ctx.beginPath();
  ctx.arc(0, r * 2.2, r * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawBall(ctx, 0, 0, r, color);
  // stripe
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r * 0.35, 0.4, 0, Math.PI * 2);
  ctx.stroke();

  if (highlight) {
    ctx.strokeStyle = 'rgba(255,255,180,0.95)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,200,0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  letter: string,
  highlight = false,
  rot = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const s = size;
  // shadow
  ctx.fillStyle = 'rgba(40,50,70,0.2)';
  ctx.beginPath();
  ctx.ellipse(4, s * 0.55, s * 0.55, s * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // top face
  ctx.fillStyle = shade(color, 40);
  ctx.beginPath();
  ctx.moveTo(-s / 2, -s / 2);
  ctx.lineTo(0, -s * 0.75);
  ctx.lineTo(s / 2, -s / 2);
  ctx.lineTo(0, -s * 0.25);
  ctx.closePath();
  ctx.fill();

  // left face
  ctx.fillStyle = shade(color, -25);
  ctx.beginPath();
  ctx.moveTo(-s / 2, -s / 2);
  ctx.lineTo(0, -s * 0.25);
  ctx.lineTo(0, s * 0.45);
  ctx.lineTo(-s / 2, s * 0.2);
  ctx.closePath();
  ctx.fill();

  // right / front face
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(s / 2, -s / 2);
  ctx.lineTo(0, -s * 0.25);
  ctx.lineTo(0, s * 0.45);
  ctx.lineTo(s / 2, s * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(s * 0.45)}px "Segoe UI", "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, s * 0.18, s * 0.05);

  if (highlight) {
    ctx.strokeStyle = 'rgba(255,255,160,0.95)';
    ctx.lineWidth = 5;
    ctx.strokeRect(-s / 2 - 6, -s * 0.75 - 4, s + 12, s * 1.35);
  }
  ctx.restore();
}

export function drawToyCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  scale = 1,
  highlight = false
) {
  ctx.save();
  ctx.translate(x, y);
  // shadow
  ctx.fillStyle = 'rgba(40,50,70,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 18 * scale, 40 * scale, 10 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  drawCar(ctx, 0, 0, color, scale);
  if (highlight) {
    ctx.strokeStyle = 'rgba(255,255,180,0.95)';
    ctx.lineWidth = 5;
    roundRect(ctx, -45 * scale, -35 * scale, 90 * scale, 55 * scale, 12);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  rot = 0,
  highlight = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = highlight ? 24 : 10;
  starPath(ctx, 0, 0, r, r * 0.45, 5);
  ctx.fill();
  ctx.shadowBlur = 0;
  // inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  starPath(ctx, -r * 0.05, -r * 0.1, r * 0.45, r * 0.2, 5);
  ctx.fill();
  ctx.restore();
}

function starPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  points: number
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? rOut : rIn;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawBalloon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  scale = 1,
  sway = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  ctx.scale(scale, scale);
  // string
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 36);
  ctx.quadraticCurveTo(8, 70, 0, 110);
  ctx.stroke();
  // balloon
  const g = ctx.createRadialGradient(-10, -15, 4, 0, 0, 36);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.35, color);
  g.addColorStop(1, shade(color, -35));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  // knot
  ctx.fillStyle = shade(color, -20);
  ctx.beginPath();
  ctx.moveTo(-6, 32);
  ctx.lineTo(0, 42);
  ctx.lineTo(6, 32);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  highlight = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(10, r * 0.28);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = Math.max(4, r * 0.1);
  ctx.beginPath();
  ctx.arc(-r * 0.15, -r * 0.15, r * 0.85, -1, 0.4);
  ctx.stroke();
  if (highlight) {
    ctx.strokeStyle = 'rgba(255,255,180,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r + 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export const BALL_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#F97316'];
export const CUBE_COLORS = ['#F43F5E', '#3B82F6', '#EAB308', '#22C55E', '#A855F7', '#06B6D4', '#F97316', '#EC4899', '#84CC16', '#F59E0B'];
export const CAR_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#06B6D4', '#F97316'];
export const STAR_COLORS = ['#FDE047', '#FB7185', '#38BDF8', '#A78BFA', '#4ADE80', '#FB923C', '#F472B6', '#2DD4BF', '#FACC15'];
export const BALLOON_COLORS = ['#F87171', '#60A5FA', '#FBBF24', '#34D399', '#C084FC', '#FB7185', '#38BDF8'];
export const RING_COLORS = ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#A855F7', '#EC4899'];
