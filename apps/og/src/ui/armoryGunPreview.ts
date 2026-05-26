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

const animators = new WeakMap<HTMLCanvasElement, number>();

function drawBullet(ctx: CanvasRenderingContext2D, b: PreviewBullet): void {
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

function runPreview(
  canvas: HTMLCanvasElement,
  gun: GunVolley,
  shipSprite = "player",
  shipColor = "#00f0ff"
): void {
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

    const ox = shipSprite === "playerTitan" ? px - 11 : px - 7;
    const oy = shipSprite === "playerTitan" ? py - 10 : py - 8;
    drawSprite(ctx, shipSprite, ox, oy, shipColor, 2);

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

function drawStaticPreview(
  canvas: HTMLCanvasElement,
  gun: GunVolley,
  shipSprite = "player",
  shipColor = "#00f0ff"
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const prev = animators.get(canvas);
  if (prev) {
    cancelAnimationFrame(prev);
    animators.delete(canvas);
  }

  const w = canvas.width;
  const h = canvas.height;
  const px = w / 2;
  const py = h - 14;

  ctx.fillStyle = "#060a14";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.35);
  ctx.lineTo(w, h * 0.35);
  ctx.stroke();
  ctx.setLineDash([]);

  const ox = shipSprite === "playerTitan" ? px - 11 : px - 7;
  const oy = shipSprite === "playerTitan" ? py - 10 : py - 8;
  drawSprite(ctx, shipSprite, ox, oy, shipColor, 2);

  for (const b of createVolley(gun, px, py - 8)) {
    drawBullet(ctx, {
      x: b.x,
      y: b.y - 18,
      vy: 0,
      plasma: b.plasma,
      homing: b.homing,
      shockwave: b.shockwave,
    });
  }
}

export interface ArmoryPreviewOptions {
  selectedGun: GunVolley;
  shipSprite: string;
  shipColor: string;
}

/** Mount gun previews — only the selected card animates; others show a static frame. */
export function mountArmoryGunPreviews(
  root: HTMLElement,
  options: ArmoryPreviewOptions
): () => void {
  const canvases = root.querySelectorAll<HTMLCanvasElement>("canvas[data-gun-preview]");
  const cleanups: (() => void)[] = [];

  canvases.forEach((canvas) => {
    const gun = canvas.dataset.gunPreview as GunVolley;
    if (!gun) return;
    const card = canvas.closest("[data-gun]");
    const isSelected = gun === options.selectedGun;

    if (isSelected) {
      runPreview(canvas, gun, options.shipSprite, options.shipColor);
      card?.classList.add("armory-gun-card--previewing");
    } else {
      drawStaticPreview(canvas, gun, options.shipSprite, options.shipColor);
      card?.classList.remove("armory-gun-card--previewing");
    }

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
    const ox = sprite === "playerTitan" ? 4 : sprite === "playerVanguard" ? 5 : 6;
    const oy = sprite === "playerTitan" ? 2 : sprite === "playerVanguard" ? 3 : 4;
    drawSprite(ctx, sprite, ox, oy, color, 2);
  });
}

function statDelta(a: number, b: number): string {
  const d = b - a;
  if (d === 0) return "—";
  return d > 0 ? `+${d}` : String(d);
}

export function renderGunCompareRow(
  label: string,
  equipped: string,
  selected: string,
  highlight = false
): string {
  const cls = highlight ? "armory-compare-val armory-compare-val--better" : "armory-compare-val";
  return `
    <div class="armory-compare-row">
      <span class="armory-compare-label">${label}</span>
      <span class="armory-compare-val">${equipped}</span>
      <span class="${cls}">${selected}</span>
    </div>`;
}

export { statDelta };
