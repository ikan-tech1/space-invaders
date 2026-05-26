import type { ShipId } from "./ships";

export type CosmeticColorId =
  | "cyan"
  | "gold"
  | "magenta"
  | "green"
  | "orange"
  | "white"
  | "red"
  | "violet";

export type CockpitTintId = CosmeticColorId | "none";

export interface ShipCosmetics {
  hullId: ShipId;
  primary: CosmeticColorId;
  accent: CosmeticColorId;
  cockpitTint: CockpitTintId;
  /** Up to 12 characters, uppercased in storage. */
  callsign: string;
}

export const COLOR_STAR_COST = 15;

export const COLOR_PALETTE: Record<CosmeticColorId, string> = {
  cyan: "#00f0ff",
  gold: "#ffd24a",
  magenta: "#ff2d95",
  green: "#7bff6e",
  orange: "#ff8844",
  white: "#e8f4ff",
  red: "#ff4466",
  violet: "#c77dff",
};

export const COSMETIC_COLOR_LABELS: Record<CosmeticColorId, string> = {
  cyan: "Neon Cyan",
  gold: "Solar Gold",
  magenta: "Hot Magenta",
  green: "Ion Green",
  orange: "Afterburner",
  white: "Arctic White",
  red: "Alert Red",
  violet: "Void Violet",
};

export const DEFAULT_UNLOCKED_COLORS: CosmeticColorId[] = ["cyan"];

export function normalizeCallsign(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9\-_. ]/g, "").trim().slice(0, 12).toUpperCase();
}

export function defaultCosmeticsForHull(hullId: ShipId): ShipCosmetics {
  return {
    hullId,
    primary: "cyan",
    accent: "gold",
    cockpitTint: "none",
    callsign: "",
  };
}

export function getCosmeticsForHull(
  store: Record<string, ShipCosmetics> | undefined,
  hullId: ShipId
): ShipCosmetics {
  const saved = store?.[hullId];
  if (!saved) return defaultCosmeticsForHull(hullId);
  return {
    hullId,
    primary: saved.primary ?? "cyan",
    accent: saved.accent ?? "gold",
    cockpitTint: saved.cockpitTint ?? "none",
    callsign: normalizeCallsign(saved.callsign ?? ""),
  };
}

export function resolveShipPaint(
  cosmetics: ShipCosmetics,
  hullDefaultPrimary: string,
  hullDefaultAccent: string
): { primary: string; accent: string; cockpit: string | null } {
  const primary = COLOR_PALETTE[cosmetics.primary] ?? hullDefaultPrimary;
  const accent = COLOR_PALETTE[cosmetics.accent] ?? hullDefaultAccent;
  const cockpit =
    cosmetics.cockpitTint !== "none"
      ? COLOR_PALETTE[cosmetics.cockpitTint as CosmeticColorId]
      : null;
  return { primary, accent, cockpit };
}
