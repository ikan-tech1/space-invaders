export type Difficulty = "casual" | "classic" | "insane";
export type FormationType = "classic" | "diamond" | "staggered" | "pincer";
export type PowerUpType =
  | "rapid"
  | "spread"
  | "shield"
  | "slow"
  | "plasma"
  | "bunker"
  | "clone"
  | "twin"
  | "triple"
  | "quint"
  | "hex";
export type GameMode = "campaign" | "endless";

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;

export const COLORS = {
  bg: "#0a0e1a",
  accent: "#00f0ff",
  magenta: "#ff2d95",
  gold: "#ffd24a",
  danger: "#ff4466",
  alien1: "#00f0ff",
  alien2: "#ff2d95",
  alien3: "#7bff6e",
  player: "#00f0ff",
  shield: "#3dff8a",
  ufo: "#ffd24a",
  boss: "#ff4466",
};

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { lives: number; alienSpeedMult: number; fireCooldownMult: number; enemyFireChance: number }
> = {
  casual: { lives: 5, alienSpeedMult: 0.75, fireCooldownMult: 0.7, enemyFireChance: 0.35 },
  classic: { lives: 3, alienSpeedMult: 1, fireCooldownMult: 1, enemyFireChance: 0.5 },
  insane: { lives: 2, alienSpeedMult: 1.35, fireCooldownMult: 1.25, enemyFireChance: 0.7 },
};

export const ALIEN_POINTS = [30, 20, 10];
export const UFO_POINTS = [50, 100, 150, 300];
export const BOSS_POINTS = 500;

export const PLAYER_SPEED = 280;
export const PLAYER_Y = CANVAS_HEIGHT - 56;
export const BULLET_SPEED = 420;
export const ENEMY_BULLET_SPEED = 220;
export const ALIEN_STEP_DOWN = 16;
export const BASE_ALIEN_H_STEP = 8;
export const BASE_ALIEN_TICK = 0.55;
export const MIN_ALIEN_TICK = 0.12;
/** Minimum gap between multi-volley / power-up shots (seconds). */
export const PLAYER_FIRE_COOLDOWN = 0.26;
/** Rapid / plasma pulse interval (seconds). */
export const RAPID_FIRE_COOLDOWN = 0.085;
/** Nova plasma volley interval (seconds). */
export const PLASMA_FIRE_COOLDOWN = 0.14;
/** Cooldown after a solo-cannon shot once the bullet slot is open (seconds). */
export const SINGLE_FIRE_COOLDOWN = 0.08;
/** Y threshold — solo bullets despawn here (top exit) so hold-to-fire can refire sooner. */
export const SINGLE_BULLET_TOP_EXIT_Y = 40;
export const COMBO_WINDOW = 2.35;
export const COMBO_MAX = 8;
export const POWERUP_DURATION = 8;
export const SLOW_DURATION = 3;
export const BOSS_EVERY_N_WAVES = 5; // legacy
export const MINI_BOSS_EVERY = 3;
export const BIG_BOSS_EVERY = 6;
export const WAVE_BANNER_MS = 1400;
export const INVULN_TIME = 2;
/** Max lives including slot-machine bonus. */
export const SLOT_MAX_LIVES = 5;
/** Slot outcome weights (must sum to ≤ 1; remainder is miss). Lucky Reels upgrade scales life + power only. */
export const SLOT_LIFE_CHANCE = 0.14;
export const SLOT_POWERUP_CHANCE = 0.22;
export const SLOT_SHIELD_CHANCE = 0.1;
export const SLOT_TOKEN_CHANCE = 0.08;
export const SLOT_SECOND_WIND_CHANCE = 0.06;
export const SLOT_TOKEN_PAYOUT = 8;

export const POWERUP_LABELS: Record<PowerUpType, string> = {
  rapid: "Rapid Pulse",
  spread: "Spread Array",
  shield: "Shield Patch",
  slow: "Time Dilation",
  plasma: "Nova Plasma",
  bunker: "Emergency Bunker",
  clone: "Ghost Clone",
  twin: "Twin Blasters",
  triple: "Triple Burst",
  quint: "Quint Salvo",
  hex: "Hex Storm",
};

export const SLOT_SYMBOLS: Record<"life" | "miss" | PowerUpType, string> = {
  life: "♥",
  miss: "—",
  rapid: "⚡",
  spread: "⋔",
  shield: "◆",
  slow: "◷",
  plasma: "✦",
  bunker: "▣",
  clone: "◎",
  twin: "×2",
  triple: "×3",
  quint: "×5",
  hex: "×6",
};
export const SHIELD_COLS = 12;
export const SHIELD_ROWS = 8;
export const SHIELD_CELL = 4;

export interface WaveConfig {
  formation: FormationType;
  rows: number;
  cols: number;
  speedMult: number;
}

export const WAVE_TABLE: WaveConfig[] = [
  { formation: "classic", rows: 5, cols: 11, speedMult: 1 },
  { formation: "staggered", rows: 5, cols: 10, speedMult: 1.05 },
  { formation: "diamond", rows: 5, cols: 9, speedMult: 1.1 },
  { formation: "pincer", rows: 4, cols: 11, speedMult: 1.15 },
];

export function getWaveConfig(wave: number): WaveConfig {
  const idx = (wave - 1) % WAVE_TABLE.length;
  const cycle = Math.floor((wave - 1) / WAVE_TABLE.length);
  const base = WAVE_TABLE[idx]!;
  return {
    ...base,
    speedMult: base.speedMult + cycle * 0.08,
  };
}

export function isBossWave(wave: number): boolean {
  return wave % BOSS_EVERY_N_WAVES === 0;
}
