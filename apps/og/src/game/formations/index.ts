import type { FormationType } from "../../config";
import type { Alien } from "../entities/types";

const ALIEN_W = 28;
const ALIEN_H = 22;
const GAP_X = 8;
const GAP_Y = 10;

export function buildFormation(
  type: FormationType,
  rows: number,
  cols: number,
  startX: number,
  startY: number
): Alien[] {
  const aliens: Alien[] = [];

  const add = (col: number, row: number, alienType: number) => {
    aliens.push({
      x: startX + col * (ALIEN_W + GAP_X),
      y: startY + row * (ALIEN_H + GAP_Y),
      row,
      type: alienType,
      alive: true,
      animFrame: 0,
    });
  };

  switch (type) {
    case "classic":
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const t = r === 0 ? 0 : r < 2 ? 1 : 2;
          add(c, r, t);
        }
      }
      break;
    case "staggered":
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 2 === 0) {
            const t = r === 0 ? 0 : r < 2 ? 1 : 2;
            add(c, r, t);
          }
        }
      }
      break;
    case "diamond": {
      const mid = Math.floor(cols / 2);
      for (let r = 0; r < rows; r++) {
        const span = Math.max(1, mid - Math.abs(r - Math.floor(rows / 2)) + 2);
        const offset = mid - Math.floor(span / 2);
        for (let c = 0; c < span; c++) {
          const t = r === 0 ? 0 : r < 2 ? 1 : 2;
          add(offset + c, r, t);
        }
      }
      break;
    }
    case "pincer":
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c < 3 || c >= cols - 3 || r === 0) {
            const t = r === 0 ? 0 : r < 2 ? 1 : 2;
            add(c, r, t);
          }
        }
      }
      break;
  }

  return aliens;
}

export function formationBounds(aliens: Alien[]): { minX: number; maxX: number; minY: number; maxY: number } {
  const alive = aliens.filter((a) => a.alive);
  if (alive.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const a of alive) {
    minX = Math.min(minX, a.x);
    maxX = Math.max(maxX, a.x + ALIEN_W);
    minY = Math.min(minY, a.y);
    maxY = Math.max(maxY, a.y + ALIEN_H);
  }
  return { minX, maxX, minY, maxY };
}

export const ALIEN_WIDTH = ALIEN_W;
export const ALIEN_HEIGHT = ALIEN_H;
