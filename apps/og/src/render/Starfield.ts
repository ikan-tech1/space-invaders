export type StarfieldMode = "menu" | "game" | "static";

interface Star {
  x: number;
  y: number;
  size: number;
  layer: 0 | 1 | 2;
  hue: "white" | "cyan" | "gold" | "magenta";
  twinkle: boolean;
  twinklePhase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const STAR_COUNT = 128;
const STAR_COUNT_MENU = 64;
const HUES: Star["hue"][] = ["white", "white", "white", "cyan", "gold", "magenta"];
const HUES_MENU: Star["hue"][] = ["white", "white", "white", "white", "cyan", "gold"];

export class Starfield {
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private shootingStars: ShootingStar[] = [];
  private raf = 0;
  private running = false;
  private mode: StarfieldMode = "menu";
  private reducedMotion = false;
  private nextShootingAt = 0;
  private driftY = 0;
  private driftX = 0;
  private w = 0;
  private h = 0;
  private lastTs = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("Starfield: 2d context unavailable");
    this.ctx = ctx;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.seedStars();
    window.addEventListener("resize", this.onResize);
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
      this.reducedMotion = e.matches;
      if (this.reducedMotion) {
        this.shootingStars = [];
        this.setMode("static");
      } else if (this.mode === "static") {
        this.setMode("menu");
      }
      this.drawFrame(0);
    });
  }

  setMode(mode: StarfieldMode): void {
    if (this.reducedMotion) {
      this.mode = "static";
    } else {
      this.mode = mode;
    }
    if (mode === "menu") {
      this.shootingStars = [];
      this.seedStars();
    } else if (this.stars.length !== STAR_COUNT) {
      this.seedStars();
    }
    this.scheduleShootingStar();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.resize();
    this.lastTs = performance.now();
    this.tick(this.lastTs);
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
  }

  private seedStars(): void {
    const count = this.mode === "menu" ? STAR_COUNT_MENU : STAR_COUNT;
    const hues = this.mode === "menu" ? HUES_MENU : HUES;
    const twinkleChance = this.mode === "menu" ? 0.04 : 0.1;
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const layer = (i % 3) as 0 | 1 | 2;
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: layer === 0 ? 0.6 + Math.random() * 0.4 : layer === 1 ? 1 + Math.random() * 0.6 : 1.4 + Math.random() * 0.8,
        layer,
        hue: hues[Math.floor(Math.random() * hues.length)]!,
        twinkle: Math.random() < twinkleChance,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private onResize = (): void => {
    this.resize();
    if (this.mode === "static" || this.reducedMotion) this.drawFrame(0);
  };

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private scheduleShootingStar(): void {
    const now = performance.now();
    if (this.mode === "static" || this.mode === "menu" || this.reducedMotion) {
      this.nextShootingAt = Infinity;
      return;
    }
    const min = 18_000;
    const max = 42_000;
    this.nextShootingAt = now + min + Math.random() * (max - min);
  }

  private spawnShootingStar(): void {
    const angle = (-0.35 + Math.random() * 0.25) * Math.PI;
    const speed = 280 + Math.random() * 180;
    const startX = Math.random() * this.w * 0.85 + this.w * 0.05;
    const startY = Math.random() * this.h * 0.35;
    this.shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 0.55 + Math.random() * 0.35,
    });
    this.scheduleShootingStar();
  }

  private tick = (ts: number): void => {
    if (!this.running) return;
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;

    if (this.mode !== "static" && !this.reducedMotion) {
      const driftMul = this.mode === "game" ? 0.35 : 0.45;
      this.driftY += dt * 8 * driftMul;
      this.driftX += dt * 2 * driftMul;
      if (this.driftY > 1) this.driftY -= 1;
      if (this.driftX > 1) this.driftX -= 1;

      if (ts >= this.nextShootingAt && this.shootingStars.length < 2) {
        this.spawnShootingStar();
      }

      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        const s = this.shootingStars[i]!;
        s.life += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.life >= s.maxLife) this.shootingStars.splice(i, 1);
      }
    }

    this.drawFrame(ts);
    this.raf = requestAnimationFrame(this.tick);
  };

  private drawFrame(ts: number): void {
    const { ctx, w, h } = this;
    const isMenu = this.mode === "menu";
    ctx.clearRect(0, 0, w, h);

    const nebMul = isMenu ? 0.35 : 1;

    const nebCyan = ctx.createRadialGradient(w * 0.2, h * 0.15, 0, w * 0.2, h * 0.15, w * 0.55);
    nebCyan.addColorStop(0, `rgba(0, 232, 245, ${0.07 * nebMul})`);
    nebCyan.addColorStop(1, "transparent");
    ctx.fillStyle = nebCyan;
    ctx.fillRect(0, 0, w, h);

    const nebGold = ctx.createRadialGradient(w * 0.82, h * 0.72, 0, w * 0.82, h * 0.72, w * 0.45);
    nebGold.addColorStop(0, `rgba(255, 210, 74, ${0.05 * nebMul})`);
    nebGold.addColorStop(1, "transparent");
    ctx.fillStyle = nebGold;
    ctx.fillRect(0, 0, w, h);

    if (!isMenu) {
      const nebMag = ctx.createRadialGradient(w * 0.55, h * 0.88, 0, w * 0.55, h * 0.88, w * 0.5);
      nebMag.addColorStop(0, "rgba(255, 45, 149, 0.04)");
      nebMag.addColorStop(1, "transparent");
      ctx.fillStyle = nebMag;
      ctx.fillRect(0, 0, w, h);
    }

    const parallax = [0.15, 0.45, 0.85];
    const time = ts * 0.001;
    const alphaMul = isMenu ? 0.42 : 1;

    for (const star of this.stars) {
      let px = (star.x + this.driftX * parallax[star.layer]!) % 1;
      let py = (star.y + this.driftY * parallax[star.layer]!) % 1;
      if (px < 0) px += 1;
      if (py < 0) py += 1;

      const sx = px * w;
      const sy = py * h;
      let alpha = (star.layer === 0 ? 0.35 : star.layer === 1 ? 0.55 : 0.75) * alphaMul;

      if (star.twinkle && this.mode !== "static") {
        alpha *= 0.65 + 0.35 * Math.sin(time * 2.2 + star.twinklePhase);
      }

      ctx.fillStyle = colorForHue(star.hue, alpha);
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const s of this.shootingStars) {
      const t = s.life / s.maxLife;
      const fade = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1;
      const len = 72 + (1 - t) * 40;
      const tx = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * len;
      const ty = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * len;

      const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
      grad.addColorStop(0, "rgba(255, 255, 255, 0)");
      grad.addColorStop(0.55, `rgba(200, 245, 255, ${0.55 * fade})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${0.95 * fade})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
  }
}

function colorForHue(hue: Star["hue"], alpha: number): string {
  switch (hue) {
    case "cyan":
      return `rgba(0, 232, 245, ${alpha})`;
    case "gold":
      return `rgba(255, 210, 74, ${alpha})`;
    case "magenta":
      return `rgba(255, 45, 149, ${alpha * 0.85})`;
    default:
      return `rgba(238, 246, 255, ${alpha})`;
  }
}
