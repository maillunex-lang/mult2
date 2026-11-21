/** Scene timing in seconds — total 180s */
export const FPS = 30;
export const DURATION = 180;
export const TOTAL_FRAMES = FPS * DURATION; // 5400
export const WIDTH = 1920;
export const HEIGHT = 1080;

export interface SceneWindow {
  id: number;
  name: string;
  start: number;
  end: number;
}

export const SCENES: SceneWindow[] = [
  { id: 1, name: 'intro', start: 0, end: 15 },
  { id: 2, name: 'digit1', start: 15, end: 28 },
  { id: 3, name: 'digit2', start: 28, end: 41 },
  { id: 4, name: 'digit3', start: 41, end: 54 },
  { id: 5, name: 'digit4', start: 54, end: 67 },
  { id: 6, name: 'digit5', start: 67, end: 80 },
  { id: 7, name: 'digit6', start: 80, end: 93 },
  { id: 8, name: 'digit7', start: 93, end: 106 },
  { id: 9, name: 'digit8', start: 106, end: 119 },
  { id: 10, name: 'digit9', start: 119, end: 132 },
  { id: 11, name: 'digit10', start: 132, end: 148 },
  { id: 12, name: 'review', start: 148, end: 170 },
  { id: 13, name: 'finale', start: 170, end: 180 },
];

export const DIGIT_COLORS: Record<number, string> = {
  1: '#FF5A5A',
  2: '#FF9F1C',
  3: '#FFD60A',
  4: '#70E000',
  5: '#00BBF9',
  6: '#9B5DE5',
  7: '#F15BB5',
  8: '#00F5D4',
  9: '#FEE440',
  10: '#FFD700',
};

export function sceneAt(t: number): SceneWindow {
  for (const s of SCENES) {
    if (t >= s.start && t < s.end) return s;
  }
  return SCENES[SCENES.length - 1];
}

export function sceneLocal(t: number, scene: SceneWindow): number {
  return t - scene.start;
}

export function sceneProgress(t: number, scene: SceneWindow): number {
  return (t - scene.start) / (scene.end - scene.start);
}
