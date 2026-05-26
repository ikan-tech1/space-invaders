import {
  CANVAS_WIDTH,
  MOVEMENT_TUNING,
  SHIELD_CELL,
  SHIELD_COLS,
  SHIELD_ROWS,
} from "../../config";
import type { Bullet, Shield } from "./types";

export function createShields(count: number): Shield[] {
  const shields: Shield[] = [];
  const totalW = SHIELD_COLS * SHIELD_CELL;
  const gap = (CANVAS_WIDTH - count * totalW) / (count + 1);

  for (let i = 0; i < count; i++) {
    const x = gap + i * (totalW + gap);
    const y = 420;
    const cells: boolean[][] = [];
    for (let r = 0; r < SHIELD_ROWS; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < SHIELD_COLS; c++) {
        const arch =
          r < SHIELD_ROWS - 2 ||
          (c > 2 && c < SHIELD_COLS - 3) ||
          (r >= SHIELD_ROWS - 2 && c >= 4 && c <= SHIELD_COLS - 5);
        row.push(arch);
      }
      cells.push(row);
    }
    shields.push({ cells, x, y });
  }
  return shields;
}

export function shieldRect(shield: Shield): { x: number; y: number; w: number; h: number } {
  return {
    x: shield.x,
    y: shield.y,
    w: SHIELD_COLS * SHIELD_CELL,
    h: SHIELD_ROWS * SHIELD_CELL,
  };
}

export function damageShieldAt(
  shield: Shield,
  bx: number,
  by: number,
  radius: number
): boolean {
  let hit = false;
  for (let r = 0; r < SHIELD_ROWS; r++) {
    for (let c = 0; c < SHIELD_COLS; c++) {
      if (!shield.cells[r]![c]) continue;
      const cx = shield.x + c * SHIELD_CELL + SHIELD_CELL / 2;
      const cy = shield.y + r * SHIELD_CELL + SHIELD_CELL / 2;
      if (Math.hypot(bx - cx, by - cy) < radius) {
        shield.cells[r]![c] = false;
        hit = true;
      }
    }
  }
  return hit;
}

export function bulletHitsShield(shield: Shield, bullet: Bullet): boolean {
  if (!bullet.active) return false;
  const r = shieldRect(shield);
  if (
    bullet.x < r.x ||
    bullet.x > r.x + r.w ||
    bullet.y < r.y ||
    bullet.y > r.y + r.h
  ) {
    return false;
  }
  return damageShieldAt(shield, bullet.x, bullet.y, SHIELD_CELL * 0.8);
}

export function patchShield(shield: Shield): void {
  for (let r = SHIELD_ROWS - 4; r < SHIELD_ROWS - 1; r++) {
    for (let c = 3; c < SHIELD_COLS - 3; c++) {
      if (r >= 0 && r < SHIELD_ROWS) shield.cells[r]![c] = true;
    }
  }
}

/** Full arch pattern cell count for a fresh bunker. */
function archCellEnabled(r: number, c: number): boolean {
  return (
    r < SHIELD_ROWS - 2 ||
    (c > 2 && c < SHIELD_COLS - 3) ||
    (r >= SHIELD_ROWS - 2 && c >= 4 && c <= SHIELD_COLS - 5)
  );
}

/**
 * Rebuild bunkers at existing positions with degraded HP.
 * @param durability 1 = full bunker, lower = missing top/side cells
 */
export function rebuildShields(shields: Shield[], durability: number): void {
  const clamped = Math.max(0.35, Math.min(1, durability));
  for (const shield of shields) {
    for (let r = 0; r < SHIELD_ROWS; r++) {
      for (let c = 0; c < SHIELD_COLS; c++) {
        if (!archCellEnabled(r, c)) {
          shield.cells[r]![c] = false;
          continue;
        }
        const rowBias = r / SHIELD_ROWS;
        const keepChance = clamped - rowBias * (1 - clamped) * 0.35;
        shield.cells[r]![c] = Math.random() < keepChance;
      }
    }
    shield.rebuildFlash = MOVEMENT_TUNING.bunkerRebuildFlashSec;
  }
}

export function createFreshShields(count: number, durability = 1): Shield[] {
  const shields = createShields(count);
  if (durability >= 0.99) return shields;
  rebuildShields(shields, durability);
  return shields;
}
