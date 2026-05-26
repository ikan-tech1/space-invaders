export type Difficulty = "casual" | "classic" | "insane";
export type FormationType = "classic" | "diamond" | "staggered" | "pincer";
export type GameMode = "campaign" | "endless";

/** All field pickups, slot symbols, and armory catalog entries (no laser / rail). */
export type PowerUpType =
  | "rapid"
  | "spread"
  | "shield"
  | "slow"
  | "plasma"
  | "bunker"
  | "clone"
  | "wingmen"
  | "phantomFleet"
  | "escortDrones"
  | "twin"
  | "triple"
  | "quint"
  | "hex"
  | "scatter"
  | "double"
  | "burst2"
  | "burst3"
  | "homing"
  | "shockwave"
  | "volleyUp"
  | "fireRate"
  | "curseSolo"
  | "curseSlowFire"
  | "curseJam"
  | "aegis"
  | "invulnPulse"
  | "extraLife"
  | "comboAura"
  | "clearRow"
  | "freezeAliens"
  | "doubleScore"
  | "tokenBurst"
  | "hyperSpeed";

export type PickupCategory = "weapon" | "upgrade" | "curse" | "defense" | "special" | "economy" | "movement";
export type PickupDurationClass = "timed" | "untilLifeLost" | "instant";
export type PickupRarity = "common" | "uncommon" | "rare" | "cursed";

export interface PickupDef {
  label: string;
  category: PickupCategory;
  durationClass: PickupDurationClass;
  /** Seconds for timed buffs; omit for instant / until-life-lost. */
  durationSec?: number;
  symbol: string;
  rarity: PickupRarity;
  /** Relative weight in alien/UFO pools (0 = boss-only / scripted). */
  weight: number;
  minCampaignLevel?: number;
  requiresMetaUnlock?: string;
  requiresArmoryGun?: string;
  endlessBias?: number;
}

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

export const PICKUP_CATEGORY_COLORS: Record<PickupCategory, string> = {
  weapon: "#00f0ff",
  upgrade: "#ffd24a",
  curse: "#ff4466",
  defense: "#3dff8a",
  special: "#ff2d95",
  economy: "#ffd24a",
  movement: "#66ccff",
};

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { lives: number; alienSpeedMult: number; fireCooldownMult: number; enemyFireChance: number }
> = {
  casual: { lives: 5, alienSpeedMult: 0.75, fireCooldownMult: 0.7, enemyFireChance: 0.35 },
  classic: { lives: 3, alienSpeedMult: 1, fireCooldownMult: 1, enemyFireChance: 0.5 },
  insane: { lives: 2, alienSpeedMult: 1.35, fireCooldownMult: 1.25, enemyFireChance: 0.7 },
};

/** Base chance an alien kill spawns a pickup (before mode bonus). */
export const ALIEN_DROP_CHANCE: Record<Difficulty, number> = {
  casual: 0.2,
  classic: 0.2,
  insane: 0.22,
};

/** Extra drop chance in endless mode. */
export const ENDLESS_DROP_BONUS = 0.02;

/** ~7% of successful rolls pick from the cursed pool. */
export const CURSED_DROP_FRACTION = 0.07;

export const MAX_PICKUPS_ON_SCREEN = 4;

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
export const PLAYER_FIRE_COOLDOWN = 0.26;
export const RAPID_FIRE_COOLDOWN = 0.085;
export const PLASMA_FIRE_COOLDOWN = 0.14;
export const SINGLE_FIRE_COOLDOWN = 0.08;
export const SINGLE_BULLET_TOP_EXIT_Y = 40;
export const COMBO_WINDOW = 2.35;
export const COMBO_MAX = 8;
export const POWERUP_DURATION = 8;
export const SLOW_DURATION = 3;
export const BOSS_EVERY_N_WAVES = 5;
export const MINI_BOSS_EVERY = 3;
export const BIG_BOSS_EVERY = 6;
export const WAVE_BANNER_MS = 1400;
export const INVULN_TIME = 2;
export const SLOT_MAX_LIVES = 5;
export const SLOT_LIFE_CHANCE = 0.14;
export const SLOT_POWERUP_CHANCE = 0.22;
export const SLOT_SHIELD_CHANCE = 0.1;
export const SLOT_TOKEN_CHANCE = 0.08;
export const SLOT_SECOND_WIND_CHANCE = 0.06;
export const SLOT_TOKEN_PAYOUT = 8;

/** Alien march evolution — tuned per level band in levelScript.ts */
export type AlienMovementStyle = "classic" | "advance" | "snake" | "creep" | "pulse";

export const MOVEMENT_TUNING = {
  /** Rebuild bunkers at start of every Nth level (3, 5, 7…) */
  bunkerRespawnEvery: 2,
  /** Also rebuild after clearing a mini-boss level */
  bunkerRespawnOnMiniBossClear: true,
  /** Minimum bunker durability after repeated respawns (0–1) */
  bunkerMinDurability: 0.42,
  /** Durability lost per respawn cycle */
  bunkerDegradePerCycle: 0.1,
  /** Downward drift between horizontal steps (px/s at L5 baseline) */
  creepSpeedBase: 0.35,
  creepSpeedPerLevel: 0.1,
  /** Time-pressure nudge when formation stalls */
  pulseIntervalSec: 14,
  pulseAdvancePx: 3,
  /** Edge hits before advance-pressure extra drop */
  advanceEdgeHits: 5,
  advanceExtraDropPx: 10,
  /** Row ripple delay for snake wave (seconds per row) */
  snakeRippleDelay: 0.045,
  /** Flash duration when bunkers rebuild */
  bunkerRebuildFlashSec: 1.2,
} as const;

export const PICKUP_DEFS: Record<PowerUpType, PickupDef> = {
  rapid: {
    label: "Rapid Pulse",
    category: "weapon",
    durationClass: "timed",
    durationSec: 6,
    symbol: "⚡",
    rarity: "common",
    weight: 14,
  },
  spread: {
    label: "Spread Array",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "⋔",
    rarity: "common",
    weight: 12,
  },
  twin: {
    label: "Twin Blasters",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "×2",
    rarity: "common",
    weight: 11,
  },
  triple: {
    label: "Triple Burst",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "×3",
    rarity: "common",
    weight: 10,
  },
  double: {
    label: "Double Fire",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "‖",
    rarity: "common",
    weight: 9,
    requiresArmoryGun: "double",
  },
  scatter: {
    label: "Scatter Fan",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "⋮",
    rarity: "uncommon",
    weight: 8,
    requiresArmoryGun: "scatter",
  },
  burst2: {
    label: "Burst Mk-II",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "Ⅱ",
    rarity: "uncommon",
    weight: 7,
    requiresArmoryGun: "burst2",
    minCampaignLevel: 2,
  },
  burst3: {
    label: "Burst Mk-III",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "Ⅲ",
    rarity: "uncommon",
    weight: 6,
    requiresArmoryGun: "burst3",
    minCampaignLevel: 3,
  },
  quint: {
    label: "Quint Salvo",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "×5",
    rarity: "uncommon",
    weight: 6,
    minCampaignLevel: 2,
  },
  hex: {
    label: "Hex Storm",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "×6",
    rarity: "rare",
    weight: 4,
    minCampaignLevel: 4,
  },
  homing: {
    label: "Seeker Pods",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "◎",
    rarity: "rare",
    weight: 5,
    requiresArmoryGun: "homing",
    minCampaignLevel: 3,
  },
  shockwave: {
    label: "Shockwave",
    category: "weapon",
    durationClass: "timed",
    durationSec: POWERUP_DURATION,
    symbol: "≋",
    rarity: "rare",
    weight: 4,
    requiresArmoryGun: "shockwave",
    minCampaignLevel: 4,
  },
  plasma: {
    label: "Nova Plasma",
    category: "weapon",
    durationClass: "timed",
    durationSec: 6,
    symbol: "✦",
    rarity: "rare",
    weight: 5,
    requiresMetaUnlock: "plasma",
    minCampaignLevel: 2,
  },
  volleyUp: {
    label: "Volley +1",
    category: "upgrade",
    durationClass: "timed",
    durationSec: 30,
    symbol: "↑",
    rarity: "uncommon",
    weight: 7,
  },
  fireRate: {
    label: "Overclock",
    category: "upgrade",
    durationClass: "timed",
    durationSec: 30,
    symbol: "»",
    rarity: "uncommon",
    weight: 7,
  },
  curseSolo: {
    label: "Cursed Solo",
    category: "curse",
    durationClass: "timed",
    durationSec: 8,
    symbol: "☠",
    rarity: "cursed",
    weight: 3,
  },
  curseSlowFire: {
    label: "Gunked Feed",
    category: "curse",
    durationClass: "timed",
    durationSec: 8,
    symbol: "▼",
    rarity: "cursed",
    weight: 3,
  },
  curseJam: {
    label: "Weapon Jam",
    category: "curse",
    durationClass: "timed",
    durationSec: 2,
    symbol: "✕",
    rarity: "cursed",
    weight: 2,
  },
  shield: {
    label: "Shield Patch",
    category: "defense",
    durationClass: "instant",
    symbol: "◆",
    rarity: "common",
    weight: 10,
  },
  bunker: {
    label: "Emergency Bunker",
    category: "defense",
    durationClass: "instant",
    symbol: "▣",
    rarity: "uncommon",
    weight: 5,
    minCampaignLevel: 3,
  },
  aegis: {
    label: "Aegis Field",
    category: "defense",
    durationClass: "untilLifeLost",
    symbol: "◇",
    rarity: "rare",
    weight: 3,
    minCampaignLevel: 2,
  },
  invulnPulse: {
    label: "Invuln Pulse",
    category: "defense",
    durationClass: "timed",
    durationSec: 3,
    symbol: "☼",
    rarity: "uncommon",
    weight: 4,
  },
  extraLife: {
    label: "Rescue Pod",
    category: "defense",
    durationClass: "instant",
    symbol: "♥",
    rarity: "rare",
    weight: 1,
  },
  comboAura: {
    label: "Combo Aura",
    category: "special",
    durationClass: "untilLifeLost",
    symbol: "∞",
    rarity: "uncommon",
    weight: 4,
  },
  slow: {
    label: "Time Dilation",
    category: "special",
    durationClass: "timed",
    durationSec: SLOW_DURATION,
    symbol: "◷",
    rarity: "common",
    weight: 8,
  },
  clone: {
    label: "Ghost Clone",
    category: "special",
    durationClass: "timed",
    durationSec: 5,
    symbol: "◎",
    rarity: "uncommon",
    weight: 5,
    requiresMetaUnlock: "clone",
  },
  wingmen: {
    label: "Wingmen",
    category: "special",
    durationClass: "timed",
    durationSec: 8,
    symbol: "⇉",
    rarity: "uncommon",
    weight: 4,
    minCampaignLevel: 2,
  },
  phantomFleet: {
    label: "Phantom Fleet",
    category: "special",
    durationClass: "timed",
    durationSec: 5,
    symbol: "⋮⋮",
    rarity: "rare",
    weight: 3,
    minCampaignLevel: 4,
  },
  escortDrones: {
    label: "Escort Drones",
    category: "special",
    durationClass: "timed",
    durationSec: 12,
    symbol: "◉",
    rarity: "uncommon",
    weight: 4,
    minCampaignLevel: 3,
  },
  clearRow: {
    label: "Row Purge",
    category: "special",
    durationClass: "instant",
    symbol: "═",
    rarity: "uncommon",
    weight: 4,
  },
  freezeAliens: {
    label: "Stasis Grid",
    category: "special",
    durationClass: "timed",
    durationSec: 3,
    symbol: "❄",
    rarity: "uncommon",
    weight: 5,
  },
  doubleScore: {
    label: "Score Surge",
    category: "special",
    durationClass: "timed",
    durationSec: 10,
    symbol: "×2◎",
    rarity: "rare",
    weight: 4,
  },
  tokenBurst: {
    label: "Token Burst",
    category: "economy",
    durationClass: "instant",
    symbol: "◎+",
    rarity: "uncommon",
    weight: 6,
  },
  hyperSpeed: {
    label: "Hyper Drive",
    category: "movement",
    durationClass: "timed",
    durationSec: 5,
    symbol: "»»",
    rarity: "common",
    weight: 7,
  },
};

export const POWERUP_LABELS: Record<PowerUpType, string> = Object.fromEntries(
  Object.entries(PICKUP_DEFS).map(([k, v]) => [k, v.label])
) as Record<PowerUpType, string>;

export const SLOT_SYMBOLS: Record<"life" | "miss" | PowerUpType, string> = {
  life: "♥",
  miss: "—",
  ...Object.fromEntries(Object.entries(PICKUP_DEFS).map(([k, v]) => [k, v.symbol])),
} as Record<"life" | "miss" | PowerUpType, string>;

/** Good-tier pool for UFO / mini-boss guaranteed drops. */
export const GOOD_DROP_TYPES: PowerUpType[] = [
  "triple",
  "quint",
  "plasma",
  "volleyUp",
  "fireRate",
  "aegis",
  "comboAura",
  "shield",
  "tokenBurst",
  "wingmen",
  "phantomFleet",
];

/** Max side-ship sprites (wingmen / clone / phantom) to limit clutter. */
export const MAX_FLEET_SIDE_SHIPS = 3;

/** Side volley damage multiplier for phantom fleet wing ships. */
export const PHANTOM_FLEET_SIDE_DAMAGE = 0.7;

export const CURSED_TYPES: PowerUpType[] = ["curseSolo", "curseSlowFire", "curseJam"];

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

export function getPickupDef(type: PowerUpType): PickupDef {
  return PICKUP_DEFS[type];
}

export function pickupToastLine(type: PowerUpType): string {
  const d = PICKUP_DEFS[type];
  if (d.durationClass === "instant") return `${d.label}`;
  if (d.durationClass === "untilLifeLost") return `${d.label} — until life lost`;
  return `${d.label} — ${d.durationSec ?? POWERUP_DURATION}s`;
}

export interface PickupRollContext {
  level: number;
  gameMode: GameMode;
  unlockedPickups: string[];
  unlockedGuns: string[];
  challengePlasma: boolean;
}

function pickupAllowed(type: PowerUpType, ctx: PickupRollContext): boolean {
  const def = PICKUP_DEFS[type];
  if (def.minCampaignLevel && ctx.gameMode === "campaign" && ctx.level < def.minCampaignLevel) {
    return false;
  }
  if (def.requiresMetaUnlock && !ctx.unlockedPickups.includes(def.requiresMetaUnlock)) {
    if (def.requiresMetaUnlock === "plasma" && ctx.challengePlasma) return true;
    return false;
  }
  if (def.requiresArmoryGun && !ctx.unlockedGuns.includes(def.requiresArmoryGun)) {
    return false;
  }
  return true;
}

export function buildPickupPool(
  ctx: PickupRollContext,
  opts?: { cursedOnly?: boolean; goodOnly?: boolean }
): { type: PowerUpType; weight: number }[] {
  const out: { type: PowerUpType; weight: number }[] = [];
  const types = opts?.cursedOnly
    ? CURSED_TYPES
    : opts?.goodOnly
      ? GOOD_DROP_TYPES
      : (Object.keys(PICKUP_DEFS) as PowerUpType[]);

  for (const type of types) {
    if (!pickupAllowed(type, ctx)) continue;
    const def = PICKUP_DEFS[type];
    if (def.weight <= 0) continue;
    if (opts?.goodOnly && def.rarity === "cursed") continue;
    let w = def.weight;
    if (ctx.gameMode === "endless" && def.endlessBias) w += def.endlessBias;
    if (ctx.gameMode === "endless" && def.rarity === "rare") w += 1;
    out.push({ type, weight: w });
  }
  return out;
}

export function rollWeightedPickup(
  pool: { type: PowerUpType; weight: number }[]
): PowerUpType | null {
  if (!pool.length) return null;
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const entry of pool) {
    r -= entry.weight;
    if (r <= 0) return entry.type;
  }
  return pool[pool.length - 1]!.type;
}

export function rollFieldPickup(ctx: PickupRollContext): PowerUpType | null {
  const cursed = Math.random() < CURSED_DROP_FRACTION;
  const pool = buildPickupPool(ctx, { cursedOnly: cursed });
  if (!pool.length && cursed) return rollFieldPickup({ ...ctx });
  return rollWeightedPickup(pool);
}

export function rollGoodPickup(ctx: PickupRollContext): PowerUpType | null {
  const pool = buildPickupPool(ctx, { goodOnly: true });
  return rollWeightedPickup(pool.length ? pool : buildPickupPool(ctx));
}
