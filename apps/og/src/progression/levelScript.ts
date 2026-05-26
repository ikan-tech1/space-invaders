import type { FormationType, AlienMovementStyle, Difficulty } from "../config";
import { MOVEMENT_TUNING } from "../config";
import { getBigBossArchetype, getMiniBossArchetype, BIG_BOSSES, MINI_BOSSES } from "./bosses";

export type EncounterType = "standard" | "miniBoss" | "bigBoss";

export interface LevelConfig {
  level: number;
  sector: number;
  codename: string;
  identity: string;
  formation: FormationType;
  formationFlavor: string;
  speedMult: number;
  fireMult: number;
  rows: number;
  cols: number;
  encounter: EncounterType;
  threat: "Low" | "Medium" | "High" | "Extreme";
  movementStyle: AlienMovementStyle;
  movementLabel: string;
}

type StoredLevelConfig = Omit<LevelConfig, "movementStyle" | "movementLabel">;

export interface MovementRuntimeConfig {
  style: AlienMovementStyle;
  label: string;
  creepSpeed: number;
  pulseInterval: number;
  pulseAdvancePx: number;
  advanceEdgeHits: number;
  advanceExtraDropPx: number;
  snakeRippleDelay: number;
  /** Blended secondary styles at high levels */
  creepEnabled: boolean;
  pulseEnabled: boolean;
  advanceEnabled: boolean;
  snakeEnabled: boolean;
}

export const CAMPAIGN_MAX_LEVEL = 12;

export function getEncounterType(level: number): EncounterType {
  if (level % 6 === 0) return "bigBoss";
  if (level % 3 === 0) return "miniBoss";
  return "standard";
}

function movementForLevel(level: number): { style: AlienMovementStyle; label: string } {
  if (level <= 2) return { style: "classic", label: "Standard march" };
  if (level <= 4) return { style: "creep", label: "Creep formation" };
  if (level <= 6) return { style: "advance", label: "Advance pressure" };
  if (level <= 8) return { style: "snake", label: "Snake wave" };
  if (level <= 10) return { style: "pulse", label: "Pulse advance" };
  return { style: "advance", label: "Combined assault" };
}

export function getMovementConfig(level: number, difficulty: Difficulty): MovementRuntimeConfig {
  const { style, label } = movementForLevel(level);
  const diffMult =
    difficulty === "casual" ? 0.72 : difficulty === "insane" ? 1.28 : 1;
  const creepSpeed =
    (MOVEMENT_TUNING.creepSpeedBase +
      Math.max(0, level - 4) * MOVEMENT_TUNING.creepSpeedPerLevel) *
    diffMult;
  const pulseInterval =
    MOVEMENT_TUNING.pulseIntervalSec -
    Math.min(3, Math.max(0, level - 8) * 0.35) -
    (difficulty === "insane" ? 1.2 : difficulty === "casual" ? -1 : 0);
  const advanceEdgeHits = Math.max(
    3,
    MOVEMENT_TUNING.advanceEdgeHits - Math.floor((level - 6) / 3)
  );

  const highBand = level >= 9;
  return {
    style,
    label,
    creepSpeed,
    pulseInterval: Math.max(6, pulseInterval),
    pulseAdvancePx: MOVEMENT_TUNING.pulseAdvancePx,
    advanceEdgeHits,
    advanceExtraDropPx: MOVEMENT_TUNING.advanceExtraDropPx,
    snakeRippleDelay: MOVEMENT_TUNING.snakeRippleDelay,
    creepEnabled: style === "creep" || highBand,
    pulseEnabled: style === "pulse" || level >= 11,
    advanceEnabled: style === "advance" || level >= 10,
    snakeEnabled: style === "snake" || (level >= 11 && level % 2 === 0),
  };
}

/** Whether bunkers should rebuild at the start of this level. */
export function shouldRebuildBunkers(level: number): { rebuild: boolean; reason: string } {
  if (level <= 1) return { rebuild: false, reason: "" };

  const prevEnc = getEncounterType(level - 1);
  if (
    MOVEMENT_TUNING.bunkerRespawnOnMiniBossClear &&
    prevEnc === "miniBoss"
  ) {
    return { rebuild: true, reason: "Fortified bunkers restored" };
  }

  if (level >= 3 && (level - 1) % MOVEMENT_TUNING.bunkerRespawnEvery === 0) {
    return { rebuild: true, reason: "Bunkers rebuilt" };
  }

  return { rebuild: false, reason: "" };
}

export function bunkerDurabilityForLevel(level: number): number {
  const cycles = Math.floor((level - 1) / MOVEMENT_TUNING.bunkerRespawnEvery);
  return Math.max(
    MOVEMENT_TUNING.bunkerMinDurability,
    1 - cycles * MOVEMENT_TUNING.bunkerDegradePerCycle
  );
}

const CAMPAIGN_LEVELS: StoredLevelConfig[] = [
  {
    level: 1,
    sector: 1,
    codename: "FIRST CONTACT",
    identity: "Light patrol grid — learn march rhythm and shield discipline.",
    formation: "classic",
    formationFlavor: "Classic Block",
    speedMult: 0.68,
    fireMult: 0.55,
    rows: 4,
    cols: 9,
    encounter: "standard",
    threat: "Low",
  },
  {
    level: 2,
    sector: 1,
    codename: "STAGGERED WAVE",
    identity: "Offset rows teach you to read bottom-shooter priority.",
    formation: "staggered",
    formationFlavor: "Staggered Rows",
    speedMult: 0.82,
    fireMult: 0.72,
    rows: 5,
    cols: 11,
    encounter: "standard",
    threat: "Low",
  },
  {
    level: 3,
    sector: 1,
    codename: "IRON GATE",
    identity: `Mini boss: ${MINI_BOSSES.bulwark.name} — ${MINI_BOSSES.bulwark.title}.`,
    formation: "classic",
    formationFlavor: "Boss Arena",
    speedMult: 0.95,
    fireMult: 0.88,
    rows: 5,
    cols: 11,
    encounter: "miniBoss",
    threat: "Medium",
  },
  {
    level: 4,
    sector: 2,
    codename: "DIAMOND GRID",
    identity: "Diamond formation — center mass advances first. Blitz challenge sector.",
    formation: "diamond",
    formationFlavor: "Diamond Siege",
    speedMult: 1.0,
    fireMult: 0.95,
    rows: 6,
    cols: 11,
    encounter: "standard",
    threat: "Medium",
  },
  {
    level: 5,
    sector: 2,
    codename: "PINCER SPREAD",
    identity: "Pincer wings squeeze the lane — protect center shields.",
    formation: "pincer",
    formationFlavor: "Pincer Assault",
    speedMult: 1.08,
    fireMult: 1.05,
    rows: 6,
    cols: 12,
    encounter: "standard",
    threat: "Medium",
  },
  {
    level: 6,
    sector: 2,
    codename: "SECTOR GATE",
    identity: `Big boss: ${BIG_BOSSES.hiveSentinel.name} — ${BIG_BOSSES.hiveSentinel.title}.`,
    formation: "diamond",
    formationFlavor: "Boss Arena",
    speedMult: 1.12,
    fireMult: 1.1,
    rows: 6,
    cols: 12,
    encounter: "bigBoss",
    threat: "High",
  },
  {
    level: 7,
    sector: 3,
    codename: "LUCKY SEVEN",
    identity: "Reinforced classic grid at campaign mid-pace. Token bonuses reward clean clears.",
    formation: "classic",
    formationFlavor: "Reinforced Classic",
    speedMult: 1.16,
    fireMult: 1.12,
    rows: 6,
    cols: 12,
    encounter: "standard",
    threat: "High",
  },
  {
    level: 8,
    sector: 3,
    codename: "STAGGERED ASSAULT",
    identity: "Fire rate climbs — staggered rows overlap firing lanes.",
    formation: "staggered",
    formationFlavor: "Heavy Stagger",
    speedMult: 1.22,
    fireMult: 1.18,
    rows: 6,
    cols: 12,
    encounter: "standard",
    threat: "High",
  },
  {
    level: 9,
    sector: 3,
    codename: "BROOD NEST",
    identity: `Mini boss: ${MINI_BOSSES.swarmQueen.name} — ${MINI_BOSSES.swarmQueen.title}.`,
    formation: "staggered",
    formationFlavor: "Boss Arena",
    speedMult: 1.26,
    fireMult: 1.2,
    rows: 6,
    cols: 12,
    encounter: "miniBoss",
    threat: "High",
  },
  {
    level: 10,
    sector: 4,
    codename: "DIAMOND SIEGE",
    identity: "Full diamond at peak march speed — every column matters.",
    formation: "diamond",
    formationFlavor: "Peak Diamond",
    speedMult: 1.32,
    fireMult: 1.24,
    rows: 6,
    cols: 12,
    encounter: "standard",
    threat: "Extreme",
  },
  {
    level: 11,
    sector: 4,
    codename: "PINCER FINALE",
    identity: "Last standard wave before the mothership. Maximum pincer pressure.",
    formation: "pincer",
    formationFlavor: "Final Pincer",
    speedMult: 1.38,
    fireMult: 1.28,
    rows: 6,
    cols: 12,
    encounter: "standard",
    threat: "Extreme",
  },
  {
    level: 12,
    sector: 4,
    codename: "MOTHERSHIP",
    identity: `Big boss: ${BIG_BOSSES.overmind.name} — ${BIG_BOSSES.overmind.title}. Campaign finale.`,
    formation: "pincer",
    formationFlavor: "Boss Arena",
    speedMult: 1.42,
    fireMult: 1.32,
    rows: 6,
    cols: 12,
    encounter: "bigBoss",
    threat: "Extreme",
  },
];

function scaleEndlessLevel(level: number): StoredLevelConfig {
  const template = CAMPAIGN_LEVELS[(level - 1) % CAMPAIGN_LEVELS.length]!;
  const cycles = Math.floor((level - 1) / CAMPAIGN_LEVELS.length);
  const enc = getEncounterType(level);
  const cycleBoost = cycles * 0.07;
  let identity = template.identity;
  let codename = `${template.codename} +${cycles + 1}`;

  if (enc === "miniBoss") {
    const mini = MINI_BOSSES[getMiniBossArchetype(level)];
    identity = `Mini boss: ${mini.name} — ${mini.title}. Endless cycle ${cycles + 1}.`;
    codename = mini.name.toUpperCase();
  } else if (enc === "bigBoss") {
    const big = BIG_BOSSES[getBigBossArchetype(level)];
    identity = `Big boss: ${big.name} — ${big.title}. Endless cycle ${cycles + 1}.`;
    codename = big.name.toUpperCase();
  } else {
    identity = `${template.identity} Endless escalation cycle ${cycles + 1}.`;
  }

  return {
    ...template,
    level,
    sector: Math.ceil(level / 3),
    codename,
    identity,
    speedMult: template.speedMult + cycleBoost,
    fireMult: template.fireMult + cycleBoost * 0.65,
    rows: Math.min(7, template.rows + Math.floor(cycles / 2)),
    cols: Math.min(13, template.cols + Math.floor(cycles / 3)),
    encounter: enc,
    threat: cycles >= 2 ? "Extreme" : cycles >= 1 ? "High" : template.threat,
  };
}

function enrichLevelConfig(cfg: StoredLevelConfig): LevelConfig {
  const mov = movementForLevel(cfg.level);
  return { ...cfg, movementStyle: mov.style, movementLabel: mov.label };
}

export function getLevelConfig(level: number): LevelConfig {
  if (level <= CAMPAIGN_MAX_LEVEL) {
    return enrichLevelConfig(CAMPAIGN_LEVELS[level - 1]!);
  }
  return enrichLevelConfig(scaleEndlessLevel(level));
}

export function getLevelBanner(level: number): string {
  const cfg = getLevelConfig(level);
  if (cfg.encounter === "bigBoss") {
    const big = BIG_BOSSES[getBigBossArchetype(level)];
    return `BIG BOSS — ${big.name.toUpperCase()} · L${level}`;
  }
  if (cfg.encounter === "miniBoss") {
    const mini = MINI_BOSSES[getMiniBossArchetype(level)];
    return `MINI BOSS — ${mini.name.toUpperCase()} · L${level}`;
  }
  return `LEVEL ${level} — ${cfg.codename}`;
}
