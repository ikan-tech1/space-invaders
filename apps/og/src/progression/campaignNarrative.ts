import { getEncounterType } from "./levelScript";

export interface CampaignBeat {
  level: number;
  headline: string;
  body: string;
  tag: string;
}

const BOSS_BEATS: Record<number, Omit<CampaignBeat, "level">> = {
  3: {
    headline: "Scout Vessel Destroyed",
    body: "Command confirms the first alien command ship is down. Their march patterns are no longer random — they're learning.",
    tag: "ACT I · MINI BOSS",
  },
  6: {
    headline: "Sector Gate Breached",
    body: "The big boss hull breaks apart over the grid. Endless relay unlocked — the invasion doesn't stop at Sector II.",
    tag: "ACT II · BIG BOSS",
  },
  9: {
    headline: "Reinforcements Cracking",
    body: "Another command node eliminated. Intel suggests the mothership is pulling every remaining wing into Sector IV.",
    tag: "ACT III · MINI BOSS",
  },
  12: {
    headline: "Mothership Falls",
    body: "The fleet scatters. Earth holds — for now. Endless sorties remain for operators who crave the high-score board.",
    tag: "FINALE · CAMPAIGN CLEAR",
  },
};

/** Narrative beat shown after clearing a boss milestone level. */
export function getCampaignBeat(level: number): CampaignBeat | null {
  const enc = getEncounterType(level);
  if (enc === "standard") return null;
  const base = BOSS_BEATS[level];
  if (!base) {
    return {
      level,
      headline: enc === "bigBoss" ? "Boss Destroyed" : "Command Node Down",
      body: "The lane is clear. Press onward before they regroup.",
      tag: enc === "bigBoss" ? "BIG BOSS" : "MINI BOSS",
    };
  }
  return { level, ...base };
}
