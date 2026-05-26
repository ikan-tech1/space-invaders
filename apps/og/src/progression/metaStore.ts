import type { ArmoryGunId } from "./armoryGuns";
import { CAMPAIGN_MAX_LEVEL } from "./levelScript";
import type { ShipId } from "./ships";

export type OgMetaUpgrade =
  | "extraLife"
  | "fastShot"
  | "shieldRepair"
  | "tokenMagnet"
  | "comboExtend"
  | "luckySlot";

export interface ChallengeSeenState {
  badges: string[];
  weeklyClaimed: string[];
  dailyDate: string;
  dailyDone: boolean;
}

export interface OgMeta {
  stars: number;
  tokens: number;
  /** Highest campaign level cleared (1–12). */
  campaignBestLevel: number;
  /** Per-level star rating (1–3) keyed by level number. */
  campaignStars: Record<string, number>;
  endlessUnlocked: boolean;
  campaignCleared: boolean;
  upgrades: OgMetaUpgrade[];
  unlockedPickups: string[];
  badges: string[];
  /** Best endless depth (level reached) across all runs. */
  endlessBestDepth: number;
  /** Claimed endless milestone ids (tiers, depth rewards, mult thresholds). */
  endlessMilestones: string[];
  equippedShip: ShipId;
  equippedGun: ArmoryGunId;
  unlockedShips: ShipId[];
  unlockedGuns: ArmoryGunId[];
  /** Lifetime tokens spent in Armory (ships, guns, upgrades). */
  totalTokensSpent: number;
  /** ISO week key for weekly challenge reset (e.g. 2026-W21). */
  weeklyWeekKey: string;
  /** Progress counters for active weekly challenges. */
  weeklyProgress: Record<string, number>;
  /** Weekly challenge ids claimed this week. */
  weeklyClaimed: string[];
  /** Snapshot when user last opened Daily/Challenges screens. */
  lastSeenChallengeState?: ChallengeSeenState;
  /** Consecutive daily ops completion streak. */
  dailyStreak: number;
}

const KEY = "og_meta";

const DEFAULT: OgMeta = {
  stars: 0,
  tokens: 0,
  campaignBestLevel: 0,
  campaignStars: {},
  endlessUnlocked: false,
  campaignCleared: false,
  upgrades: [],
  unlockedPickups: ["rapid", "spread", "shield", "slow"],
  badges: [],
  endlessBestDepth: 0,
  endlessMilestones: [],
  equippedShip: "striker",
  equippedGun: "single",
  unlockedShips: ["striker"],
  unlockedGuns: ["single"],
  totalTokensSpent: 0,
  weeklyWeekKey: getWeeklyWeekKey(),
  weeklyProgress: {},
  weeklyClaimed: [],
  dailyStreak: 0,
};

export function getWeeklyWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function ensureWeeklyFresh(meta: OgMeta): OgMeta {
  const key = getWeeklyWeekKey();
  if (meta.weeklyWeekKey === key) return meta;
  meta.weeklyWeekKey = key;
  meta.weeklyProgress = {};
  meta.weeklyClaimed = [];
  return meta;
}

export function loadOgMeta(): OgMeta {
  try {
    const r = localStorage.getItem(KEY);
    const meta: OgMeta = r ? { ...DEFAULT, ...JSON.parse(r) } : { ...DEFAULT };
    return migrateMeta(meta);
  } catch {
    return { ...DEFAULT };
  }
}

/** Migrate legacy save keys (e.g. laser → plasma). */
function migrateMeta(m: OgMeta): OgMeta {
  if (m.unlockedPickups.includes("laser")) {
    m.unlockedPickups = m.unlockedPickups
      .filter((p) => p !== "laser")
      .concat(m.unlockedPickups.includes("plasma") ? [] : ["plasma"]);
  }
  if (!m.tokens && typeof (m as OgMeta & { coins?: number }).coins === "number") {
    m.tokens = (m as OgMeta & { coins?: number }).coins ?? 0;
  }
  if (!m.equippedShip) m.equippedShip = "striker";
  if (!m.equippedGun) m.equippedGun = "single";
  if (!m.unlockedShips?.length) m.unlockedShips = ["striker"];
  if (!m.unlockedGuns?.length) m.unlockedGuns = ["single"];
  if (!m.unlockedShips.includes(m.equippedShip)) {
    m.equippedShip = "striker";
  }
  if (!m.unlockedGuns.includes(m.equippedGun)) {
    m.equippedGun = "single";
  }
  if (typeof m.campaignBestLevel !== "number" || m.campaignBestLevel < 0) {
    m.campaignBestLevel = m.campaignCleared ? CAMPAIGN_MAX_LEVEL : 0;
  }
  if (!m.campaignStars) m.campaignStars = {};
  if (typeof m.endlessBestDepth !== "number" || m.endlessBestDepth < 0) {
    m.endlessBestDepth = 0;
  }
  if (!Array.isArray(m.endlessMilestones)) m.endlessMilestones = [];
  if (typeof m.totalTokensSpent !== "number") m.totalTokensSpent = 0;
  if (!m.weeklyWeekKey) m.weeklyWeekKey = getWeeklyWeekKey();
  if (!m.weeklyProgress) m.weeklyProgress = {};
  if (!Array.isArray(m.weeklyClaimed)) m.weeklyClaimed = [];
  if (typeof m.dailyStreak !== "number") m.dailyStreak = 0;
  return ensureWeeklyFresh(m);
}

export function saveOgMeta(m: OgMeta): void {
  localStorage.setItem(KEY, JSON.stringify(m));
}

/** Track Armory token spend for challenges and stats. */
export function recordTokenSpend(meta: OgMeta, amount: number): void {
  if (amount <= 0) return;
  meta.totalTokensSpent += amount;
  saveOgMeta(meta);
}

export const UPGRADE_COSTS: Record<OgMetaUpgrade, number> = {
  extraLife: 5,
  fastShot: 4,
  shieldRepair: 3,
  tokenMagnet: 6,
  comboExtend: 5,
  luckySlot: 7,
};

export const UPGRADE_LABELS: Record<OgMetaUpgrade, string> = {
  extraLife: "Extra life (+1 per run)",
  fastShot: "Faster first shot",
  shieldRepair: "Shield repair between levels",
  tokenMagnet: "+1 token per alien kill",
  comboExtend: "Combo window +0.5s",
  luckySlot: "Better slot machine odds",
};
