import type { PowerUpType } from "../config";
import { POWERUP_DISPLAY } from "../config";
import { loadNeonMeta, saveNeonMeta } from "./metaStore";

export type DeathSlotKind = "extraLife" | "powerup" | "stars" | "nothing";

export type SlotReelSymbol =
  | "life"
  | "stars"
  | "empty"
  | PowerUpType;

export interface DeathSlotOutcome {
  kind: DeathSlotKind;
  powerup?: PowerUpType;
  stars?: number;
  label: string;
  detail: string;
  reels: [SlotReelSymbol, SlotReelSymbol, SlotReelSymbol];
}

const START_POWERUP_POOL: PowerUpType[] = [
  "aegis",
  "overdrive",
  "weaponCore",
  "chrono",
  "prism",
  "burst3",
  "ionLance",
  "novaShell",
];

const REEL_DECOY: SlotReelSymbol[] = [
  "empty",
  "stars",
  "aegis",
  "overdrive",
  "weaponCore",
  "chrono",
  "prism",
  "burst3",
  "life",
];

/** Weighted roll: extra life ~6%, power-up ~18%, stars ~30%, nothing ~46%. */
export function rollDeathSlotOutcome(): DeathSlotOutcome {
  const roll = Math.random() * 100;

  if (roll < 6) {
    return buildOutcome("extraLife");
  }
  if (roll < 24) {
    const pool = START_POWERUP_POOL.filter((p) => p !== "ionLance" || isIonUnlocked());
    const powerup = pool[Math.floor(Math.random() * pool.length)]!;
    return buildOutcome("powerup", powerup);
  }
  if (roll < 54) {
    const stars = 5 + Math.floor(Math.random() * 11);
    return buildOutcome("stars", undefined, stars);
  }
  return buildOutcome("nothing");
}

function isIonUnlocked(): boolean {
  const meta = loadNeonMeta();
  return meta.unlockedPickups.includes("no_hit_l3");
}

function buildOutcome(
  kind: DeathSlotKind,
  powerup?: PowerUpType,
  stars?: number
): DeathSlotOutcome {
  switch (kind) {
    case "extraLife":
      return {
        kind,
        label: "BONUS LIFE",
        detail: "+1 life on your next redeploy",
        reels: ["life", "life", "life"],
      };
    case "powerup": {
      const p = powerup ?? "aegis";
      const info = POWERUP_DISPLAY[p];
      return {
        kind,
        powerup: p,
        label: info.name.toUpperCase(),
        detail: `${info.effect} — armed for next run`,
        reels: [p, p, p],
      };
    }
    case "stars":
      return {
        kind,
        stars: stars ?? 10,
        label: `+${stars ?? 10} STARS`,
        detail: "Added to hangar balance",
        reels: ["stars", "stars", "stars"],
      };
    default:
      return {
        kind: "nothing",
        label: "NO LUCK",
        detail: "Spin again on your next defeat",
        reels: pickNothingReels(),
      };
  }
}

function pickNothingReels(): [SlotReelSymbol, SlotReelSymbol, SlotReelSymbol] {
  const a = REEL_DECOY[Math.floor(Math.random() * REEL_DECOY.length)]!;
  let b = REEL_DECOY[Math.floor(Math.random() * REEL_DECOY.length)]!;
  let c = REEL_DECOY[Math.floor(Math.random() * REEL_DECOY.length)]!;
  while (a === b && b === c) {
    c = REEL_DECOY[Math.floor(Math.random() * REEL_DECOY.length)]!;
  }
  return [a, b, c];
}

export function persistDeathSlotOutcome(outcome: DeathSlotOutcome): void {
  const meta = loadNeonMeta();
  switch (outcome.kind) {
    case "extraLife":
      meta.pendingBonusLife = true;
      break;
    case "powerup":
      meta.pendingStartPowerup = outcome.powerup ?? null;
      break;
    case "stars":
      meta.stars += outcome.stars ?? 0;
      break;
    case "nothing":
      break;
  }
  saveNeonMeta(meta);
}

export function symbolLabel(sym: SlotReelSymbol): string {
  if (sym === "life") return "♥";
  if (sym === "stars") return "★";
  if (sym === "empty") return "—";
  return POWERUP_DISPLAY[sym].icon;
}

export function symbolTitle(sym: SlotReelSymbol): string {
  if (sym === "life") return "Extra life";
  if (sym === "stars") return "Stars";
  if (sym === "empty") return "Empty";
  return POWERUP_DISPLAY[sym].name;
}

export function hasPendingRedeployBonus(): boolean {
  const m = loadNeonMeta();
  return Boolean(m.pendingBonusLife || m.pendingStartPowerup);
}

export function pendingBonusSummary(): string | null {
  const m = loadNeonMeta();
  const parts: string[] = [];
  if (m.pendingBonusLife) parts.push("+1 life");
  if (m.pendingStartPowerup) {
    parts.push(POWERUP_DISPLAY[m.pendingStartPowerup].name);
  }
  return parts.length ? parts.join(" · ") : null;
}
