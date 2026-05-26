import { createVolley, type GunVolley } from "../game/weaponVolley";
import { drawSprite } from "../render/SpriteDrawer";

interface PreviewBullet {
  x: number;
  y: number;
  vy: number;
  plasma?: boolean;
  homing?: boolean;
  shockwave?: boolean;
}

const PREVIEW_GUNS: GunVolley[] = [
  "single",
  "double",
  "twin",
  "scatter",
  "burst2",
  "burst3",
  "homing",
  "shockwave",
  "triple",
];

const animators = new WeakMap<HTMLCanvasElement, number>();

function drawBullet(
  ctx: CanvasRenderingContext2D,
  b: PreviewBullet
): void {
  if (b.plasma) {
    ctx.fillStyle = "#ff66cc";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (b.shockwave) {
    ctx.fillStyle = "rgba(123, 255, 110, 0.65)";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (b.homing) {
    ctx.fillStyle = "#ff2d95";
    ctx.fillRect(b.x - 1, b.y - 4, 3, 6);
    return;
  }
  ctx.fillStyle = "#00f0ff";
  ctx.fillRect(b.x - 1, b.y - 5, 3, 8);
}

function runPreview(canvas: HTMLCanvasElement, gun: GunVolley): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const px = w / 2;
  const py = h - 14;
  let bullets: PreviewBullet[] = [];
  let fireTimer = 0;
  let frame = 0;

  const prev = animators.get(canvas);
  if (prev) cancelAnimationFrame(prev);

  const tick = (): void => {
    frame = requestAnimationFrame(tick);
    animators.set(canvas, frame);

    ctx.fillStyle = "#060a14";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.35);
    ctx.lineTo(w, h * 0.35);
    ctx.stroke();
    ctx.setLineDash([]);

    drawSprite(ctx, "player", px - 7, py - 8, "#00f0ff", 2);

    fireTimer -= 1 / 60;
    if (fireTimer <= 0) {
      fireTimer = gun === "shockwave" ? 0.55 : gun === "homing" ? 0.45 : 0.38;
      const volley = createVolley(gun, px, py);
      for (const b of volley) {
        bullets.push({
          x: b.x,
          y: b.y,
          vy: b.vy * 0.35,
          plasma: b.plasma,
          homing: b.homing,
          shockwave: b.shockwave,
        });
      }
    }

    bullets = bullets.filter((b) => {
      b.y += b.vy * (1 / 60);
      drawBullet(ctx, b);
      return b.y > 4;
    });
  };

  tick();
}

/** Mount animated firing-range previews on gun cards in the armory. */
export function mountArmoryGunPreviews(root: HTMLElement): () => void {
  const canvases = root.querySelectorAll<HTMLCanvasElement>("canvas[data-gun-preview]");
  const cleanups: (() => void)[] = [];

  canvases.forEach((canvas) => {
    const gun = canvas.dataset.gunPreview as GunVolley;
    if (!gun) return;
    runPreview(canvas, gun);
    cleanups.push(() => {
      const id = animators.get(canvas);
      if (id) cancelAnimationFrame(id);
      animators.delete(canvas);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

export function mountArmoryShipSprites(root: HTMLElement): void {
  root.querySelectorAll<HTMLCanvasElement>("canvas[data-ship-preview]").forEach((canvas) => {
    const sprite = canvas.dataset.shipPreview;
    const color = canvas.dataset.shipColor ?? "#00f0ff";
    if (!sprite) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#060a14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const ox = sprite === "playerTitan" ? 4 : 6;
    const oy = sprite === "playerTitan" ? 2 : 4;
    drawSprite(ctx, sprite, ox, oy, color, 2);
  });
}

export { PREVIEW_GUNS };
