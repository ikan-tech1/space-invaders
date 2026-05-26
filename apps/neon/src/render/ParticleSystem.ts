export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface RingParticle {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  maxLife: number;
  color: string;
  lineWidth: number;
}

export class ParticleSystem {
  particles: Particle[] = [];
  rings: RingParticle[] = [];
  reduced = false;

  burst(x: number, y: number, color: string, n = 16): void {
    const c = this.reduced ? Math.floor(n / 3) : n;
    for (let i = 0; i < c; i++) {
      const a = (Math.PI * 2 * i) / c + Math.random();
      const sp = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.3 + Math.random() * 0.5,
        maxLife: 0.8,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  shockwave(x: number, y: number, color: string): void {
    if (this.reduced) return;
    this.rings.push({
      x,
      y,
      r: 6,
      maxR: 42,
      life: 0.32,
      maxLife: 0.32,
      color,
      lineWidth: 3,
    });
  }

  deflectSpark(x: number, y: number): void {
    if (this.reduced) return;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.15 + Math.random() * 0.2,
        maxLife: 0.35,
        color: i % 2 === 0 ? "#ffcc33" : "#00e8ff",
        size: 2 + Math.random() * 3,
      });
    }
  }

  engineTrail(x: number, y: number): void {
    if (this.reduced) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + 8,
      vx: (Math.random() - 0.5) * 20,
      vy: 40 + Math.random() * 60,
      life: 0.25,
      maxLife: 0.35,
      color: "#00e8ff",
      size: 3,
    });
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]!;
      r.life -= dt;
      r.r += (r.maxR - r.r) * dt * 10;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const r of this.rings) {
      const alpha = Math.max(0, r.life / r.maxLife);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = alpha * 0.8;
      ctx.lineWidth = r.lineWidth * alpha;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
