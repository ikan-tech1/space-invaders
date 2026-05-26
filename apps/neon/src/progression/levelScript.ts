import { getBossInboundText, getSectorBanner } from "../narrative/campaignScript";

export type EncounterType = "standard" | "miniBoss" | "bigBoss";

export interface LevelConfig {
  speedMult: number;
  fireMult: number;
  rows: number;
  cols: number;
  formation: import("../config").FormationType;
}

export const CAMPAIGN_MAX_LEVEL = 12;

export function getEncounterType(level: number): EncounterType {
  if (level % 6 === 0) return "bigBoss";
  if (level % 3 === 0) return "miniBoss";
  return "standard";
}

export function getLevelBanner(level: number): string {
  return getSectorBanner(level, getEncounterType(level));
}

export function getBossInboundFlash(level: number): string | null {
  return getBossInboundText(level);
}

export function getLevelConfig(level: number): LevelConfig {
  const formations: import("../config").FormationType[] = [
    "classic",
    "staggered",
    "diamond",
    "pincer",
  ];
  const f = formations[(level - 1) % formations.length]!;
  const band = Math.min(level, 12);
  const speedMult =
    level === 1 ? 0.7 : level === 2 ? 0.85 : level === 3 ? 0.95 : 1 + (band - 4) * 0.08;
  const fireMult =
    level === 1 ? 0.6 : level === 2 ? 0.75 : level === 3 ? 0.9 : 1 + (band - 4) * 0.05;
  const rows = level === 1 ? 4 : level === 2 ? 5 : level >= 4 ? 6 : 5;
  const cols = level === 1 ? 9 : level >= 5 ? 12 : 11;
  return { speedMult, fireMult, rows, cols, formation: f };
}
