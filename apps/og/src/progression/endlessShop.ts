import { tierForEndlessItem } from "./endlessProgression";

export type EndlessConsumableId =
  | "mult_boost"
  | "iron_shield"
  | "score_surge"
  | "alien_slow"
  | "depth_cache"
  | "prestige_spark";

export interface EndlessConsumable {
  id: EndlessConsumableId;
  name: string;
  description: string;
  cost: number;
  maxPerInterstitial?: number;
  /** Shown when locked — requires endless best depth from tier unlock. */
  tierLabel?: string;
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
  {
    id: "depth_cache",
    name: "Depth Cache",
    description: "+12 ◎ injected into run pool now",
    cost: 22,
    maxPerInterstitial: 1,
    tierLabel: "Veteran L5",
  },
  {
    id: "prestige_spark",
    name: "Prestige Spark",
    description: "+0.25 mult next level (stacks with Mult Boost)",
    cost: 32,
    maxPerInterstitial: 1,
    tierLabel: "Ace L10",
  },
];

export function getEndlessConsumable(id: EndlessConsumableId): EndlessConsumable {
  return ENDLESS_CONSUMABLES.find((c) => c.id === id)!;
}

export function getEndlessConsumableTierLabel(id: EndlessConsumableId): string | undefined {
  const item = ENDLESS_CONSUMABLES.find((c) => c.id === id);
  if (item?.tierLabel) return item.tierLabel;
  const tier = tierForEndlessItem(id);
  return tier ? `${tier.name} L${tier.minDepth}` : undefined;
}
