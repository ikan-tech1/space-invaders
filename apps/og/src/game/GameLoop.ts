export type UpdateFn = (dt: number) => void;
export type DrawFn = () => void;

export class GameLoop {
  private running = false;
  private lastTime = 0;
  private rafId = 0;
  private accumulator = 0;
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
    let frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (frameTime > 0.1) frameTime = 0.1;

    this.accumulator += frameTime;
    while (this.accumulator >= this.fixedDt) {
      this.onUpdate(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }
    this.onDraw();
  };
}
