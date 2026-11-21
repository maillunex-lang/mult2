export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => (v - a) / (b - a);
export const remap = (v: number, a: number, b: number, c: number, d: number) =>
  lerp(c, d, clamp(invLerp(a, b, v), 0, 1));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp(invLerp(a, b, x), 0, 1);
  return t * t * (3 - 2 * t);
};
export const frac = (x: number) => x - Math.floor(x);
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};
