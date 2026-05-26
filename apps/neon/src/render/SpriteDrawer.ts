import type { DroneClass, PowerUpType, WeaponTier } from "../config";
import type { BossKind } from "../game/entities/types";

const SPRITES: Record<string, number[][]> = {
  player: [
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 0, 1, 0, 0],
  ],
  playerGauss: [
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1],
    [0, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0],
  ],
  playerBeam: [
    [0, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 1, 0, 1, 0, 1, 1],
    [0, 1, 0, 0, 0, 1, 0],
  ],
  scoutA: [
    [0, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 1],
  ],
  scoutB: [
    [0, 0, 1, 0, 0, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0],
  ],
  strikerA: [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 1, 1, 0, 1, 0],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [0, 1, 0, 0, 0, 0, 1, 0],
  ],
  strikerB: [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 1, 0, 1, 1, 0, 1, 0],
  ],
  bulwarkA: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  bulwarkB: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1],
    [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  ],
  carrierA: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  carrierB: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [0, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  eliteA: [
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 1],
  ],
  eliteB: [
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 1, 0, 0],
  ],
  ufo: [
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0, 0, 1, 0, 0],
  ],
  bossMini: [
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1],
    [0, 1, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0, 0, 1, 0, 0],
  ],
  bossBig: [
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 1],
    [0, 1, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0, 0, 1, 0, 0],
  ],
  pickupOverdrive: [
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
  ],
  pickupPrism: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 0, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  pickupAegis: [
    [0, 1, 1, 1, 0],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1],
    [0, 1, 1, 1, 0],
  ],
  pickupChrono: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  pickupNanite: [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  pickupCore: [
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
  ],
  pickupIon: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  pickupNova: [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
  ],
  pickupRail: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  pickupBeam: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  pickupClone: [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  pickupBunker: [
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  pickupSlow: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  pickupBurst: [
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1],
  ],
};

export const DRONE_COLORS: Record<DroneClass, string> = {
  scout: "#00e8ff",
  striker: "#ff3d9a",
  bulwark: "#ffaa22",
  carrier: "#b366ff",
  elite: "#ffcc33",
};

const PICKUP_COLORS: Record<PowerUpType, string> = {
  overdrive: "#00e8ff",
  prism: "#b366ff",
  aegis: "#5dffb0",
  chrono: "#7bff6e",
  nanite: "#ffaa22",
  weaponCore: "#ffcc33",
  burst2: "#00e8ff",
  burst3: "#00e8ff",
  burst5: "#00e8ff",
  burst6: "#00e8ff",
  ionLance: "#00e8ff",
  novaShell: "#ff3d9a",
  railBurst: "#ffcc33",
  beamOvercharge: "#ff4466",
  cloneWing: "#7bff6e",
  deployBunker: "#5dffb0",
  temporalSlow: "#7a9bb8",
};

const PICKUP_SPRITES: Record<PowerUpType, string> = {
  overdrive: "pickupOverdrive",
  prism: "pickupPrism",
  aegis: "pickupAegis",
  chrono: "pickupChrono",
  nanite: "pickupNanite",
  weaponCore: "pickupCore",
  burst2: "pickupBurst",
  burst3: "pickupBurst",
  burst5: "pickupBurst",
  burst6: "pickupBurst",
  ionLance: "pickupIon",
  novaShell: "pickupNova",
  railBurst: "pickupRail",
  beamOvercharge: "pickupBeam",
  cloneWing: "pickupClone",
  deployBunker: "pickupBunker",
  temporalSlow: "pickupSlow",
};

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  color: string,
  scale = 2
): void {
  const grid = SPRITES[name];
  if (!grid) return;
  ctx.fillStyle = color;
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r]!;
    for (let c = 0; c < row.length; c++) {
      if (row[c]) ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
    }
  }
}

export function droneSpriteKey(droneClass: DroneClass, frame: number): string {
  const suffix = frame % 2 === 0 ? "A" : "B";
  return `${droneClass}${suffix}`;
}

export function spritePixelSize(
  name: string,
  scale = 2
): { w: number; h: number; cols: number; rows: number } {
  const grid = SPRITES[name];
  if (!grid?.length) return { w: 0, h: 0, cols: 0, rows: 0 };
  const rows = grid.length;
  const cols = Math.max(...grid.map((row) => row.length));
  return { w: cols * scale, h: rows * scale, cols, rows };
}

/** Center a drone sprite inside its formation slot. */
export function droneSpriteLayout(
  droneClass: DroneClass,
  frame: number,
  x: number,
  y: number,
  slotW: number,
  slotH: number,
  scale = 2
): { key: string; sx: number; sy: number; w: number; h: number } {
  const key = droneSpriteKey(droneClass, frame);
  const { w, h } = spritePixelSize(key, scale);
  return {
    key,
    sx: x + (slotW - w) / 2,
    sy: y + (slotH - h) / 2,
    w,
    h,
  };
}

export function playerSpriteKey(tier: WeaponTier): string {
  if (tier >= 4) return "playerBeam";
  if (tier >= 3) return "playerGauss";
  return "player";
}

export function bossSpriteKey(kind: BossKind): string {
  return kind === "mini" ? "bossMini" : "bossBig";
}

export function pickupSpriteKey(type: PowerUpType): string {
  return PICKUP_SPRITES[type] ?? "pickupCore";
}

export function pickupColor(type: PowerUpType): string {
  return PICKUP_COLORS[type] ?? "#00e8ff";
}

export function drawDroneDamageOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  hp: number,
  maxHp: number
): void {
  if (maxHp <= 1 || hp >= maxHp || w <= 0 || h <= 0) return;
  const pct = hp / maxHp;
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#ff4466";
  ctx.fillRect(x, y, w * (1 - pct), h);
  ctx.globalAlpha = 1;
}
