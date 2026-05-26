import { DIFFICULTY_CONFIG, type Difficulty } from "../config";
import { createEnemyBolt } from "../weapons/projectiles";
import type { Projectile } from "../weapons/projectiles";
import type { Boss, Drone } from "./entities/types";
import { DRONE_H, DRONE_W } from "./formations";

export function tryDroneFire(
  drone: Drone,
  dt: number,
  px: number,
  py: number,
  difficulty: Difficulty
): Projectile | null {
  if (!drone.alive) return null;
  drone.shootCd -= dt;
  if (drone.shootCd > 0) return null;

  const chance = DIFFICULTY_CONFIG[difficulty].enemyFireChance;
  let interval = 2.5;
  let aimed = false;
  switch (drone.droneClass) {
    case "striker":
      interval = 1.4;
      aimed = true;
      break;
    case "elite":
      interval = 1.1;
      aimed = true;
      break;
    case "bulwark":
      interval = 2;
      break;
    case "carrier":
      interval = 1.8;
      break;
    default:
      interval = 2.8;
  }

  if (Math.random() > chance * dt * (2 / interval)) return null;
  drone.shootCd = interval * (0.6 + Math.random() * 0.6);
  const cx = drone.x + DRONE_W / 2;
  const cy = drone.y + DRONE_H;
  return createEnemyBolt(cx, cy, aimed, px, py);
}

export function bossFirePattern(boss: Boss, px: number, py: number): Projectile[] {
  const out: Projectile[] = [];
  boss.patternTimer += 0.016;
  const cx = boss.x;
  const cy = boss.y + 40;
  if (boss.phase === 1) {
    if (Math.floor(boss.patternTimer * 3) % 2 === 0) {
      out.push(createEnemyBolt(cx - 40, cy, true, px, py));
      out.push(createEnemyBolt(cx + 40, cy, true, px, py));
    }
  } else {
    for (let i = -2; i <= 2; i++) {
      out.push(createEnemyBolt(cx + i * 25, cy, false));
    }
    out.push(createEnemyBolt(cx, cy, true, px, py));
  }
  return out;
}

export function droneRect(d: Drone) {
  return { x: d.x, y: d.y, w: DRONE_W, h: DRONE_H };
}
