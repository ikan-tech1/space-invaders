import { PICKUP_DEFS, PICKUP_CATEGORY_COLORS, type PowerUpType } from "../config";
import { drawSprite, pickupSpriteKey } from "../render/SpriteDrawer";

export type ReelSymbol =
  | "life"
  | "miss"
  | "shield"
  | "tokens"
  | "secondWind"
  | PowerUpType;

const SLOT_SYMBOL_COLORS: Partial<Record<ReelSymbol, string>> = {
  life: "#ff4466",
  miss: "#6a7a8a",
  shield: "#3dff8a",
  tokens: "#ffd24a",
  secondWind: "#66ccff",
};

function symbolColor(sym: ReelSymbol): string {
  if (sym in SLOT_SYMBOL_COLORS) return SLOT_SYMBOL_COLORS[sym as ReelSymbol]!;
  const cat = PICKUP_DEFS[sym as PowerUpType]?.category;
  return cat ? PICKUP_CATEGORY_COLORS[cat] : "#00f0ff";
}

function symbolSprite(sym: ReelSymbol): string {
  switch (sym) {
    case "life":
      return "pickupLife";
    case "miss":
      return "pickupMiss";
    case "shield":
      return "pickupShield";
    case "tokens":
      return "pickupEconomy";
    case "secondWind":
      return "pickupWind";
    default:
      return pickupSpriteKey(sym as PowerUpType);
  }
}

export function drawSlotSymbol(
  canvas: HTMLCanvasElement,
  sym: ReelSymbol
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 56;
  const h = canvas.clientHeight || 56;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const color = symbolColor(sym);
  drawSprite(ctx, symbolSprite(sym), w / 2 - 10, h / 2 - 10, color, 2);
}

export function mountSlotSymbolCanvases(root: ParentNode): void {
  root.querySelectorAll<HTMLCanvasElement>("[data-slot-symbol]").forEach((canvas) => {
    const sym = canvas.dataset.slotSymbol as ReelSymbol | undefined;
    if (sym) drawSlotSymbol(canvas, sym);
  });
}
