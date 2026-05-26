import type { EndlessConsumableId } from "./endlessShop";

export interface EndlessTier {
  id: string;
  name: string;
  minDepth: number;
  badge: string;
  /** Endless depot items unlocked at this tier (by id). */
  unlocks?: EndlessConsumableId[];
}

/** Rank ladder — depth = highest level reached in an endless run (persisted best). */
export const ENDLESS_TIERS: EndlessTier[] = [
  { id: "scout", name: "Scout", minDepth: 1, badge: "Relay pilot" },
  {
    id: "veteran",
    name: "Veteran",
    minDepth: 5,
    badge: "Sector hold",
    unlocks: ["depth_cache"],
  },
  {
    id: "ace",
    name: "Ace",
    minDepth: 10,
    badge: "Deep relay",
    unlocks: ["prestige_spark"],
  },
  { id: "elite", name: "Elite", minDepth: 15, badge: "Hive breaker" },
  { id: "legend", name: "Legend", minDepth: 20, badge: "Endless myth" },
  { id: "mythic", name: "Mythic", minDepth: 25, badge: "Relay sovereign" },
];

export const DEPTH_REWARD_INTERVAL = 5;
export const DEPTH_REWARD_TOKENS = 10;

export interface MultMilestone {
  id: string;
  threshold: number;
  label: string;
}

export const MULT_MILESTONES: MultMilestone[] = [
  { id: "mult_13", threshold: 1.3, label: "×1.3 token payout" },
  { id: "mult_16", threshold: 1.6, label: "×1.6 token payout" },
  { id: "mult_19", threshold: 1.9, label: "×1.9 token payout" },
  { id: "mult_22", threshold: 2.2, label: "×2.2 max payout" },
];

export function getEndlessTier(depth: number): EndlessTier {
  let tier = ENDLESS_TIERS[0]!;
  for (const t of ENDLESS_TIERS) {
    if (depth >= t.minDepth) tier = t;
  }
  return tier;
}

export function getNextEndlessTier(depth: number): EndlessTier | null {
  return ENDLESS_TIERS.find((t) => t.minDepth > depth) ?? null;
}

export function isEndlessItemUnlocked(itemId: EndlessConsumableId, bestDepth: number): boolean {
  const tier = tierForEndlessItem(itemId);
  if (!tier) return true;
  return bestDepth >= tier.minDepth;
}

export function tierForEndlessItem(itemId: EndlessConsumableId): EndlessTier | null {
  for (const tier of ENDLESS_TIERS) {
    if (tier.unlocks?.includes(itemId)) return tier;
  }
  return null;
}

export interface EndlessMilestoneEvent {
  id: string;
  toast: string;
  achievement?: boolean;
  tokenBonus?: number;
}

/** New milestones earned when clearing `level` in endless (compare against prior best). */
export function collectEndlessMilestones(
  level: number,
  priorBestDepth: number,
  mult: number,
  claimed: Set<string>
): EndlessMilestoneEvent[] {
  const events: EndlessMilestoneEvent[] = [];
  const add = (id: string, toast: string, opts?: { achievement?: boolean; tokenBonus?: number }) => {
    if (claimed.has(id)) return;
    events.push({ id, toast, achievement: opts?.achievement ?? true, tokenBonus: opts?.tokenBonus });
  };

  if (level > priorBestDepth) {
    for (const tier of ENDLESS_TIERS) {
      if (level >= tier.minDepth && priorBestDepth < tier.minDepth) {
        add(`tier_${tier.id}`, `Endless rank — ${tier.name}! ${tier.badge}`, { achievement: true });
      }
    }
  }

  if (level % DEPTH_REWARD_INTERVAL === 0) {
    events.push({
      id: `depth_run_${level}`,
      toast: `Depth ${level} — prestige +${DEPTH_REWARD_TOKENS} ◎`,
      tokenBonus: DEPTH_REWARD_TOKENS,
      achievement: false,
    });
  }

  for (const m of MULT_MILESTONES) {
    if (mult + 0.001 >= m.threshold) {
      add(m.id, `Multiplier milestone — ${m.label}`, { achievement: true });
    }
  }

  return events;
}
