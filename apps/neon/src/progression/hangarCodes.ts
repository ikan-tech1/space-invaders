export type AccessReward = "cyanTrail" | "magentaTrail" | "ghostTrail";

export interface HangarCodeDef {
  id: string;
  code: string;
  reward: AccessReward;
  unlockLabel: string;
  /** Short player-facing hint when the sector gate is open. */
  clue: string;
  /** Plain hint shown before Briefing is opened (starter code only). */
  briefingClue?: string;
  /** Sector level whose codex entry hints at this code (0 = briefing / hangar). */
  hintSector?: number;
}

export const TRAIL_DISPLAY: Record<
  AccessReward,
  { label: string; shortLabel: string; icon: string; cssClass: string }
> = {
  cyanTrail: { label: "Cyan bolt trail", shortLabel: "Cyan Trail", icon: "▸", cssClass: "cyan" },
  magentaTrail: {
    label: "Magenta bolt trail",
    shortLabel: "Magenta Trail",
    icon: "▸",
    cssClass: "magenta",
  },
  ghostTrail: { label: "Ghost bolt trail", shortLabel: "Ghost Trail", icon: "▸", cssClass: "ghost" },
};

export const HANGAR_CODES: HangarCodeDef[] = [
  {
    id: "year2050",
    code: "NEON2050",
    reward: "cyanTrail",
    unlockLabel: "Cyan bolt trail unlocked",
    briefingClue: "Read Briefing for your first code hint",
    clue: "Tagline under the logo says 2050 — try NEON2050",
    hintSector: 0,
  },
  {
    id: "neon_rift",
    code: "NEONRIFT",
    reward: "magentaTrail",
    unlockLabel: "Magenta bolt trail unlocked",
    clue: "Sector 7 intel mentions where discharge paints the sky",
    hintSector: 7,
  },
  {
    id: "ghost_freq",
    code: "GHOSTFRQ",
    reward: "ghostTrail",
    unlockLabel: "Ghost bolt trail unlocked",
    clue: "Sector 8 intel names the silence between comm bursts",
    hintSector: 8,
  },
];

const CODE_BY_VALUE = new Map(HANGAR_CODES.map((c) => [c.code, c]));

export function normalizeHangarInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function isValidCodePrefix(value: string): boolean {
  if (!value) return true;
  return HANGAR_CODES.some((c) => c.code.startsWith(value));
}

export function lookupHangarCode(value: string): HangarCodeDef | undefined {
  return CODE_BY_VALUE.get(value);
}

export function getActiveTrailReward(unlocked: AccessReward[]): AccessReward | null {
  if (unlocked.includes("ghostTrail")) return "ghostTrail";
  if (unlocked.includes("magentaTrail")) return "magentaTrail";
  if (unlocked.includes("cyanTrail")) return "cyanTrail";
  return null;
}

export function migrateLegacyCyanTrail(unlocked: AccessReward[]): AccessReward[] {
  if (unlocked.includes("cyanTrail")) return unlocked;
  try {
    if (localStorage.getItem("neon_cyan_trail") === "1") {
      return [...unlocked, "cyanTrail"];
    }
  } catch {
    /* ignore */
  }
  return unlocked;
}
