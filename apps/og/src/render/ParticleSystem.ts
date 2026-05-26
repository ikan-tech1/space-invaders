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

export class ParticleSystem {
  particles: Particle[] = [];
  reducedMotion = false;

  setReducedMotion(v: boolean): void {
    this.reducedMotion = v;
  }

  burst(x: number, y: number, color: string, count = 12): void {
    const n = this.reducedMotion ? Math.floor(count / 3) : count;
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  magnetSpark(x: number, y: number, color: string): void {
    if (this.reducedMotion) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 40;
    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      life: 0.15 + Math.random() * 0.2,
      maxLife: 0.35,
      color,
      size: 1.5 + Math.random() * 2,
    });
  }

  collectTrail(fromX: number, fromY: number, toX: number, toY: number, color: string): void {
    const steps = this.reducedMotion ? 4 : 8;
    for (let i = 0; i < steps; i++) {
      const t = (i + Math.random() * 0.4) / steps;
      this.particles.push({
        x: fromX + (toX - fromX) * t,
        y: fromY + (toY - fromY) * t,
        vx: (Math.random() - 0.5) * 40,
        vy: -60 - Math.random() * 40,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5,
        color,
        size: 2 + Math.random() * 2,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
