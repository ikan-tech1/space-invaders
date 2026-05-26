import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  SHIELD_CELL,
  SHIELD_COLS,
  SHIELD_ROWS,
} from "../config";
import type { Boss, Bullet, PowerUpDrop, Shield, UFO } from "../game/entities/types";
import type { Alien } from "../game/entities/types";
import { ALIEN_COLORS, alienSpriteKey, drawSprite, pickupSpriteKey } from "./SpriteDrawer";
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

  drawAliens(aliens: Alien[], animTick: number): void {
    const frame = Math.floor(animTick * 4) % 2;
    for (const a of aliens) {
      if (!a.alive) continue;
      drawSprite(
        this.ctx,
        alienSpriteKey(a.type, frame),
        a.x,
        a.y,
        ALIEN_COLORS[a.type] ?? COLORS.alien1,
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
    const scale = mini ? 0.65 : 1;
    ctx.fillStyle = mini ? COLORS.magenta : COLORS.boss;
    ctx.beginPath();
    ctx.moveTo(x, y - 28 * scale);
    ctx.lineTo(x + 55 * scale, y + 20 * scale);
    ctx.lineTo(x + 20 * scale, y + 10 * scale);
    ctx.lineTo(x, y + 28 * scale);
    ctx.lineTo(x - 20 * scale, y + 10 * scale);
    ctx.lineTo(x - 55 * scale, y + 20 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.magenta;
    ctx.lineWidth = 2;
    ctx.stroke();

    const hpPct = boss.hp / boss.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 50, y - 42, 100, 8);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x - 50, y - 42, 100 * hpPct, 8);

    ctx.fillStyle = COLORS.accent;
    const wpX = x + (boss.weakPoint === 0 ? -25 : boss.weakPoint === 1 ? 0 : 25);
    ctx.beginPath();
    ctx.arc(wpX, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPowerUp(p: PowerUpDrop): void {
    if (!p.active) return;
    const colors: Record<string, string> = {
      rapid: COLORS.accent,
      spread: COLORS.magenta,
      shield: COLORS.shield,
      slow: COLORS.gold,
      plasma: "#ff66cc",
      bunker: "#88aa44",
      clone: "#cc66ff",
      twin: "#66ccff",
      triple: "#aaddff",
      quint: "#ffaa44",
      hex: "#ff6622",
    };
    const color = colors[p.type] ?? COLORS.accent;
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
