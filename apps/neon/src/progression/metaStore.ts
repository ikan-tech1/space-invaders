import type { PowerUpType } from "../config";
import { migrateLegacyCyanTrail, type AccessReward } from "./hangarCodes";

export type NeonModule = "overcharger" | "stabilizer" | "salvager";
export type HangarUpgrade = "xpBoost" | "aegisStart" | "chronoPlus";

export interface NeonMeta {
  stars: number;
  endlessUnlocked: boolean;
  campaignCleared: boolean;
  modules: NeonModule[];
  activeModules: NeonModule[];
  hangarUpgrades: HangarUpgrade[];
  badges: string[];
  unlockedPickups: string[];
  clearedSectors: number[];
  /** Redeemed hangar access key ids (see hangarCodes.ts). */
  redeemedAccessKeys: string[];
  /** Cosmetic projectile trail styles unlocked via access keys. */
  unlockedTrails: AccessReward[];
  /** True after the player opens the Briefing screen at least once. */
  briefingVisited?: boolean;
  /** Death slot: +1 life applied on next fresh deploy. */
  pendingBonusLife?: boolean;
  /** Death slot: starting power-up applied at next run start. */
  pendingStartPowerup?: PowerUpType | null;
}

const KEY = "neon_meta";

const DEFAULT: NeonMeta = {
  stars: 0,
  endlessUnlocked: false,
  campaignCleared: false,
  modules: [],
  activeModules: [],
  hangarUpgrades: [],
  badges: [],
  unlockedPickups: [],
  clearedSectors: [],
  redeemedAccessKeys: [],
  unlockedTrails: [],
};

export function loadNeonMeta(): NeonMeta {
  try {
    const r = localStorage.getItem(KEY);
    if (!r) return { ...DEFAULT };
    const parsed = JSON.parse(r) as Partial<NeonMeta>;
    const unlockedTrails = migrateLegacyCyanTrail(parsed.unlockedTrails ?? []);
    return {
      ...DEFAULT,
      ...parsed,
      unlockedPickups: parsed.unlockedPickups ?? [],
      clearedSectors: parsed.clearedSectors ?? [],
      redeemedAccessKeys: parsed.redeemedAccessKeys ?? [],
      unlockedTrails,
      briefingVisited: parsed.briefingVisited ?? false,
      pendingBonusLife: parsed.pendingBonusLife ?? false,
      pendingStartPowerup: parsed.pendingStartPowerup ?? null,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveNeonMeta(m: NeonMeta): void {
  localStorage.setItem(KEY, JSON.stringify(m));
}

export const MODULE_UNLOCK: Record<NeonModule, string> = {
  overcharger: "tier3_by_l5",
  stabilizer: "boss_no_overheat",
  salvager: "chrono_master",
};
