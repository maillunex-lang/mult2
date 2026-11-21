import type { CanvasRenderingContext2D } from 'canvas';
import { clamp, lerp, hash } from '../utils/math.js';
import { easeOutBack, easeOutCubic, pulse, tween } from '../utils/easing.js';

export type BeepEmotion = 'happy' | 'smile' | 'surprise' | 'joy' | 'curious' | 'proud';

export interface BeepPose {
  x: number;
  y: number;
  scale: number;
  bodyRot: number; // degrees
  headRot: number;
  lean: number;
  bounce: number;
  squash: number; // y-scale multiplier around 1
  stretch: number;
  armL: number; // degrees, 0 = down
  armR: number;
  handL: number;
  handR: number;
  legL: number;
  legR: number;
  eyeScaleY: number; // blink
  pupilX: number; // -1..1
  pupilY: number;
  mouth: number; // 0 smile .. 1 open surprise .. 2 joy
  glow: number;
  opacity: number;
  emotion: BeepEmotion;
  pointing: 'none' | 'left' | 'right' | 'up';
  wave: number; // wave intensity 0..1
}

export function defaultPose(): BeepPose {
  return {
    x: 960,
    y: 720,
    scale: 1,
    bodyRot: 0,
    headRot: 0,
    lean: 0,
    bounce: 0,
    squash: 1,
    stretch: 1,
    armL: -12,
    armR: 12,
    handL: 0,
    handR: 0,
    legL: 0,
    legR: 0,
    eyeScaleY: 1,
    pupilX: 0,
    pupilY: 0,
    mouth: 0,
    glow: 1,
    opacity: 1,
    emotion: 'smile',
    pointing: 'none',
    wave: 0,
  };
}

/** Idle life: breathing, blink, subtle sway — deterministic from time */
export function applyIdle(pose: BeepPose, t: number, seed = 1): BeepPose {
  const p = { ...pose };
  const breath = Math.sin(t * 2.2 + seed) * 0.018;
  p.squash = pose.squash * (1 + breath);
  p.stretch = pose.stretch * (1 - breath * 0.5);
  p.bodyRot += Math.sin(t * 1.1 + seed * 2) * 1.2;
  p.headRot += Math.sin(t * 0.9 + 1.5) * 1.5;
  p.bounce += Math.sin(t * 2.2 + seed) * 3;

  // Blink every ~3.2s, short
  const blinkCycle = (t + seed * 0.37) % 3.2;
  if (blinkCycle > 3.0) {
    const bt = (blinkCycle - 3.0) / 0.2;
    p.eyeScaleY = bt < 0.5 ? 1 - bt * 2 : (bt - 0.5) * 2;
  }

  // Occasional pupil drift
  p.pupilX += Math.sin(t * 0.7 + seed) * 0.15;
  p.pupilY += Math.cos(t * 0.55 + seed) * 0.1;

  if (p.wave > 0) {
    p.armR = 55 + Math.sin(t * 10) * 40 * p.wave;
    p.handR = Math.sin(t * 10) * 15 * p.wave;
  }

  if (p.pointing === 'right') {
    p.armR = 70;
    p.handR = 5;
  } else if (p.pointing === 'left') {
    p.armL = -70;
    p.handL = -5;
  } else if (p.pointing === 'up') {
    p.armR = 110;
    p.armL = -110;
  }

  // Emotion mouth defaults
  if (p.emotion === 'surprise') p.mouth = lerp(p.mouth, 1, 0.5);
  if (p.emotion === 'joy' || p.emotion === 'happy') p.mouth = lerp(p.mouth, 0.35, 0.4);
  if (p.emotion === 'proud') p.mouth = lerp(p.mouth, 0.2, 0.4);

  return p;
}

export function hopAt(localT: number, start: number, height = 40): { y: number; squash: number } {
  const dur = 0.55;
  if (localT < start || localT > start + dur) return { y: 0, squash: 1 };
  const u = (localT - start) / dur;
  const y = -Math.sin(u * Math.PI) * height;
  const squash = u < 0.15 ? 1 - u * 0.8 : u > 0.85 ? 1 - (1 - u) * 0.8 : 1 + Math.sin(u * Math.PI) * 0.08;
  return { y, squash };
}

export function walkCycle(t: number, speed = 1): Pick<BeepPose, 'legL' | 'legR' | 'armL' | 'armR' | 'bounce' | 'bodyRot'> {
  const a = t * speed * Math.PI * 2;
  return {
    legL: Math.sin(a) * 22,
    legR: Math.sin(a + Math.PI) * 22,
    armL: Math.sin(a + Math.PI) * 18,
    armR: Math.sin(a) * 18,
    bounce: Math.abs(Math.sin(a * 2)) * 6,
    bodyRot: Math.sin(a) * 3,
  };
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

function drawLimb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  rotDeg: number,
  thickness: number,
  color: string,
  tipColor: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotDeg * Math.PI) / 180);
  // upper
  const grad = ctx.createLinearGradient(-thickness, 0, thickness, 0);
  grad.addColorStop(0, '#E8EEF5');
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, '#D0D8E4');
  ctx.fillStyle = grad;
  roundRect(ctx, -thickness / 2, 0, thickness, len * 0.55, thickness / 2);
  ctx.fill();
  // joint ring
  ctx.fillStyle = '#7DD3FC';
  ctx.beginPath();
  ctx.arc(0, len * 0.55, thickness * 0.38, 0, Math.PI * 2);
  ctx.fill();
  // lower
  roundRect(ctx, -thickness * 0.42, len * 0.55, thickness * 0.84, len * 0.45, thickness * 0.42);
  ctx.fillStyle = grad;
  ctx.fill();
  // tip / hand-foot
  ctx.fillStyle = tipColor;
  ctx.beginPath();
  ctx.ellipse(0, len + thickness * 0.15, thickness * 0.55, thickness * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBeep(ctx: CanvasRenderingContext2D, pose: BeepPose) {
  if (pose.opacity <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = pose.opacity;
  ctx.translate(pose.x, pose.y - pose.bounce);
  ctx.rotate(((pose.bodyRot + pose.lean) * Math.PI) / 180);
  ctx.scale(pose.scale * pose.stretch, pose.scale * pose.squash);

  const bodyW = 118;
  const bodyH = 130;

  // Ground shadow
  ctx.save();
  ctx.translate(0, 95);
  ctx.scale(1, 0.28);
  const sg = ctx.createRadialGradient(0, 0, 5, 0, 0, 70);
  sg.addColorStop(0, 'rgba(40,60,90,0.28)');
  sg.addColorStop(1, 'rgba(40,60,90,0)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Legs
  drawLimb(ctx, -28, 48, 52, pose.legL + 8, 28, '#F7FAFC', '#7DD3FC');
  drawLimb(ctx, 28, 48, 52, pose.legR - 8, 28, '#F7FAFC', '#7DD3FC');

  // Arms: 0 = hanging down; positive raises outward/up
  const armBaseY = -8;
  drawLimb(ctx, -48, armBaseY, 56, 160 + pose.armL, 26, '#F7FAFC', '#67E8F9');
  drawLimb(ctx, 48, armBaseY, 56, -160 + pose.armR, 26, '#F7FAFC', '#67E8F9');

  // Body
  ctx.save();
  const bodyGrad = ctx.createLinearGradient(-bodyW / 2, -bodyH / 2, bodyW / 2, bodyH / 2);
  bodyGrad.addColorStop(0, '#FFFFFF');
  bodyGrad.addColorStop(0.45, '#F4F8FC');
  bodyGrad.addColorStop(1, '#D7E3F0');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 10, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft rim light
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(-8, -5, bodyW / 2 - 8, bodyH / 2 - 10, -0.2, Math.PI * 0.9, Math.PI * 1.55);
  ctx.stroke();

  // Chest glow core
  const glowPulse = 0.85 + 0.15 * Math.sin(pose.glow * 8);
  const cg = ctx.createRadialGradient(0, 18, 2, 0, 18, 28 * glowPulse);
  cg.addColorStop(0, 'rgba(165,243,252,1)');
  cg.addColorStop(0.4, 'rgba(56,189,248,0.85)');
  cg.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 18, 28 * glowPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E0F7FF';
  ctx.beginPath();
  ctx.arc(0, 18, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(0, 18, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Head
  ctx.save();
  ctx.translate(0, -78);
  ctx.rotate((pose.headRot * Math.PI) / 180);

  // Antenna
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.lineTo(0, -88);
  ctx.stroke();
  const ag = ctx.createRadialGradient(0, -95, 1, 0, -95, 14);
  ag.addColorStop(0, '#A5F3FC');
  ag.addColorStop(0.5, '#22D3EE');
  ag.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.arc(0, -95, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#67E8F9';
  ctx.beginPath();
  ctx.arc(0, -95, 7, 0, Math.PI * 2);
  ctx.fill();

  // Head sphere
  const hg = ctx.createLinearGradient(-55, -50, 55, 50);
  hg.addColorStop(0, '#FFFFFF');
  hg.addColorStop(0.5, '#F8FAFC');
  hg.addColorStop(1, '#D2DEEA');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.ellipse(0, 0, 62, 58, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ear discs
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.ellipse(side * 58, 4, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    const eg = ctx.createRadialGradient(side * 58, 4, 1, side * 58, 4, 10);
    eg.addColorStop(0, '#A5F3FC');
    eg.addColorStop(1, '#0EA5E9');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(side * 58, 4, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Face screen
  ctx.fillStyle = '#0F172A';
  roundRect(ctx, -42, -28, 84, 58, 22);
  ctx.fill();
  // screen gloss
  ctx.fillStyle = 'rgba(100,140,200,0.15)';
  roundRect(ctx, -38, -24, 76, 22, 12);
  ctx.fill();

  // Eyes
  const eyeY = -6;
  const eyeSpacing = 18;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * eyeSpacing, eyeY);
    ctx.scale(1, Math.max(0.08, pose.eyeScaleY));
    // white/blue iris
    const iris = ctx.createRadialGradient(-3, -3, 1, 0, 0, 14);
    iris.addColorStop(0, '#E0F2FE');
    iris.addColorStop(0.35, '#38BDF8');
    iris.addColorStop(1, '#0284C7');
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    // pupil
    ctx.fillStyle = '#0B1220';
    ctx.beginPath();
    ctx.arc(pose.pupilX * 4, pose.pupilY * 3, 5.5, 0, Math.PI * 2);
    ctx.fill();
    // highlights
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(-4, -4, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, 2, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Mouth
  ctx.strokeStyle = '#F9A8D4';
  ctx.fillStyle = '#F472B6';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  if (pose.mouth < 0.5) {
    // smile
    ctx.beginPath();
    ctx.arc(0, 14, 10 + pose.mouth * 6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (pose.mouth < 1.2) {
    // surprise O
    const open = (pose.mouth - 0.5) / 0.7;
    ctx.beginPath();
    ctx.ellipse(0, 16, 6 + open * 2, 5 + open * 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9D174D';
    ctx.beginPath();
    ctx.ellipse(0, 18, 4, 3 + open * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // joy open smile
    ctx.beginPath();
    ctx.moveTo(-12, 12);
    ctx.quadraticCurveTo(0, 28, 12, 12);
    ctx.quadraticCurveTo(0, 20, -12, 12);
    ctx.fill();
  }

  ctx.restore(); // head
  ctx.restore(); // root
}

/** High-level choreography helpers returning pose overlays */
export function celebrate(t: number, start: number): Partial<BeepPose> {
  const local = t - start;
  if (local < 0 || local > 1.2) return {};
  const hop = hopAt(local, 0, 55);
  return {
    bounce: -hop.y,
    squash: hop.squash,
    emotion: 'joy',
    armL: -50 - Math.sin(local * 14) * 30,
    armR: 50 + Math.sin(local * 14) * 30,
    mouth: 1.5,
    wave: 0,
  };
}
