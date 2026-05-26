import type { DroneClass, PowerUpType } from "../../config";
import type { Projectile } from "../../weapons/projectiles";

export interface Drone {
  x: number;
  y: number;
  row: number;
  droneClass: DroneClass;
  alive: boolean;
  hp: number;
  animPhase: number;
  shootCd: number;
}

export interface Shield {
  cells: boolean[][];
  x: number;
  y: number;
}

export interface PowerUpDrop {
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
  active: boolean;
  rot: number;
}

export type BossKind = "mini" | "big";

export interface Boss {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  direction: number;
  phase: number;
  active: boolean;
  patternTimer: number;
  kind: BossKind;
}

export interface UFO {
  x: number;
  y: number;
  direction: number;
  active: boolean;
  points: number;
}

export type { Projectile };
