export type RunConsumableId = "shield_patch" | "overdrive" | "token_boost" | "challenge_reroll";

export interface RunConsumable {
  id: RunConsumableId;
  name: string;
  description: string;
  cost: number;
  /** Max purchases per level interstitial (default 1). */
  maxPerInterstitial?: number;
}

export const RUN_CONSUMABLES: RunConsumable[] = [
  {
    id: "shield_patch",
    name: "Shield Patch",
    description: "Repair all shields before the next wave",
    cost: 12,
  },
  {
    id: "overdrive",
    name: "Overdrive",
    description: "Rapid pulse for 8s at level start",
    cost: 18,
  },
  {
    id: "token_boost",
    name: "Token Boost",
    description: "+3 bonus tokens on next level clear",
    cost: 10,
  },
  {
    id: "challenge_reroll",
    name: "Challenge Reroll",
    description: "Retry one failed challenge for half bonus",
    cost: 15,
    maxPerInterstitial: 1,
  },
];

export function getRunConsumable(id: RunConsumableId): RunConsumable {
  return RUN_CONSUMABLES.find((c) => c.id === id)!;
}
