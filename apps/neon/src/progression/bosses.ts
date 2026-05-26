import { CANVAS_WIDTH } from "../config";
import type { Boss, BossKind } from "../game/entities/types";

export function spawnBoss(level: number, kind: BossKind): Boss {
  const bigHp = 45 + level * 4;
  const hp = kind === "mini" ? Math.floor(bigHp * 0.42) : bigHp;
  return {
    x: CANVAS_WIDTH / 2,
    y: kind === "mini" ? 115 : 88,
    hp,
    maxHp: hp,
    direction: 1,
    phase: 1,
    active: true,
    patternTimer: 0,
    kind,
  };
}

export function bossMoveSpeed(kind: BossKind): number {
  return kind === "mini" ? 125 : 75;
}
