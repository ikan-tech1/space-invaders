export type RunConsumableId =
  | "shield_patch"
  | "overdrive"
  | "token_boost"
  | "challenge_reroll"
  | "combo_charge"
  | "life_buffer"
  | "magnet_burst";

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
  {
    id: "combo_charge",
    name: "Combo Charge",
    description: "Start next level at 3× combo multiplier",
    cost: 14,
  },
  {
    id: "life_buffer",
    name: "Life Buffer",
    description: "Next hit costs no life (one use)",
    cost: 22,
    maxPerInterstitial: 1,
  },
  {
    id: "magnet_burst",
    name: "Magnet Burst",
    description: "+2 run tokens per kill for one level",
    cost: 16,
  },
];

export function getRunConsumable(id: RunConsumableId): RunConsumable {
  return RUN_CONSUMABLES.find((c) => c.id === id)!;
}
