import { COLORS } from "../config";
import type { AccessReward } from "../progression/hangarCodes";
import type { BeamState } from "../weapons/WeaponSystem";
import type { Projectile } from "../weapons/projectiles";

const TRAIL_COLORS: Record<AccessReward, string> = {
  cyanTrail: COLORS.accent,
  magentaTrail: COLORS.magenta,
  ghostTrail: "#e8f4ff",
};

const PLASMA_TINTS = ["#b366ff", "#00e8ff", "#ff3d9a", "#7bff6e", "#ffcc33"];

interface ShockwaveRing {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  maxLife: number;
  color: string;
}

export class VfxRenderer {
  gaussMuzzleTimer = 0;
  gaussMuzzleX = 0;
  gaussMuzzleY = 0;
  shockwaves: ShockwaveRing[] = [];
  reducedFx = false;
  playerTrail: AccessReward | null = null;

  setPlayerTrail(trail: AccessReward | null): void {
    this.playerTrail = trail;
  }

  triggerGaussMuzzle(x: number, y: number): void {
    if (this.reducedFx) return;
    this.gaussMuzzleTimer = 0.14;
    this.gaussMuzzleX = x;
    this.gaussMuzzleY = y;
  }

  triggerGaussImpact(x: number, y: number): void {
    if (this.reducedFx) return;
    this.shockwaves.push({
      x,
      y,
      r: 4,
      maxR: 38,
      life: 0.28,
      maxLife: 0.28,
      color: COLORS.gold,
    });
    this.shockwaves.push({
      x,
      y,
      r: 2,
      maxR: 22,
      life: 0.18,
      maxLife: 0.18,
      color: COLORS.accent,
    });
  }

  update(dt: number): void {
    if (this.gaussMuzzleTimer > 0) this.gaussMuzzleTimer -= dt;
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i]!;
      s.life -= dt;
      s.r += (s.maxR - s.r) * dt * 8;
      if (s.life <= 0) this.shockwaves.splice(i, 1);
    }
  }

  drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile): void {
    if (!p.active) return;
    const maxTrail =
      this.playerTrail === "ghostTrail" ? 16 : p.kind === "gauss" ? 12 : 10;
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > maxTrail) p.trail.shift();

    const trailColor =
      p.fromPlayer && this.playerTrail
        ? TRAIL_COLORS[this.playerTrail]
        : p.fromPlayer
          ? COLORS.accent
          : COLORS.danger;
    const trailAlpha = this.playerTrail === "ghostTrail" ? 0.55 : 0.45;

    if (!this.reducedFx) {
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i]!;
        ctx.globalAlpha = (i / p.trail.length) * trailAlpha;
        ctx.fillStyle = p.fromPlayer ? trailColor : COLORS.danger;
        const tr =
          p.kind === "gauss" ? p.radius * 0.65 : p.radius * 0.55;
        ctx.beginPath();
        ctx.arc(t.x, t.y, tr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    if (p.kind === "gauss") {
      const r = p.radius;
      const h = r * 2.4;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      if (!this.reducedFx) {
        ctx.shadowColor = COLORS.gold;
        ctx.shadowBlur = 18;
      }
      const body = ctx.createLinearGradient(p.x, p.y + h * 0.5, p.x, p.y - h * 0.5);
      body.addColorStop(0, "rgba(255,204,51,0.2)");
      body.addColorStop(0.35, COLORS.gold);
      body.addColorStop(0.55, "#fff");
      body.addColorStop(0.75, COLORS.amber);
      body.addColorStop(1, "rgba(255,170,34,0.3)");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.roundRect(p.x - r * 0.75, p.y - h * 0.5, r * 1.5, h, 3);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(p.x, p.y - h * 0.35, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }

    if (p.kind === "ion") {
      const halfW = p.span ?? 8;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = COLORS.accent;
      ctx.lineWidth = 4;
      ctx.shadowColor = COLORS.accent;
      ctx.shadowBlur = this.reducedFx ? 0 : 14;
      ctx.beginPath();
      ctx.moveTo(p.x - halfW, p.y + 18);
      ctx.lineTo(p.x + halfW, p.y - 36);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(p.x, p.y - 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }

    if (p.kind === "nova") {
      const pulse = 1 + Math.sin(performance.now() * 0.012) * 0.12;
      const r = p.radius * pulse;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
      ctx.stroke();
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, "#fff");
      g.addColorStop(0.25, COLORS.magenta);
      g.addColorStop(0.7, "rgba(255,61,154,0.35)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (p.kind === "singularity") {
      const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.18;
      const r = p.radius * pulse;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(180,80,255,0.55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, "#fff");
      g.addColorStop(0.2, "#8800cc");
      g.addColorStop(0.55, "#440066");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (p.kind === "enemy" || p.kind === "enemyAimed") {
      ctx.fillStyle = p.kind === "enemyAimed" ? COLORS.gold : COLORS.danger;
      if (!this.reducedFx) {
        ctx.shadowColor = ctx.fillStyle as string;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      return;
    }

    const plasmaColor =
      p.kind === "plasma" && p.tint != null
        ? PLASMA_TINTS[p.tint % PLASMA_TINTS.length]!
        : COLORS.plasma;

    ctx.fillStyle = p.fromPlayer
      ? p.kind === "plasma"
        ? plasmaColor
        : this.playerTrail === "magentaTrail"
          ? COLORS.magenta
          : this.playerTrail === "ghostTrail"
            ? "#e8f4ff"
            : COLORS.accent
      : COLORS.danger;

    if (!this.reducedFx) {
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.shadowBlur = p.kind === "pulse" ? 8 : 6;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    if (p.kind === "pulse" && !this.reducedFx) {
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0;
  }

  drawBeam(ctx: CanvasRenderingContext2D, beam: BeamState | null, heatPct = 0): void {
    if (!beam?.active) return;
    const top = beam.y - beam.length;
    const width = beam.width + beam.ramp * 0.5;
    const flicker = 0.85 + Math.sin(performance.now() * 0.04) * 0.15;
    const heatGlow = heatPct > 0.75 ? 1 + (heatPct - 0.75) * 2 : 1;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = flicker;
    const g = ctx.createLinearGradient(beam.x, top, beam.x, beam.y);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.15, `rgba(0,232,255,${0.7 + beam.ramp * 0.2})`);
    g.addColorStop(0.5, `rgba(255,61,154,${0.55 + beam.ramp * 0.25})`);
    g.addColorStop(0.85, "rgba(255,255,255,0.95)");
    g.addColorStop(1, "#fff");
    ctx.fillStyle = g;
    if (!this.reducedFx) {
      ctx.shadowColor = heatPct > 0.85 ? COLORS.danger : COLORS.accent;
      ctx.shadowBlur = 12 * heatGlow;
    }
    ctx.fillRect(beam.x - width / 2, top, width, beam.length);
    ctx.strokeStyle = heatPct > 0.85 ? "rgba(255,100,100,0.8)" : "#fff";
    ctx.lineWidth = heatPct > 0.85 ? 2 : 1;
    ctx.strokeRect(beam.x - width / 2, top, width, beam.length);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawGaussRecoil(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    amount: number
  ): void {
    if (amount <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const kick = amount * 6;
    ctx.fillStyle = `rgba(255,204,51,${amount * 0.8})`;
    ctx.fillRect(x - 3, y - 14 - kick, 6, 8 + kick);
    ctx.fillStyle = `rgba(255,255,255,${amount * 0.5})`;
    ctx.fillRect(x - 8, y - 8, 16, 3);
    ctx.restore();
  }

  drawGaussMuzzle(ctx: CanvasRenderingContext2D): void {
    if (this.gaussMuzzleTimer <= 0 || this.reducedFx) return;
    const alpha = this.gaussMuzzleTimer / 0.14;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha * 0.7;
    const g = ctx.createRadialGradient(
      this.gaussMuzzleX,
      this.gaussMuzzleY - 24,
      0,
      this.gaussMuzzleX,
      this.gaussMuzzleY - 24,
      28
    );
    g.addColorStop(0, "#fff");
    g.addColorStop(0.4, COLORS.gold);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.gaussMuzzleX, this.gaussMuzzleY - 24, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawShockwaves(ctx: CanvasRenderingContext2D): void {
    if (this.reducedFx) return;
    for (const s of this.shockwaves) {
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = alpha * 0.75;
      ctx.lineWidth = 2 + (1 - alpha) * 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
