import { getEncounterType } from "./levelScript";

export interface SectorBriefing {
  level: number;
  sector: number;
  title: string;
  body: string;
  tip: string;
  threat: string;
}

const SECTOR_BRIEFINGS: Record<number, Omit<SectorBriefing, "level" | "sector">> = {
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
    title: "Sector I — Mini Boss",
    body: "A mini boss blocks the lane. Watch for telegraphed volleys.",
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
    title: "Sector II — Big Boss",
    body: "First big boss. Phase II triggers below half HP — expect burst fire.",
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
    title: "Sector III — Mini Boss Redux",
    body: "Return of the mini boss with tighter patterns.",
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
    body: "Last standard wave before the final boss.",
    tip: "Review armory loadout — scatter and homing excel here.",
    threat: "Extreme",
  },
  12: {
    title: "Sector IV — Final Boss",
    body: "The mothership. Survive Phase II and claim campaign victory.",
    tip: "Three stars for a boss clear. Lucky Reels only on your last life.",
    threat: "Extreme",
  },
};

export function getSectorBriefing(level: number): SectorBriefing {
  const enc = getEncounterType(level);
  const base = SECTOR_BRIEFINGS[level] ?? {
    title: `Sector — Level ${level}`,
    body: "Unknown sector. Stay sharp.",
    tip: "Clear waves to earn run tokens for the supply depot.",
    threat: "Unknown",
  };
  const sector = Math.ceil(level / 3);
  let body = base.body;
  if (enc === "miniBoss" && level !== 3 && level !== 9) {
    body = "Mini boss encounter. Telegraph flashes warn before volleys.";
  } else if (enc === "bigBoss") {
    body = "Big boss encounter. Phase II below 50% HP — burst patterns intensify.";
  }
  return { level, sector, ...base, body };
}
