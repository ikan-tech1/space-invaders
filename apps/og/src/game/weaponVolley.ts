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
  | "rapid";

export function createVolley(
  profile: GunVolley,
  px: number,
  py: number,
  _pierce: boolean
): Bullet[] {
  const mk = (x: number, y: number, spread = false, plasma = false): Bullet => ({
    x,
    y,
    vy: plasma ? -BULLET_SPEED * 1.08 : -BULLET_SPEED,
    fromPlayer: true,
    spread,
    active: true,
    pierce: false,
    plasma,
  });

  switch (profile) {
    case "twin":
      return [mk(px - 8, py - 16), mk(px + 8, py - 16)];
    case "triple":
      return [mk(px, py - 16), mk(px - 14, py - 14, true), mk(px + 14, py - 14, true)];
    case "quint":
      return [-24, -12, 0, 12, 24].map((o) => mk(px + o, py - 16, o !== 0));
    case "hex":
      return [-30, -18, -6, 6, 18, 30].map((o) => mk(px + o, py - 16, o !== 0));
    case "spread":
      return [mk(px, py - 16), mk(px - 20, py - 14, true), mk(px + 20, py - 14, true)];
    case "plasma":
      return [-32, -16, 0, 16, 32].map((o) =>
        mk(px + o, py - 16 + Math.abs(o) * 0.06, true, true)
      );
    case "rapid":
      return [mk(px, py - 16)];
    default:
      return [mk(px, py - 16)];
  }
}

/** Profiles that may fire again before the prior volley leaves the screen. */
export function profileBypassesBulletSlot(profile: GunVolley): boolean {
  return (
    profile === "rapid" ||
    profile === "plasma" ||
    profile === "spread" ||
    profile === "twin" ||
    profile === "triple" ||
    profile === "quint" ||
    profile === "hex"
  );
}

export const GUN_VOLLEY_LABELS: Record<GunVolley, string> = {
  single: "Solo Cannon",
  twin: "Twin Blasters",
  triple: "Triple Burst",
  quint: "Quint Salvo",
  hex: "Hex Storm",
  spread: "Spread Array",
  plasma: "Nova Plasma",
  rapid: "Rapid Pulse",
};
