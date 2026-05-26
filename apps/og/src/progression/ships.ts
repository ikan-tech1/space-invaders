export type ShipId = "striker" | "phantom" | "titan";

export interface ShipProfile {
  id: ShipId;
  name: string;
  tagline: string;
  color: string;
  accent: string;
  /** Pixel sprite key in SpriteDrawer. */
  spriteKey: string;
  speedMult: number;
  fireCooldownMult: number;
  hitboxScale: number;
  tokenCost: number;
}

export const SHIP_PROFILES: Record<ShipId, ShipProfile> = {
  striker: {
    id: "striker",
    name: "Striker",
    tagline: "Balanced interceptor",
    color: "#00f0ff",
    accent: "#7bff6e",
    spriteKey: "player",
    speedMult: 1,
    fireCooldownMult: 1,
    hitboxScale: 1,
    tokenCost: 0,
  },
  phantom: {
    id: "phantom",
    name: "Phantom",
    tagline: "Fast & nimble",
    color: "#ff2d95",
    accent: "#c77dff",
    spriteKey: "playerPhantom",
    speedMult: 1.22,
    fireCooldownMult: 0.88,
    hitboxScale: 0.88,
    tokenCost: 120,
  },
  titan: {
    id: "titan",
    name: "Titan",
    tagline: "Heavy hull · punchy shots",
    color: "#ffd24a",
    accent: "#ff8844",
    spriteKey: "playerTitan",
    speedMult: 0.82,
    fireCooldownMult: 1.08,
    hitboxScale: 1.12,
    tokenCost: 200,
  },
};

export function getShipProfile(id: ShipId): ShipProfile {
  return SHIP_PROFILES[id];
}
