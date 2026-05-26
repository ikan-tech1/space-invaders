import { getEncounterType, getLevelConfig } from "./levelScript";
import { BIG_BOSSES, MINI_BOSSES, getBigBossArchetype, getMiniBossArchetype } from "./bosses";

export interface SectorBriefing {
  level: number;
  sector: number;
  title: string;
  body: string;
  tip: string;
  threat: string;
  codename: string;
  bossName?: string;
}

function bossNameForLevel(level: number): string | undefined {
  const enc = getEncounterType(level);
  if (enc === "miniBoss") return MINI_BOSSES[getMiniBossArchetype(level)].name;
  if (enc === "bigBoss") return BIG_BOSSES[getBigBossArchetype(level)].name;
  return undefined;
}

const SECTOR_BRIEFINGS: Record<number, Omit<SectorBriefing, "level" | "sector" | "codename" | "bossName">> = {
  1: {
    title: "Sector I — First Contact",
    body: "Light alien patrol. Learn the march rhythm and shield discipline.",
    tip: "Hold SPACE to fire — solo shots exit early for faster refire.",
    threat: "Low",
  },
  2: {
    title: "Sector I — Staggered Wave",
    body: "Formation shifts to staggered rows. Bottom aliens fire first.",
    tip: "Chain kills within 2s for combo multipliers.",
    threat: "Low",
  },
  3: {
    title: "Sector I — The Bulwark",
    body: "The Bulwark blocks the lane with wide spread volleys. Watch telegraph flashes.",
    tip: "Aim for the glowing weak point — it shifts every few seconds.",
    threat: "Medium",
  },
  4: {
    title: "Sector II — Diamond Grid",
    body: "Diamond formation — flawless clear unlocks a secret bonus.",
    tip: "Clear Level 4 under 45s for the Blitz IV challenge.",
    threat: "Medium",
  },
  5: {
    title: "Sector II — Pincer Spread",
    body: "Pincer wings advance fast. Protect center shields.",
    tip: "Spend run pool at the supply depot between levels.",
    threat: "Medium",
  },
  6: {
    title: "Sector II — The Hive Sentinel",
    body: "First big boss. Phase II below half HP — cross-burst patterns intensify.",
    tip: "Endless mode unlocks after this sector.",
    threat: "High",
  },
  7: {
    title: "Sector III — Lucky Seven",
    body: "Reinforced classic grid. Bonus tokens await a clean clear.",
    tip: "Type ARC on the title screen for V-formation synergy.",
    threat: "High",
  },
  8: {
    title: "Sector III — Staggered Assault",
    body: "Enemy fire rate climbs. Use overdrive from the supply depot.",
    tip: "Magnet Burst doubles run-token earnings for one level.",
    threat: "High",
  },
  9: {
    title: "Sector III — The Swarm Queen",
    body: "The Swarm Queen spawns drone escorts while firing aimed bursts.",
    tip: "Life Buffer absorbs one hit — great before boss sectors.",
    threat: "High",
  },
  10: {
    title: "Sector IV — Diamond Siege",
    body: "Full diamond formation at peak speed.",
    tip: "Combo Charge starts the next level at 3× multiplier.",
    threat: "Extreme",
  },
  11: {
    title: "Sector IV — Pincer Finale",
    body: "Last standard wave before the mothership.",
    tip: "Review armory loadout — scatter and homing excel here.",
    threat: "Extreme",
  },
  12: {
    title: "Sector IV — The Overmind",
    body: "The Overmind mothership. Survive Phase II homing volleys and claim victory.",
    tip: "Three stars for a boss clear. Lucky Reels only on your last life.",
    threat: "Extreme",
  },
};

export function getSectorBriefing(level: number): SectorBriefing {
  const cfg = getLevelConfig(level);
  const enc = getEncounterType(level);
  const bossName = bossNameForLevel(level);
  const base = SECTOR_BRIEFINGS[level] ?? {
    title: `Sector ${cfg.sector} — ${cfg.codename}`,
    body: cfg.identity,
    tip: "Clear waves to earn run tokens for the supply depot.",
    threat: cfg.threat,
  };

  let body = base.body;
  if (level > 12) {
    body = cfg.identity;
  } else if (enc === "miniBoss" && level !== 3 && level !== 9) {
    body = `${bossName ?? "Mini boss"} encounter. Telegraph flashes warn before volleys.`;
  } else if (enc === "bigBoss" && level !== 6 && level !== 12) {
    body = `${bossName ?? "Big boss"} encounter. Phase II below 50% HP.`;
  }

  return {
    level,
    sector: cfg.sector,
    codename: cfg.codename,
    bossName,
    ...base,
    body,
    threat: cfg.threat,
  };
}
