export type EndlessConsumableId =
  | "mult_boost"
  | "iron_shield"
  | "score_surge"
  | "alien_slow";

export interface EndlessConsumable {
  id: EndlessConsumableId;
  name: string;
  description: string;
  cost: number;
  maxPerInterstitial?: number;
}

/** Endless-only run modifiers — purchased from run pool at interstitials. */
export const ENDLESS_CONSUMABLES: EndlessConsumable[] = [
  {
    id: "mult_boost",
    name: "Mult Boost",
    description: "+0.15 endless token multiplier next level",
    cost: 24,
    maxPerInterstitial: 1,
  },
  {
    id: "iron_shield",
    name: "Iron Shield",
    description: "Add a bonus shield bunker at level start",
    cost: 20,
  },
  {
    id: "score_surge",
    name: "Score Surge",
    description: "+25% score from kills next level",
    cost: 18,
  },
  {
    id: "alien_slow",
    name: "Alien Slow",
    description: "Aliens march 20% slower for one level",
    cost: 16,
  },
];

export function getEndlessConsumable(id: EndlessConsumableId): EndlessConsumable {
  return ENDLESS_CONSUMABLES.find((c) => c.id === id)!;
}
