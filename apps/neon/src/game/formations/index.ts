import type { FormationType, DroneClass } from "../../config";
import type { Drone } from "../entities/types";

const W = 30;
const H = 24;
const GX = 10;
const GY = 12;

function classForRow(r: number, cols: number, c: number): DroneClass {
  if (r === 0) return "elite";
  if (r === 1) return "striker";
  if (c === 0 || c === cols - 1) return "bulwark";
  if (r >= 2 && c % 4 === 0) return "carrier";
  return "scout";
}

export function buildFormation(
  type: FormationType,
  rows: number,
  cols: number,
  startX: number,
  startY: number
): Drone[] {
  const drones: Drone[] = [];
  const add = (c: number, r: number) => {
    const dc = classForRow(r, cols, c);
    drones.push({
      x: startX + c * (W + GX),
      y: startY + r * (H + GY),
      row: r,
      droneClass: dc,
      alive: true,
      hp: dc === "bulwark" ? 2 : dc === "elite" ? 2 : 1,
      animPhase: 0,
      shootCd: Math.random() * 2,
    });
  };

  switch (type) {
    case "classic":
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) add(c, r);
      break;
    case "staggered":
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) if ((r + c) % 2 === 0) add(c, r);
      break;
    case "diamond": {
      const mid = Math.floor(cols / 2);
      for (let r = 0; r < rows; r++) {
        const span = Math.max(1, mid - Math.abs(r - Math.floor(rows / 2)) + 2);
        const off = mid - Math.floor(span / 2);
        for (let c = 0; c < span; c++) add(off + c, r);
      }
      break;
    }
    case "pincer":
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (c < 2 || c >= cols - 2 || r === 0) add(c, r);
      break;
  }
  return drones;
}

export function formationBounds(drones: Drone[]) {
  const alive = drones.filter((d) => d.alive);
  if (!alive.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const d of alive) {
    minX = Math.min(minX, d.x);
    maxX = Math.max(maxX, d.x + W);
    minY = Math.min(minY, d.y);
    maxY = Math.max(maxY, d.y + H);
  }
  return { minX, maxX, minY, maxY };
}

export const DRONE_W = W;
export const DRONE_H = H;
