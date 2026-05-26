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

export type MiniBossArchetype = "bulwark" | "swarmQueen" | "slicer" | "bombardier";
export type BigBossArchetype = "hiveSentinel" | "overmind" | "dreadnought";
export type BossArchetype = MiniBossArchetype | BigBossArchetype;

export type BossMovePattern = "slow" | "fast" | "bob" | "zigzag";
export type BossAttackPattern =
  | "spread"
  | "aimedBurst"
  | "spiral"
  | "dropBomb"
  | "crossBurst"
  | "homingVolley"
  | "laserSweep";

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
  /** Countdown before boss volley — telegraph flash in renderer. */
  telegraphTimer: number;
  attackCooldown: number;
  /** Design identity */
  archetype: BossArchetype;
  name: string;
  movePattern: BossMovePattern;
  attackPattern: BossAttackPattern;
  /** Secondary attack in phase 2 (big bosses). */
  phase2Attack?: BossAttackPattern;
  /** Movement helpers */
  baseY: number;
  moveTimer: number;
  spiralAngle: number;
  spawnTimer: number;
  color: string;
  accent: string;
  spriteKey: string;
}

export interface Shield {
  cells: boolean[][];
  x: number;
  y: number;
}
