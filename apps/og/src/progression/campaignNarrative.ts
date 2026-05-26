import { getEncounterType } from "./levelScript";
import { BIG_BOSSES, MINI_BOSSES, getBigBossArchetype, getMiniBossArchetype } from "./bosses";

export interface CampaignBeat {
  level: number;
  headline: string;
  body: string;
  tag: string;
}

function bossBeat(level: number): Omit<CampaignBeat, "level"> | null {
  const enc = getEncounterType(level);
  if (enc === "miniBoss") {
    const b = MINI_BOSSES[getMiniBossArchetype(level)];
    return {
      headline: `${b.name} Destroyed`,
      body: `${b.personality} Command confirms the node is down — their march patterns adapt.`,
      tag: `MINI BOSS · ${b.title.toUpperCase()}`,
    };
  }
  if (enc === "bigBoss") {
    const b = BIG_BOSSES[getBigBossArchetype(level)];
    const extra =
      level === 6
        ? " Endless relay unlocked — the invasion doesn't stop at Sector II."
        : level === 12
          ? " Earth holds — for now. Endless sorties remain for high-score hunters."
          : "";
    return {
      headline: `${b.name} Falls`,
      body: `${b.personality}${extra}`,
      tag: level === 12 ? "FINALE · CAMPAIGN CLEAR" : `BIG BOSS · ${b.title.toUpperCase()}`,
    };
  }
  return null;
}

const LEGACY_BEATS: Record<number, Omit<CampaignBeat, "level">> = {
  3: {
    headline: "The Bulwark Falls",
    body: "Command confirms the first alien command ship is down. Their march patterns are no longer random — they're learning.",
    tag: "ACT I · MINI BOSS",
  },
  6: {
    headline: "Sector Gate Breached",
    body: "The Hive Sentinel breaks apart over the grid. Endless relay unlocked — the invasion doesn't stop at Sector II.",
    tag: "ACT II · BIG BOSS",
  },
  9: {
    headline: "Swarm Queen Silenced",
    body: "Another command node eliminated. Intel suggests the mothership is pulling every remaining wing into Sector IV.",
    tag: "ACT III · MINI BOSS",
  },
  12: {
    headline: "The Overmind Falls",
    body: "The fleet scatters. Earth holds — for now. Endless sorties remain for operators who crave the high-score board.",
    tag: "FINALE · CAMPAIGN CLEAR",
  },
};

/** Narrative beat shown after clearing a boss milestone level. */
export function getCampaignBeat(level: number): CampaignBeat | null {
  const enc = getEncounterType(level);
  if (enc === "standard") return null;
  const legacy = LEGACY_BEATS[level];
  if (legacy) return { level, ...legacy };
  const dynamic = bossBeat(level);
  if (dynamic) return { level, ...dynamic };
  return {
    level,
    headline: enc === "bigBoss" ? "Boss Destroyed" : "Command Node Down",
    body: "The lane is clear. Press onward before they regroup.",
    tag: enc === "bigBoss" ? "BIG BOSS" : "MINI BOSS",
  };
}
