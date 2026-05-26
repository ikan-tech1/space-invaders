import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  getPickupDef,
  PICKUP_CATEGORY_COLORS,
  SHIELD_CELL,
  SHIELD_COLS,
  SHIELD_ROWS,
} from "../config";
import type { Boss, Bullet, PowerUpDrop, Shield, UFO } from "../game/entities/types";
import type { Alien } from "../game/entities/types";
import { alienColorForFormation, alienSpriteKey, drawSprite, pickupSpriteKey } from "./SpriteDrawer";
import type { FormationType } from "../config";
import type { ParticleSystem } from "./ParticleSystem";

export class CanvasRenderer {
  private stars: { x: number; y: number; z: number; speed: number }[] = [];
  private scanlinePhase = 0;

  constructor(private ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        z: Math.random(),
        speed: 20 + Math.random() * 60,
      });
    }
  }

  resize(logicalW: number, logicalH: number, dpr: number): void {
    const canvas = this.ctx.canvas;
    canvas.width = Math.floor(logicalW * dpr);
    canvas.height = Math.floor(logicalH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  drawBackground(dt: number): void {
    const { ctx } = this;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const s of this.stars) {
      s.y += s.speed * dt * (0.3 + s.z);
      if (s.y > CANVAS_HEIGHT) {
        s.y = 0;
        s.x = Math.random() * CANVAS_WIDTH;
      }
      const size = 1 + s.z * 2;
      ctx.fillStyle = `rgba(200, 230, 255, ${0.2 + s.z * 0.6})`;
      ctx.fillRect(s.x, s.y, size, size);
    }

    this.scanlinePhase += dt * 0.5;
    ctx.fillStyle = "rgba(0, 240, 255, 0.03)";
    for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
      if ((y + Math.floor(this.scanlinePhase * 10)) % 8 === 0) {
        ctx.fillRect(0, y, CANVAS_WIDTH, 1);
      }
    }
  }

  drawShields(shields: Shield[]): void {
    const { ctx } = this;
    for (const shield of shields) {
      for (let r = 0; r < SHIELD_ROWS; r++) {
        for (let c = 0; c < SHIELD_COLS; c++) {
          if (!shield.cells[r]![c]) continue;
          ctx.fillStyle = COLORS.shield;
          ctx.fillRect(
            shield.x + c * SHIELD_CELL,
            shield.y + r * SHIELD_CELL,
            SHIELD_CELL - 1,
            SHIELD_CELL - 1
          );
        }
      }
    }
  }

  drawAliens(aliens: Alien[], animTick: number, formation: FormationType = "classic"): void {
    const frame = Math.floor(animTick * 4) % 2;
    for (const a of aliens) {
      if (!a.alive) continue;
      drawSprite(
        this.ctx,
        alienSpriteKey(a.type, frame),
        a.x,
        a.y,
        alienColorForFormation(a.type, formation),
        2
      );
    }
  }

  drawPlayer(
    x: number,
    y: number,
    invulnBlink: boolean,
    shipColor = COLORS.player,
    spriteKey = "player"
  ): void {
    if (invulnBlink && Math.floor(Date.now() / 100) % 2 === 0) return;
    const ox = spriteKey === "playerTitan" ? 8 : 7;
    const oy = spriteKey === "playerTitan" ? 10 : 8;
    drawSprite(this.ctx, spriteKey, x - ox, y - oy, shipColor, 2);
  }

  drawBullets(bullets: Bullet[]): void {
    for (const b of bullets) {
      if (!b.active) continue;
      if (b.plasma) {
        this.ctx.fillStyle = "#ff66cc";
        this.ctx.shadowColor = "#ffd24a";
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        continue;
      }
      if (b.shockwave) {
        this.ctx.fillStyle = "rgba(123, 255, 110, 0.55)";
        this.ctx.shadowColor = "#7bff6e";
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        continue;
      }
      if (b.homing) {
        this.ctx.fillStyle = "#ff2d95";
        this.ctx.shadowColor = "#ff2d95";
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(b.x, b.y - 5);
        this.ctx.lineTo(b.x + 4, b.y + 4);
        this.ctx.lineTo(b.x - 4, b.y + 4);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        continue;
      }
      const w = 4;
      const h = 10;
      this.ctx.fillStyle = b.fromPlayer ? COLORS.accent : COLORS.danger;
      if (b.fromPlayer) {
        this.ctx.shadowColor = COLORS.accent;
        this.ctx.shadowBlur = 6;
      }
      this.ctx.fillRect(b.x - w / 2, b.y - h / 2, w, h);
      this.ctx.shadowBlur = 0;
    }
  }

  drawUFO(ufo: UFO | null): void {
    if (!ufo?.active) return;
    drawSprite(this.ctx, "ufo", ufo.x - 9, ufo.y - 5, COLORS.ufo, 2);
  }

  drawBoss(boss: Boss | null): void {
    if (!boss?.active) return;
    const { ctx } = this;
    const x = boss.x;
    const y = boss.y;
    const mini = boss.kind === "mini";
    const sprite = boss.spriteKey || (mini ? "bossMini" : "bossBig");
    const color = boss.color || (mini ? COLORS.magenta : COLORS.boss);
    const accent = boss.accent || COLORS.gold;
    const scale = mini ? 2 : 3;
    const gridW = mini ? 7 : 9;
    const ox = (gridW * scale) / 2;
    const oy = mini ? 20 : 28;
    drawSprite(ctx, sprite, x - ox, y - oy, color, scale);

    if (boss.phase === 2) {
      ctx.save();
      ctx.strokeStyle = `${accent}88`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 8, mini ? 34 : 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (boss.telegraphTimer > 0) {
      const maxT = boss.phase === 2 ? 0.65 : 0.8;
      const intensity = Math.min(1, boss.telegraphTimer / maxT);
      const pulse = 0.35 + Math.sin(Date.now() / 60) * 0.3 * intensity;
      const radius = (mini ? 38 : 52) + (1 - intensity) * 12;

      ctx.save();
      ctx.strokeStyle = `rgba(255, 68, 102, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y + 10, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(255, 210, 74, ${pulse * 0.75})`;
      ctx.beginPath();
      ctx.arc(x, y + 10, radius + 10, 0, Math.PI * 2);
      ctx.stroke();

      const chevronY = y + (mini ? 52 : 68);
      for (let i = -2; i <= 2; i++) {
        const cx = x + i * (mini ? 16 : 22);
        ctx.fillStyle = `rgba(255, 68, 102, ${0.25 + pulse * 0.55})`;
        ctx.beginPath();
        ctx.moveTo(cx, chevronY);
        ctx.lineTo(cx - 6, chevronY - 10);
        ctx.lineTo(cx + 6, chevronY - 10);
        ctx.closePath();
        ctx.fill();
      }

      const vignette = pulse * 0.18 * intensity;
      ctx.fillStyle = `rgba(255, 68, 102, ${vignette})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, 28);
      ctx.fillRect(0, CANVAS_HEIGHT - 36, CANVAS_WIDTH, 36);
      ctx.restore();
    }

    const hpPct = boss.hp / boss.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 50, y - (mini ? 36 : 48), 100, 8);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x - 50, y - (mini ? 36 : 48), 100 * hpPct, 8);

    ctx.fillStyle = COLORS.accent;
    ctx.shadowColor = COLORS.accent;
    ctx.shadowBlur = 10;
    const wpX = x + (boss.weakPoint === 0 ? -25 : boss.weakPoint === 1 ? 0 : 25);
    ctx.beginPath();
    ctx.arc(wpX, y + 8, mini ? 6 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawPowerUp(p: PowerUpDrop): void {
    if (!p.active) return;
    const def = getPickupDef(p.type);
    const color = PICKUP_CATEGORY_COLORS[def.category];
    const bob = Math.sin(Date.now() / 200) * 2;
    drawSprite(
      this.ctx,
      pickupSpriteKey(p.type),
      p.x - 5,
      p.y - 5 + bob,
      color,
      2
    );
    const pulse = 0.55 + Math.sin(Date.now() / 160) * 0.25;
    this.ctx.strokeStyle = color;
    this.ctx.globalAlpha = pulse * 0.5;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y + bob, 16, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.globalAlpha = pulse * 0.25;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y + bob, 22, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
    this.ctx.lineWidth = 1;
  }

  drawParticles(particles: ParticleSystem): void {
    particles.draw(this.ctx);
  }

  applyShake(offsetX: number, offsetY: number): void {
    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
  }

  clearShake(): void {
    this.ctx.restore();
  }
}
