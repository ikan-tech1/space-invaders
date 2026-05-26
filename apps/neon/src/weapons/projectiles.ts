import type { WeaponTier } from "../config";

export type ProjectileKind =
  | "pulse"
  | "plasma"
  | "ion"
  | "nova"
  | "singularity"
  | "gauss"
  | "enemy"
  | "enemyAimed";

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: ProjectileKind;
  fromPlayer: boolean;
  active: boolean;
  damage: number;
  pierce: number;
  radius: number;
  /** Horizontal half-width for wide shots (ion lance). */
  span?: number;
  life: number;
  trail: { x: number; y: number }[];
  splitOnHit?: boolean;
  /** Per-bolt tint index for plasma scatter readability. */
  tint?: number;
}

export function projectileHitRect(p: Projectile): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const halfW = p.span ?? p.radius;
  const halfH = p.radius;
  return { x: p.x - halfW, y: p.y - halfH, w: halfW * 2, h: halfH * 2 };
}

export function createPlayerProjectile(
  tier: WeaponTier,
  x: number,
  y: number,
  spreadAngle = 0
): Projectile[] {
  const out: Projectile[] = [];
  switch (tier) {
    case 1:
      out.push({
        x,
        y,
        vx: Math.sin(spreadAngle) * 40,
        vy: -520,
        kind: "pulse",
        fromPlayer: true,
        active: true,
        damage: 1,
        pierce: 0,
        radius: 4,
        life: 2,
        trail: [],
      });
      break;
    case 2:
      for (let i = -2; i <= 2; i++) {
        const a = i * 0.16 + spreadAngle;
        out.push({
          x,
          y,
          vx: Math.sin(a) * 160,
          vy: -440,
          kind: "plasma",
          fromPlayer: true,
          active: true,
          damage: 1,
          pierce: 0,
          radius: 5,
          life: 1.2,
          trail: [],
          tint: i + 2,
        });
      }
      break;
    case 3:
      out.push(createGaussSlug(x, y));
      break;
    case 4:
      break;
    case 5:
      out.push({
        x,
        y,
        vx: spreadAngle * 80,
        vy: -200,
        kind: "singularity",
        fromPlayer: true,
        active: true,
        damage: 1,
        pierce: 0,
        radius: 22,
        life: 2.5,
        trail: [],
      });
      break;
  }
  return out;
}

/** T3 Kinetic Gauss — heavy vertical slug, tap fire, pierce on impact. */
export function createGaussSlug(x: number, y: number, pierce = 3): Projectile {
  return {
    x,
    y,
    vx: 0,
    vy: -500,
    kind: "gauss",
    fromPlayer: true,
    active: true,
    damage: 5,
    pierce,
    radius: 12,
    life: 2,
    trail: [],
  };
}

export function createIonLance(x: number, y: number, extraPierce = 0): Projectile[] {
  return [
    {
      x,
      y,
      vx: 0,
      vy: -620,
      kind: "ion",
      fromPlayer: true,
      active: true,
      damage: 3,
      pierce: 4 + extraPierce,
      radius: 4,
      span: 8,
      life: 1.5,
      trail: [],
    },
  ];
}

export function createNovaShell(x: number, y: number): Projectile {
  return {
    x,
    y,
    vx: 0,
    vy: -240,
    kind: "nova",
    fromPlayer: true,
    active: true,
    damage: 4,
    pierce: 0,
    radius: 16,
    life: 3,
    trail: [],
  };
}

export function createPrismSplit(x: number, y: number): Projectile[] {
  return [-0.26, 0.26].map((a) => ({
    x,
    y,
    vx: Math.sin(a) * 120,
    vy: -480,
    kind: "pulse" as const,
    fromPlayer: true,
    active: true,
    damage: 1,
    pierce: 0,
    radius: 4,
    life: 1.5,
    trail: [],
  }));
}

/** Temporary pickup volleys: 2, 3, 5, or 6 parallel pulse bolts */
export function createBurstVolley(count: number, x: number, y: number): Projectile[] {
  const n = Math.max(2, Math.min(6, count));
  const out: Projectile[] = [];
  const span = (n - 1) * 14;
  for (let i = 0; i < n; i++) {
    const ox = -span / 2 + i * 14;
    out.push({
      x: x + ox,
      y,
      vx: ox * 2,
      vy: -520,
      kind: "pulse",
      fromPlayer: true,
      active: true,
      damage: 1,
      pierce: 0,
      radius: 4,
      life: 2,
      trail: [],
    });
  }
  return out;
}

export function createEnemyBolt(x: number, y: number, aimed = false, tx = 0, ty = 0): Projectile {
  let vx = 0;
  let vy = 240;
  if (aimed) {
    const dx = tx - x;
    const dy = ty - y;
    const len = Math.hypot(dx, dy) || 1;
    vx = (dx / len) * 200;
    vy = (dy / len) * 200;
  }
  return {
    x,
    y,
    vx,
    vy,
    kind: aimed ? "enemyAimed" : "enemy",
    fromPlayer: false,
    active: true,
    damage: 1,
    pierce: 0,
    radius: 5,
    life: 4,
    trail: [],
  };
}
