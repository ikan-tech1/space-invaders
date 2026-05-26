export type OgMetaUpgrade = "extraLife" | "fastShot" | "shieldRepair";

export interface OgMeta {
  stars: number;
  endlessUnlocked: boolean;
  campaignCleared: boolean;
  upgrades: OgMetaUpgrade[];
  unlockedPickups: string[];
  badges: string[];
}

const KEY = "og_meta";

const DEFAULT: OgMeta = {
  stars: 0,
  endlessUnlocked: false,
  campaignCleared: false,
  upgrades: [],
  unlockedPickups: ["rapid", "spread", "shield", "slow"],
  badges: [],
};

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
  return m;
}

export function saveOgMeta(m: OgMeta): void {
  localStorage.setItem(KEY, JSON.stringify(m));
}

export const UPGRADE_COSTS: Record<OgMetaUpgrade, number> = {
  extraLife: 5,
  fastShot: 4,
  shieldRepair: 3,
};
