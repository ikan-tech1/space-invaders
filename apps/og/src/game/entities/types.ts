import type { PowerUpType } from "../../config";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Bullet {
  x: number;
  y: number;
  vy: number;
  vx?: number;
  fromPlayer: boolean;
  spread?: boolean;
  pierce?: boolean;
  plasma?: boolean;
  homing?: boolean;
  shockwave?: boolean;
  active: boolean;
}

export interface Alien {
  x: number;
  y: number;
  row: number;
  type: number;
  alive: boolean;
  animFrame: number;
}

export interface PowerUpDrop {
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
  active: boolean;
}

export interface UFO {
  x: number;
  y: number;
  direction: number;
  active: boolean;
  points: number;
}

export type BossKind = "mini" | "big";

export interface Boss {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  direction: number;
  weakPoint: number;
  active: boolean;
  kind: BossKind;
  phase: number;
  fireTimer: number;
}

export interface Shield {
  cells: boolean[][];
  x: number;
  y: number;
}
