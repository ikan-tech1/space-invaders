export type UpdateFn = (dt: number) => void;
export type DrawFn = () => void;

export class GameLoop {
  private running = false;
  private lastTime = 0;
  private rafId = 0;
  private acc = 0;
  private readonly fixedDt = 1 / 60;

  constructor(
    private onUpdate: UpdateFn,
    private onDraw: DrawFn
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);
    let ft = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (ft > 0.1) ft = 0.1;
    this.acc += ft;
    while (this.acc >= this.fixedDt) {
      this.onUpdate(this.fixedDt);
      this.acc -= this.fixedDt;
    }
    this.onDraw();
  };
}
