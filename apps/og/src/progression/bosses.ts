import { CANVAS_WIDTH, ENEMY_BULLET_SPEED, type Difficulty } from "../config";
import type {
  Boss,
  BossAttackPattern,
  BossKind,
  Bullet,
  MiniBossArchetype,
  BigBossArchetype,
} from "../game/entities/types";

export interface BossDefinition {
  id: MiniBossArchetype | BigBossArchetype;
  name: string;
  title: string;
  personality: string;
  movePattern: Boss["movePattern"];
  attackPattern: BossAttackPattern;
  phase2Attack?: BossAttackPattern;
  color: string;
  accent: string;
  spriteKey: string;
  moveSpeed: number;
  telegraphDuration: number;
  attackCooldown: number;
  phase2AttackCooldown?: number;
  y: number;
}

export const MINI_BOSSES: Record<MiniBossArchetype, BossDefinition> = {
  bulwark: {
    id: "bulwark",
    name: "The Bulwark",
    title: "Iron Curtain",
    personality: "Slow, armored gatekeeper — spreads wide volleys and dares you to chip through.",
    movePattern: "slow",
    attackPattern: "spread",
    color: "#8899aa",
    accent: "#ffd24a",
    spriteKey: "bossBulwark",
    moveSpeed: 55,
    telegraphDuration: 0.85,
    attackCooldown: 2.1,
    y: 118,
  },
  swarmQueen: {
    id: "swarmQueen",
    name: "The Swarm Queen",
    title: "Brood Matriarch",
    personality: "Spawns drone escorts while firing aimed bursts at your lane.",
    movePattern: "bob",
    attackPattern: "aimedBurst",
    color: "#ff2d95",
    accent: "#7bff6e",
    spriteKey: "bossSwarmQueen",
    moveSpeed: 75,
    telegraphDuration: 0.7,
    attackCooldown: 1.65,
    y: 112,
  },
  slicer: {
    id: "slicer",
    name: "The Slicer",
    title: "Blade Dancer",
    personality: "Zigzags across the lane and unleashes rotating spiral salvos.",
    movePattern: "zigzag",
    attackPattern: "spiral",
    color: "#00f0ff",
    accent: "#ff4466",
    spriteKey: "bossSlicer",
    moveSpeed: 130,
    telegraphDuration: 0.6,
    attackCooldown: 1.45,
    y: 105,
  },
  bombardier: {
    id: "bombardier",
    name: "The Bombardier",
    title: "Gravity Wells",
    personality: "Hovers with a heavy silhouette and drops arcing gravity bombs.",
    movePattern: "fast",
    attackPattern: "dropBomb",
    color: "#ff8844",
    accent: "#ffd24a",
    spriteKey: "bossBombardier",
    moveSpeed: 95,
    telegraphDuration: 0.8,
    attackCooldown: 1.9,
    y: 100,
  },
};

export const BIG_BOSSES: Record<BigBossArchetype, BossDefinition> = {
  hiveSentinel: {
    id: "hiveSentinel",
    name: "The Hive Sentinel",
    title: "Sector Gatekeeper",
    personality: "First major command node — methodical triple bursts escalate to cross-fire.",
    movePattern: "slow",
    attackPattern: "aimedBurst",
    phase2Attack: "crossBurst",
    color: "#ff4466",
    accent: "#ffd24a",
    spriteKey: "bossHiveSentinel",
    moveSpeed: 62,
    telegraphDuration: 0.75,
    attackCooldown: 2.3,
    phase2AttackCooldown: 1.35,
    y: 88,
  },
  overmind: {
    id: "overmind",
    name: "The Overmind",
    title: "Mothership Core",
    personality: "Campaign finale — spiral suppression in phase one, homing volleys in phase two.",
    movePattern: "bob",
    attackPattern: "spiral",
    phase2Attack: "homingVolley",
    color: "#cc44ff",
    accent: "#00f0ff",
    spriteKey: "bossOvermind",
    moveSpeed: 58,
    telegraphDuration: 0.65,
    attackCooldown: 2.0,
    phase2AttackCooldown: 1.15,
    y: 82,
  },
  dreadnought: {
    id: "dreadnought",
    name: "The Dreadnought",
    title: "Heavy Cruiser",
    personality: "Endless escalation — wide spreads become sweeping laser patterns below half hull.",
    movePattern: "slow",
    attackPattern: "spread",
    phase2Attack: "laserSweep",
    color: "#aa2233",
    accent: "#ff6622",
    spriteKey: "bossDreadnought",
    moveSpeed: 48,
    telegraphDuration: 0.7,
    attackCooldown: 2.5,
    phase2AttackCooldown: 1.25,
    y: 78,
  },
};

const MINI_ORDER: MiniBossArchetype[] = ["bulwark", "swarmQueen", "slicer", "bombardier"];
const BIG_ORDER: BigBossArchetype[] = ["hiveSentinel", "overmind", "dreadnought"];

export function getMiniBossArchetype(level: number): MiniBossArchetype {
  const idx = Math.floor((level - 3) / 6) % MINI_ORDER.length;
  return MINI_ORDER[idx]!;
}

export function getBigBossArchetype(level: number): BigBossArchetype {
  const idx = Math.floor((level - 6) / 6) % BIG_ORDER.length;
  return BIG_ORDER[idx]!;
}

function difficultyHpMult(difficulty: Difficulty): number {
  if (difficulty === "casual") return 0.82;
  if (difficulty === "insane") return 1.28;
  return 1;
}

export function computeBossHp(level: number, kind: BossKind, difficulty: Difficulty): number {
  const diff = difficultyHpMult(difficulty);
  const scale = 1 + Math.max(0, level - 12) * 0.06;
  if (kind === "mini") {
    const base = 16 + level * 3.5;
    const archetype = getMiniBossArchetype(level);
    const tankBonus = archetype === "bulwark" ? 1.25 : archetype === "slicer" ? 0.88 : 1;
    return Math.max(12, Math.floor(base * diff * scale * tankBonus));
  }
  const base = 38 + level * 5.5;
  return Math.max(30, Math.floor(base * diff * scale));
}

export function getBossDefinition(level: number, kind: BossKind): BossDefinition {
  return kind === "mini"
    ? MINI_BOSSES[getMiniBossArchetype(level)]
    : BIG_BOSSES[getBigBossArchetype(level)];
}

export function spawnBoss(level: number, kind: BossKind, difficulty: Difficulty = "classic"): Boss {
  const def = getBossDefinition(level, kind);
  const hp = computeBossHp(level, kind, difficulty);
  return {
    x: CANVAS_WIDTH / 2,
    y: def.y,
    baseY: def.y,
    hp,
    maxHp: hp,
    direction: 1,
    weakPoint: 1,
    active: true,
    kind,
    phase: 1,
    fireTimer: 0,
    telegraphTimer: 0,
    attackCooldown: def.attackCooldown * 0.5,
    archetype: def.id,
    name: def.name,
    movePattern: def.movePattern,
    attackPattern: def.attackPattern,
    phase2Attack: def.phase2Attack,
    moveTimer: 0,
    spiralAngle: 0,
    spawnTimer: 2.5,
    color: def.color,
    accent: def.accent,
    spriteKey: def.spriteKey,
  };
}

export function bossMoveSpeed(boss: Boss): number {
  const def =
    boss.kind === "mini"
      ? MINI_BOSSES[boss.archetype as MiniBossArchetype]
      : BIG_BOSSES[boss.archetype as BigBossArchetype];
  const phaseMult = boss.kind === "big" && boss.phase === 2 ? 1.15 : 1;
  return def.moveSpeed * phaseMult;
}

export function bossTelegraphDuration(boss: Boss): number {
  const def =
    boss.kind === "mini"
      ? MINI_BOSSES[boss.archetype as MiniBossArchetype]
      : BIG_BOSSES[boss.archetype as BigBossArchetype];
  return boss.phase === 2 && def.phase2Attack ? def.telegraphDuration * 0.85 : def.telegraphDuration;
}

export function bossAttackCooldown(boss: Boss): number {
  const def =
    boss.kind === "mini"
      ? MINI_BOSSES[boss.archetype as MiniBossArchetype]
      : BIG_BOSSES[boss.archetype as BigBossArchetype];
  if (boss.kind === "big" && boss.phase === 2 && def.phase2AttackCooldown) {
    return def.phase2AttackCooldown;
  }
  return def.attackCooldown;
}

export function getActiveAttackPattern(boss: Boss): BossAttackPattern {
  if (boss.kind === "big" && boss.phase === 2 && boss.phase2Attack) {
    return boss.phase2Attack;
  }
  return boss.attackPattern;
}

export function updateBossMovement(boss: Boss, dt: number): void {
  const spd = bossMoveSpeed(boss);
  boss.moveTimer += dt;

  switch (boss.movePattern) {
    case "slow":
      boss.x += boss.direction * spd * dt;
      break;
    case "fast":
      boss.x += boss.direction * spd * dt;
      boss.y = boss.baseY + Math.sin(boss.moveTimer * 2.2) * 8;
      break;
    case "bob":
      boss.x += boss.direction * spd * 0.85 * dt;
      boss.y = boss.baseY + Math.sin(boss.moveTimer * 1.6) * 14;
      break;
    case "zigzag": {
      boss.x += boss.direction * spd * dt;
      if (Math.floor(boss.moveTimer * 3) % 2 === 0) {
        boss.y = boss.baseY - 12;
      } else {
        boss.y = boss.baseY + 10;
      }
      break;
    }
  }

  const margin = boss.kind === "mini" ? 56 : 72;
  if (boss.x < margin || boss.x > CANVAS_WIDTH - margin) {
    boss.direction *= -1;
  }
}

function bulletSpeed(boss: Boss): number {
  const phaseBoost = boss.phase === 2 ? 1.28 : 1.08;
  const levelBoost = 1 + Math.min(0.35, (boss.maxHp / 80) * 0.08);
  return ENEMY_BULLET_SPEED * phaseBoost * levelBoost;
}

export function executeBossAttack(
  boss: Boss,
  bullets: Bullet[],
  playerX: number
): void {
  const pattern = getActiveAttackPattern(boss);
  const spd = bulletSpeed(boss);
  const bx = boss.x;
  const by = boss.y + 28;

  switch (pattern) {
    case "spread": {
      const count = boss.kind === "mini" ? 5 : boss.phase === 2 ? 9 : 7;
      const spread = boss.kind === "mini" ? 0.35 : 0.42;
      for (let i = 0; i < count; i++) {
        const t = (i / (count - 1) - 0.5) * 2;
        const angle = t * spread;
        bullets.push({
          x: bx + t * 40,
          y: by,
          vy: spd * Math.cos(angle),
          vx: spd * Math.sin(angle),
          fromPlayer: false,
          active: true,
        });
      }
      break;
    }
    case "aimedBurst": {
      const bursts = boss.phase === 2 ? 4 : 3;
      for (let i = 0; i < bursts; i++) {
        const dx = playerX - bx + (i - bursts / 2) * 18;
        const len = Math.hypot(dx, 120) || 1;
        bullets.push({
          x: bx + (i - 1) * 12,
          y: by,
          vy: (120 / len) * spd,
          vx: (dx / len) * spd * 0.65,
          fromPlayer: false,
          active: true,
        });
      }
      break;
    }
    case "spiral": {
      const arms = boss.phase === 2 ? 6 : 4;
      boss.spiralAngle += boss.phase === 2 ? 0.55 : 0.4;
      for (let i = 0; i < arms; i++) {
        const a = boss.spiralAngle + (i * Math.PI * 2) / arms;
        bullets.push({
          x: bx,
          y: by,
          vy: Math.cos(a) * spd,
          vx: Math.sin(a) * spd,
          fromPlayer: false,
          active: true,
        });
      }
      break;
    }
    case "dropBomb": {
      const bombs = boss.kind === "mini" ? 3 : 4;
      for (let i = 0; i < bombs; i++) {
        bullets.push({
          x: bx + (i - 1) * 28,
          y: by,
          vy: spd * 0.55,
          vx: (i - 1) * 35,
          fromPlayer: false,
          active: true,
        });
      }
      break;
    }
    case "crossBurst": {
      const dirs = [
        [0, 1],
        [0.7, 0.7],
        [-0.7, 0.7],
        [0.5, 1],
        [-0.5, 1],
      ];
      for (const [vx, vy] of dirs) {
        bullets.push({
          x: bx,
          y: by,
          vy: vy * spd,
          vx: vx * spd,
          fromPlayer: false,
          active: true,
        });
      }
      break;
    }
    case "homingVolley": {
      for (let i = 0; i < 3; i++) {
        bullets.push({
          x: bx + (i - 1) * 20,
          y: by,
          vy: spd * 0.85,
          vx: (playerX - bx) * 0.08,
          fromPlayer: false,
          homing: true,
          active: true,
        });
      }
      break;
    }
    case "laserSweep": {
      for (let i = -3; i <= 3; i++) {
        bullets.push({
          x: bx + i * 22,
          y: by,
          vy: spd * 1.15,
          vx: i * 18,
          fromPlayer: false,
          active: true,
        });
      }
      break;
    }
  }
}

/** Swarm Queen spawns weak drone adds. Returns new aliens to append. */
export function maybeSpawnBossAdds(
  boss: Boss,
  dt: number
): { x: number; y: number; row: number; type: number; alive: boolean; animFrame: number }[] {
  if (boss.archetype !== "swarmQueen" || !boss.active) return [];
  boss.spawnTimer -= dt;
  if (boss.spawnTimer > 0) return [];
  boss.spawnTimer = boss.phase === 2 ? 3.2 : 4.5;
  const count = boss.phase === 2 ? 3 : 2;
  const adds = [];
  for (let i = 0; i < count; i++) {
    adds.push({
      x: boss.x + (i - 1) * 32,
      y: boss.y + 40,
      row: 0,
      type: 2,
      alive: true,
      animFrame: 0,
    });
  }
  return adds;
}

export function getBossBannerText(boss: Boss, level: number): string {
  const prefix = boss.kind === "big" ? "BIG BOSS" : "MINI BOSS";
  return `${prefix} — ${boss.name.toUpperCase()} · L${level}`;
}

export function bossDamagePerHit(boss: Boss, titanBonus: boolean): number {
  const base = boss.kind === "mini" ? 2 : 3;
  return base + (titanBonus ? 1 : 0);
}
