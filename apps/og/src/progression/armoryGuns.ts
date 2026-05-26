import type { GunVolley } from "../game/weaponVolley";

/** Guns purchasable / equippable in the Armory (no piercing / rail). */
export type ArmoryGunId = Extract<
  GunVolley,
  | "single"
  | "twin"
  | "double"
  | "scatter"
  | "burst2"
  | "burst3"
  | "homing"
  | "shockwave"
  | "triple"
>;

export interface ArmoryGunDef {
  id: ArmoryGunId;
  tokenCost: number;
  description: string;
}

export const ARMORY_GUNS: ArmoryGunDef[] = [
  { id: "single", tokenCost: 0, description: "Classic solo cannon" },
  { id: "double", tokenCost: 40, description: "Arcade double-fire volley" },
  { id: "twin", tokenCost: 55, description: "Parallel twin bolts" },
  { id: "scatter", tokenCost: 75, description: "Wide fan scatter shot" },
  { id: "burst2", tokenCost: 90, description: "Two-round burst salvo" },
  { id: "burst3", tokenCost: 110, description: "Three-round burst salvo" },
  { id: "homing", tokenCost: 140, description: "Micro-missiles seek targets" },
  { id: "shockwave", tokenCost: 160, description: "Short-range shock burst" },
  { id: "triple", tokenCost: 200, description: "Center + angled triple" },
];

export const DEFAULT_UNLOCKED_GUNS: ArmoryGunId[] = ["single"];
