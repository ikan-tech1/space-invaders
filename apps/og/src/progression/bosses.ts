import { CANVAS_WIDTH } from "../config";
import type { Boss, BossKind } from "../game/entities/types";

export function spawnBoss(level: number, kind: BossKind): Boss {
  const bigHp = 30 + level * 3;
  const hp = kind === "mini" ? Math.floor(bigHp * 0.4) : bigHp;
  return {
    x: CANVAS_WIDTH / 2,
    y: kind === "mini" ? 120 : 90,
    hp,
    maxHp: hp,
    direction: 1,
    weakPoint: 1,
    active: true,
    kind,
    phase: 1,
    fireTimer: 0,
    telegraphTimer: 0,
    attackCooldown: kind === "mini" ? 1.2 : 1.8,
  };
}

export function bossMoveSpeed(kind: BossKind): number {
  return kind === "mini" ? 110 : 70;
}
