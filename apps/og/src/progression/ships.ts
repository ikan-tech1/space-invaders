export type ShipId = "striker" | "phantom" | "titan" | "vanguard";

export type ShipPassiveId = "steadySortie" | "ghostChain" | "siegeBreakers" | "escortBonus";

export interface ShipProfile {
  id: ShipId;
  name: string;
  tagline: string;
  flavor: string;
  color: string;
  accent: string;
  /** Pixel sprite key in SpriteDrawer. */
  spriteKey: string;
  speedMult: number;
  fireCooldownMult: number;
  hitboxScale: number;
  tokenCost: number;
  /** Passive ability identifier */
  passive: ShipPassiveId;
  passiveLabel: string;
  passiveDesc: string;
  /** Bonus tokens on level clear */
  levelClearTokenBonus: number;
}

export const SHIP_PROFILES: Record<ShipId, ShipProfile> = {
  striker: {
    id: "striker",
    name: "Striker",
    tagline: "Balanced interceptor",
    flavor: "Earth Defense Corps standard — reliable speed, cadence, and shield discipline.",
    color: "#00f0ff",
    accent: "#7bff6e",
    spriteKey: "player",
    speedMult: 1,
    fireCooldownMult: 1,
    hitboxScale: 1,
    tokenCost: 0,
    passive: "steadySortie",
    passiveLabel: "Steady Sortie",
    passiveDesc: "+2 ◎ on every level clear.",
    levelClearTokenBonus: 2,
  },
  phantom: {
    id: "phantom",
    name: "Phantom",
    tagline: "Fast & nimble",
    flavor: "Stealth wing prototype — smaller hitbox, faster weave, extended combo windows.",
    color: "#ff2d95",
    accent: "#c77dff",
    spriteKey: "playerPhantom",
    speedMult: 1.22,
    fireCooldownMult: 0.88,
    hitboxScale: 0.88,
    tokenCost: 120,
    passive: "ghostChain",
    passiveLabel: "Ghost Chain",
    passiveDesc: "+0.45s combo window — chain kills longer.",
    levelClearTokenBonus: 0,
  },
  titan: {
    id: "titan",
    name: "Titan",
    tagline: "Heavy hull · siege breaker",
    flavor: "Armored siege frame — slower but hits bosses harder with reinforced rounds.",
    color: "#ffd24a",
    accent: "#ff8844",
    spriteKey: "playerTitan",
    speedMult: 0.82,
    fireCooldownMult: 1.08,
    hitboxScale: 1.12,
    tokenCost: 200,
    passive: "siegeBreakers",
    passiveLabel: "Siege Breakers",
    passiveDesc: "+1 damage per shot vs bosses.",
    levelClearTokenBonus: 0,
  },
  vanguard: {
    id: "vanguard",
    name: "Vanguard",
    tagline: "Elite escort · token hauler",
    flavor: "Fleet escort variant — tight handling with boosted run-token earnings.",
    color: "#7bff6e",
    accent: "#00f0ff",
    spriteKey: "playerVanguard",
    speedMult: 1.08,
    fireCooldownMult: 0.95,
    hitboxScale: 0.95,
    tokenCost: 160,
    passive: "escortBonus",
    passiveLabel: "Escort Bonus",
    passiveDesc: "+15% run ◎ from kills and clears.",
    levelClearTokenBonus: 0,
  },
};

export function getShipProfile(id: ShipId): ShipProfile {
  return SHIP_PROFILES[id];
}

export function shipComboWindowBonus(id: ShipId): number {
  return id === "phantom" ? 0.45 : 0;
}

export function shipTokenEarningsMult(id: ShipId): number {
  return id === "vanguard" ? 1.15 : 1;
}

export function shipBossDamageBonus(id: ShipId): boolean {
  return id === "titan";
}
