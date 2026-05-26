export type Difficulty = "casual" | "classic" | "insane";
export type GameMode = "campaign" | "endless";
export type FormationType = "classic" | "diamond" | "staggered" | "pincer";
export type PowerUpType =
  | "overdrive"
  | "prism"
  | "aegis"
  | "chrono"
  | "nanite"
  | "weaponCore"
  | "burst2"
  | "burst3"
  | "burst5"
  | "burst6"
  | "ionLance"
  | "novaShell"
  | "railBurst"
  | "beamOvercharge"
  | "cloneWing"
  | "deployBunker"
  | "temporalSlow";
export type DroneClass = "scout" | "striker" | "bulwark" | "carrier" | "elite";
export type WeaponTier = 1 | 2 | 3 | 4 | 5;

export const OG_PLAY_URL =
  import.meta.env.VITE_OG_URL ?? "https://og-space-invaders.vercel.app";

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;

export const COLORS = {
  bg: "#06060f",
  accent: "#00e8ff",
  magenta: "#ff3d9a",
  gold: "#ffcc33",
  danger: "#ff3355",
  shield: "#5dffb0",
  plasma: "#b366ff",
  amber: "#ffaa22",
};

export const WEAPON_NAMES: Record<WeaponTier, string> = {
  1: "Pulse Carbine",
  2: "Plasma Scatter",
  3: "Kinetic Gauss",
  4: "Beam Laser",
  5: "Singularity",
};

export const WEAPON_XP_THRESHOLDS = [0, 100, 280, 550, 900];

export const COMBO_WINDOW = 2;
export const COMBO_MAX = 8;
export const SLOW_DURATION = 3;
export const CLONE_DURATION = 5;

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { lives: number; alienSpeedMult: number; enemyFireChance: number }
> = {
  casual: { lives: 5, alienSpeedMult: 0.8, enemyFireChance: 0.3 },
  classic: { lives: 3, alienSpeedMult: 1, enemyFireChance: 0.5 },
  insane: { lives: 2, alienSpeedMult: 1.3, enemyFireChance: 0.72 },
};

export const DRONE_POINTS: Record<DroneClass, number> = {
  scout: 10,
  striker: 25,
  bulwark: 35,
  carrier: 40,
  elite: 60,
};

export const BOSS_POINTS = 800;
export const ALIEN_STEP_DOWN = 14;
export const PLAYER_SPEED = 300;
export const PLAYER_Y = CANVAS_HEIGHT - 58;
export const BOSS_EVERY_N = 5;
export const WAVE_BANNER_MS = 1500;
export const INVULN_TIME = 2;
export const SHIELD_COLS = 12;
export const SHIELD_ROWS = 8;
export const SHIELD_CELL = 4;
export const MAX_HEAT = 100;
export const HEAT_PER_SHOT_HEAVY = 12;
export const HEAT_COOL_RATE = 28;
export const BEAM_HEAT_RATE = 35;

export const POWERUP_DISPLAY: Record<
  PowerUpType,
  { name: string; icon: string; effect: string }
> = {
  overdrive: { name: "Overdrive", icon: "⚡", effect: "Rapid fire — 8s" },
  prism: { name: "Prism Split", icon: "◇", effect: "Bolts split on hit — 10s" },
  aegis: { name: "Aegis Shield", icon: "◈", effect: "Energy barrier restored" },
  chrono: { name: "Chrono Field", icon: "◷", effect: "Bullet time — 4s" },
  nanite: { name: "Nanite Repair", icon: "✦", effect: "Shields repaired" },
  weaponCore: { name: "Weapon Core", icon: "★", effect: "+80 weapon XP" },
  burst2: { name: "Twin Burst", icon: "‖", effect: "2-barrel volley — 8s" },
  burst3: { name: "Triple Burst", icon: "≡", effect: "3-barrel volley — 8s" },
  burst5: { name: "Penta Burst", icon: "⋮", effect: "5-barrel volley — 8s" },
  burst6: { name: "Hex Burst", icon: "⬡", effect: "6-barrel volley — 8s" },
  ionLance: { name: "Ion Lance", icon: "▸", effect: "Piercing lance — 6s" },
  novaShell: { name: "Nova Shell", icon: "✸", effect: "AoE nova rounds — 6s" },
  railBurst: { name: "Gauss Burst", icon: "●", effect: "Rapid Gauss slugs — 6s" },
  beamOvercharge: { name: "Beam Overcharge", icon: "┃", effect: "Beam laser — 6s" },
  cloneWing: { name: "Clone Wing", icon: "⧉", effect: "Mirror wingmen — 5s" },
  deployBunker: { name: "Deploy Bunker", icon: "▣", effect: "Emergency shield deployed" },
  temporalSlow: { name: "Temporal Slow", icon: "◌", effect: "Enemy fire slowed — 3s" },
};

export const BASE_POWERUP_TYPES: PowerUpType[] = [
  "overdrive",
  "prism",
  "aegis",
  "chrono",
  "nanite",
  "weaponCore",
  "burst2",
  "burst3",
  "burst5",
  "burst6",
];

export const UNLOCKABLE_PICKUPS: Record<string, PowerUpType> = {
  no_hit_l3: "ionLance",
  cool: "beamOvercharge",
  marksman: "railBurst",
  combo_master: "cloneWing",
};

export interface WaveConfig {
  formation: FormationType;
  rows: number;
  cols: number;
  speedMult: number;
}

export const WAVE_TABLE: WaveConfig[] = [
  { formation: "classic", rows: 4, cols: 10, speedMult: 1 },
  { formation: "staggered", rows: 4, cols: 9, speedMult: 1.08 },
  { formation: "diamond", rows: 4, cols: 8, speedMult: 1.12 },
  { formation: "pincer", rows: 3, cols: 10, speedMult: 1.18 },
];

export function getWaveConfig(wave: number): WaveConfig {
  const idx = (wave - 1) % WAVE_TABLE.length;
  const cycle = Math.floor((wave - 1) / WAVE_TABLE.length);
  const base = WAVE_TABLE[idx]!;
  return { ...base, speedMult: base.speedMult + cycle * 0.07 };
}

export function isBossWave(wave: number): boolean {
  return wave % BOSS_EVERY_N === 0;
}
