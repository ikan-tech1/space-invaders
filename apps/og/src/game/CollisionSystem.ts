import { ALIEN_HEIGHT, ALIEN_WIDTH } from "./formations";
import type { Alien, Boss, Bullet, Rect, Shield, UFO } from "./entities/types";
import { bulletHitsShield } from "./entities/ShieldGrid";

const PLAYER_W = 36;
const PLAYER_H = 24;

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function alienRect(a: Alien): Rect {
  return { x: a.x, y: a.y, w: ALIEN_WIDTH, h: ALIEN_HEIGHT };
}

export function playerRect(px: number, py: number): Rect {
  return { x: px - PLAYER_W / 2, y: py - PLAYER_H / 2, w: PLAYER_W, h: PLAYER_H };
}

export function bossRect(b: Boss): Rect {
  return { x: b.x - 60, y: b.y - 30, w: 120, h: 60 };
}

export function ufoRect(u: UFO): Rect {
  return { x: u.x - 24, y: u.y - 12, w: 48, h: 24 };
}

export function bulletRect(b: Bullet): Rect {
  return { x: b.x - 2, y: b.y - 6, w: 4, h: 12 };
}

export function checkPlayerBulletHits(
  bullet: Bullet,
  aliens: Alien[],
  shields: Shield[],
  ufo: UFO | null,
  boss: Boss | null
): { alien: Alien | null; ufo: boolean; boss: boolean; shield: boolean } {
  if (!bullet.active || !bullet.fromPlayer) {
    return { alien: null, ufo: false, boss: false, shield: false };
  }
  const br = bulletRect(bullet);

  for (const shield of shields) {
    if (bulletHitsShield(shield, bullet)) {
      bullet.active = false;
      return { alien: null, ufo: false, boss: false, shield: true };
    }
  }

  if (boss?.active && rectsOverlap(br, bossRect(boss))) {
    if (!bullet.pierce) bullet.active = false;
    return { alien: null, ufo: false, boss: true, shield: false };
  }

  if (ufo?.active && rectsOverlap(br, ufoRect(ufo))) {
    if (!bullet.pierce) bullet.active = false;
    return { alien: null, ufo: true, boss: false, shield: false };
  }

  for (const alien of aliens) {
    if (!alien.alive) continue;
    if (rectsOverlap(br, alienRect(alien))) {
      if (!bullet.pierce) bullet.active = false;
      return { alien, ufo: false, boss: false, shield: false };
    }
  }

  return { alien: null, ufo: false, boss: false, shield: false };
}

export function checkEnemyBulletHits(
  bullet: Bullet,
  px: number,
  py: number,
  shields: Shield[],
  invuln: boolean
): "player" | "shield" | null {
  if (!bullet.active || bullet.fromPlayer) return null;
  const br = bulletRect(bullet);

  for (const shield of shields) {
    if (bulletHitsShield(shield, bullet)) {
      bullet.active = false;
      return "shield";
    }
  }

  if (!invuln && rectsOverlap(br, playerRect(px, py))) {
    bullet.active = false;
    return "player";
  }
  return null;
}
