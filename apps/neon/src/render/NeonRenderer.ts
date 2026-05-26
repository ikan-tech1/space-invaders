import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  POWERUP_DISPLAY,
  SHIELD_CELL,
  SHIELD_COLS,
  SHIELD_ROWS,
  type WeaponTier,
} from "../config";
import type { Boss, Drone, PowerUpDrop, Shield, UFO } from "../game/entities/types";
import { DRONE_H, DRONE_W } from "../game/formations";
import type { BeamState } from "../weapons/WeaponSystem";
import type { Projectile } from "../weapons/projectiles";
import type { ParticleSystem } from "./ParticleSystem";
import {
  bossSpriteKey,
  drawDroneDamageOverlay,
  drawSprite,
  DRONE_COLORS,
  droneSpriteLayout,
  pickupColor,
  pickupSpriteKey,
  playerSpriteKey,
} from "./SpriteDrawer";
import { VfxRenderer } from "./VfxRenderer";

export class NeonRenderer {
  private nebulaPhase = 0;
  private scanlinePhase = 0;
  private stars: { x: number; y: number; z: number; s: number }[] = [];
  readonly vfx = new VfxRenderer();

  constructor(private ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        z: Math.random(),
        s: 0.5 + Math.random() * 2,
      });
    }
  }

  resize(lw: number, lh: number, dpr: number): void {
    const c = this.ctx.canvas;
    c.width = Math.floor(lw * dpr);
    c.height = Math.floor(lh * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  drawBackground(dt: number): void {
    const { ctx } = this;
    this.nebulaPhase += dt;
    this.scanlinePhase += dt * 0.5;
    const g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    g.addColorStop(0, "#0a0820");
    g.addColorStop(0.5, "#06060f");
    g.addColorStop(1, "#120818");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.globalAlpha = 0.15 + Math.sin(this.nebulaPhase) * 0.05;
    const ng = ctx.createRadialGradient(
      CANVAS_WIDTH * 0.3,
      120,
      10,
      CANVAS_WIDTH * 0.5,
      200,
      200
    );
    ng.addColorStop(0, COLORS.magenta);
    ng.addColorStop(1, "transparent");
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 0.1 + Math.sin(this.nebulaPhase * 0.7 + 1) * 0.04;
    const ng2 = ctx.createRadialGradient(
      CANVAS_WIDTH * 0.75,
      280,
      20,
      CANVAS_WIDTH * 0.7,
      320,
      180
    );
    ng2.addColorStop(0, COLORS.accent);
    ng2.addColorStop(1, "transparent");
    ctx.fillStyle = ng2;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 1;

    for (const s of this.stars) {
      s.y += (30 + s.z * 80) * dt;
      if (s.y > CANVAS_HEIGHT) {
        s.y = 0;
        s.x = Math.random() * CANVAS_WIDTH;
      }
      ctx.fillStyle = `rgba(200, 220, 255, ${0.3 + s.z * 0.7})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    ctx.fillStyle = "rgba(0, 232, 255, 0.025)";
    for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
      if ((y + Math.floor(this.scanlinePhase * 10)) % 8 === 0) {
        ctx.fillRect(0, y, CANVAS_WIDTH, 1);
      }
    }
  }

  drawPlayer(
    x: number,
    y: number,
    tier: WeaponTier,
    shield: number,
    invuln: boolean,
    cloneOffsets: number[] = []
  ): void {
    const positions = [0, ...cloneOffsets];
    for (const off of positions) {
      this.drawSinglePlayer(x + off, y, tier, shield, invuln);
    }
  }

  private drawSinglePlayer(
    x: number,
    y: number,
    tier: WeaponTier,
    shield: number,
    invuln: boolean
  ): void {
    if (invuln && Math.floor(Date.now() / 80) % 2 === 0) return;
    const { ctx } = this;
    const spriteKey = playerSpriteKey(tier);
    const spriteW = spriteKey === "playerGauss" ? 9 : spriteKey === "playerBeam" ? 7 : 7;
    const sx = x - (spriteW * 2) / 2;
    const sy = y - 12;

    if (shield > 0) {
      ctx.beginPath();
      ctx.arc(x, y - 2, 26, Math.PI, 0);
      ctx.strokeStyle = `rgba(93, 255, 176, ${0.3 + shield * 0.5})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = COLORS.shield;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    drawSprite(ctx, spriteKey, sx, sy, COLORS.accent, 2);
    if (tier >= 3) {
      ctx.fillStyle = COLORS.gold;
      ctx.fillRect(x - 10, y - 16, 4, 6);
      ctx.fillRect(x + 6, y - 16, 4, 6);
      ctx.fillRect(x - 1, y - 18, 2, 4);
    }
  }

  drawDrone(d: Drone, animTick: number): void {
    if (!d.alive) return;
    const frame = Math.floor(animTick * 4) % 2;
    const scale = 2;
    const { key, sx, sy, w, h } = droneSpriteLayout(
      d.droneClass,
      frame,
      d.x,
      d.y,
      DRONE_W,
      DRONE_H,
      scale
    );
    const color = DRONE_COLORS[d.droneClass];
    const { ctx } = this;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    drawSprite(ctx, key, sx, sy, color, scale);
    ctx.shadowBlur = 0;
    ctx.restore();
    const maxHp =
      d.droneClass === "bulwark" ? 2 : d.droneClass === "elite" ? 2 : 1;
    drawDroneDamageOverlay(ctx, sx, sy, w, h, d.hp, maxHp);
  }

  drawShields(shields: Shield[]): void {
    for (const sh of shields) {
      for (let r = 0; r < SHIELD_ROWS; r++) {
        for (let c = 0; c < SHIELD_COLS; c++) {
          if (!sh.cells[r]![c]) continue;
          const px = sh.x + c * SHIELD_CELL;
          const py = sh.y + r * SHIELD_CELL;
          this.ctx.fillStyle = "rgba(93, 255, 176, 0.9)";
          this.ctx.fillRect(px, py, SHIELD_CELL - 1, SHIELD_CELL - 1);
        }
      }
    }
  }

  drawProjectile(p: Projectile): void {
    this.vfx.drawProjectile(this.ctx, p);
  }

  drawBeam(beam: BeamState | null, heatPct = 0): void {
    this.vfx.drawBeam(this.ctx, beam, heatPct);
  }

  drawGaussRecoil(x: number, y: number, amount: number): void {
    this.vfx.drawGaussRecoil(this.ctx, x, y, amount);
  }

  drawGaussMuzzle(): void {
    this.vfx.drawGaussMuzzle(this.ctx);
  }

  drawShockwaves(): void {
    this.vfx.drawShockwaves(this.ctx);
  }

  drawPowerUp(p: PowerUpDrop): void {
    if (!p.active) return;
    const { ctx } = this;
    const key = pickupSpriteKey(p.type);
    const color = pickupColor(p.type);
    const pulse = 1 + Math.sin(p.rot * 2) * 0.18;
    const scale = 2.6 * pulse;
    const w = 5 * scale;
    const info = POWERUP_DISPLAY[p.type];

    if (!this.vfx.reducedFx) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35 + Math.sin(p.rot * 3) * 0.15;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, w * 0.75 + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawSprite(ctx, key, p.x - w / 2, p.y - w / 2, color, scale);

    if (info) {
      ctx.save();
      ctx.font = "600 8px SF Mono, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85 + Math.sin(p.rot * 2) * 0.1;
      ctx.fillText(info.name.toUpperCase(), p.x, p.y + w / 2 + 10);
      ctx.restore();
    }
  }

  drawUFO(u: UFO | null): void {
    if (!u?.active) return;
    drawSprite(this.ctx, "ufo", u.x - 18, u.y - 10, COLORS.gold, 2);
  }

  drawBoss(b: Boss | null): void {
    if (!b?.active) return;
    const sc = b.kind === "mini" ? 3 : 4;
    const sx = b.x - (b.kind === "mini" ? 13 : 18);
    const sy = b.y - (b.kind === "mini" ? 14 : 18);
    const color = b.kind === "mini" ? COLORS.magenta : COLORS.danger;
    drawSprite(this.ctx, bossSpriteKey(b.kind), sx, sy, color, sc);

    const pct = b.hp / b.maxHp;
    const barW = b.kind === "mini" ? 80 : 110;
    const barY = b.y - (b.kind === "mini" ? 48 : 56);
    this.ctx.fillStyle = "rgba(0,0,0,0.72)";
    this.ctx.fillRect(b.x - barW / 2 - 1, barY - 1, barW + 2, 8);
    this.ctx.fillStyle = "rgba(255,255,255,0.15)";
    this.ctx.fillRect(b.x - barW / 2, barY, barW, 6);
    this.ctx.fillStyle = b.phase >= 2 ? COLORS.danger : COLORS.magenta;
    this.ctx.fillRect(b.x - barW / 2, barY, barW * pct, 6);
    if (b.phase >= 2 && !this.vfx.reducedFx) {
      this.ctx.strokeStyle = `rgba(255,68,102,${0.4 + Math.sin(performance.now() * 0.008) * 0.3})`;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(b.x - barW / 2 - 3, barY - 3, barW + 6, 12);
    }
  }

  drawParticles(ps: ParticleSystem): void {
    ps.draw(this.ctx);
  }

  applyShake(x: number, y: number): void {
    this.ctx.save();
    this.ctx.translate(x, y);
  }

  clearShake(): void {
    this.ctx.restore();
  }
}
