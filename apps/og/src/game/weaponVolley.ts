import type { Bullet } from "./entities/types";
import { BULLET_SPEED } from "../config";

export type GunVolley =
  | "single"
  | "twin"
  | "triple"
  | "quint"
  | "hex"
  | "spread"
  | "plasma"
  | "rapid"
  | "double"
  | "scatter"
  | "burst2"
  | "burst3"
  | "homing"
  | "shockwave";

/** Volley tier ladder for +1 volley upgrade pickup. */
export const VOLLEY_TIER_CHAIN: GunVolley[] = [
  "single",
  "double",
  "twin",
  "burst2",
  "triple",
  "burst3",
  "quint",
  "scatter",
  "hex",
  "homing",
  "shockwave",
];

export function bumpVolleyTier(profile: GunVolley): GunVolley {
  const idx = VOLLEY_TIER_CHAIN.indexOf(profile);
  if (idx < 0) return profile;
  return VOLLEY_TIER_CHAIN[Math.min(idx + 1, VOLLEY_TIER_CHAIN.length - 1)]!;
}

/** Maps timed weapon pickups to volley profiles. */
export const PICKUP_WEAPON_PROFILE: Partial<Record<string, GunVolley>> = {
  rapid: "rapid",
  spread: "spread",
  plasma: "plasma",
  twin: "twin",
  triple: "triple",
  quint: "quint",
  hex: "hex",
  scatter: "scatter",
  double: "double",
  burst2: "burst2",
  burst3: "burst3",
  homing: "homing",
  shockwave: "shockwave",
};

export function createVolley(profile: GunVolley, px: number, py: number): Bullet[] {
  const mk = (
    x: number,
    y: number,
    opts: Partial<Pick<Bullet, "spread" | "plasma" | "homing" | "shockwave" | "vy">> = {}
  ): Bullet => ({
    x,
    y,
    vy: opts.vy ?? -BULLET_SPEED,
    fromPlayer: true,
    spread: opts.spread ?? false,
    active: true,
    pierce: false,
    plasma: opts.plasma ?? false,
    homing: opts.homing ?? false,
    shockwave: opts.shockwave ?? false,
  });

  switch (profile) {
    case "double":
      return [mk(px - 6, py - 16), mk(px + 6, py - 14)];
    case "twin":
      return [mk(px - 8, py - 16), mk(px + 8, py - 16)];
    case "triple":
      return [mk(px, py - 16), mk(px - 14, py - 14, { spread: true }), mk(px + 14, py - 14, { spread: true })];
    case "quint":
      return [-24, -12, 0, 12, 24].map((o) => mk(px + o, py - 16, { spread: o !== 0 }));
    case "hex":
      return [-30, -18, -6, 6, 18, 30].map((o) => mk(px + o, py - 16, { spread: o !== 0 }));
    case "scatter":
      return [-28, -14, 0, 14, 28].map((o) =>
        mk(px + o, py - 15 + Math.abs(o) * 0.04, { spread: true, vy: -BULLET_SPEED * (0.92 + Math.abs(o) * 0.002) })
      );
    case "spread":
      return [mk(px, py - 16), mk(px - 20, py - 14, { spread: true }), mk(px + 20, py - 14, { spread: true })];
    case "plasma":
      return [-32, -16, 0, 16, 32].map((o) =>
        mk(px + o, py - 16 + Math.abs(o) * 0.06, { spread: true, plasma: true })
      );
    case "burst2":
      return [mk(px - 4, py - 16), mk(px + 4, py - 15, { spread: true })];
    case "burst3":
      return [mk(px, py - 16), mk(px - 10, py - 15, { spread: true }), mk(px + 10, py - 15, { spread: true })];
    case "homing":
      return [
        mk(px, py - 16, { homing: true }),
        mk(px - 12, py - 14, { homing: true, spread: true }),
        mk(px + 12, py - 14, { homing: true, spread: true }),
      ];
    case "shockwave":
      return [-20, -10, 0, 10, 20].map((o) =>
        mk(px + o, py - 10, { shockwave: true, vy: -BULLET_SPEED * 0.55, spread: true })
      );
    case "rapid":
      return [mk(px, py - 16)];
    default:
      return [mk(px, py - 16)];
  }
}

/** True when an on-screen player bullet blocks the classic one-bullet slot. */
export function playerBulletBlocksSlot(bullets: Bullet[]): boolean {
  return bullets.some((b) => b.fromPlayer && b.active && !b.spread);
}

/** Profiles that may fire again before the prior volley leaves the screen. */
export function profileBypassesBulletSlot(profile: GunVolley): boolean {
  return (
    profile === "rapid" ||
    profile === "plasma" ||
    profile === "spread" ||
    profile === "scatter" ||
    profile === "twin" ||
    profile === "triple" ||
    profile === "quint" ||
    profile === "hex" ||
    profile === "double" ||
    profile === "burst2" ||
    profile === "burst3" ||
    profile === "homing" ||
    profile === "shockwave"
  );
}

export function profileFireCooldownMult(profile: GunVolley): number {
  switch (profile) {
    case "rapid":
      return 1;
    case "plasma":
      return 1;
    case "hex":
    case "quint":
      return 1.12;
    case "shockwave":
      return 1.35;
    case "homing":
      return 1.2;
    case "burst3":
      return 1.15;
    case "scatter":
      return 1.08;
    default:
      return 1;
  }
}

export const GUN_VOLLEY_LABELS: Record<GunVolley, string> = {
  single: "Solo Cannon",
  double: "Double Fire",
  twin: "Twin Blasters",
  triple: "Triple Burst",
  quint: "Quint Salvo",
  hex: "Hex Storm",
  spread: "Spread Array",
  scatter: "Scatter Fan",
  plasma: "Nova Plasma",
  rapid: "Rapid Pulse",
  burst2: "Burst Mk-II",
  burst3: "Burst Mk-III",
  homing: "Seeker Pods",
  shockwave: "Shockwave",
};

export interface GunCompareStats {
  volleySize: number;
  bypassSlot: boolean;
  cooldownTier: string;
  fireRatePct: number;
}

export function getGunCompareStats(profile: GunVolley): GunCompareStats {
  const volley = createVolley(profile, 0, 0);
  const mult = profileFireCooldownMult(profile);
  const fireRatePct = Math.round((1 / mult) * 100);
  let cooldownTier = "Standard";
  if (mult >= 1.3) cooldownTier = "Slow";
  else if (mult >= 1.1) cooldownTier = "Heavy";
  else if (mult <= 0.9) cooldownTier = "Fast";
  return {
    volleySize: volley.length,
    bypassSlot: profileBypassesBulletSlot(profile),
    cooldownTier,
    fireRatePct,
  };
}
