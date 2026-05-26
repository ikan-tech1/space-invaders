export class JuiceController {
  shakeTimer = 0;
  shakeX = 0;
  shakeY = 0;
  hitStopTimer = 0;
  reducedFx = false;

  update(dt: number): void {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return;
    }
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const amp = this.reducedFx ? 4 : 10;
      this.shakeX = (Math.random() - 0.5) * amp;
      this.shakeY = (Math.random() - 0.5) * amp;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  shake(duration = 0.2, intensity = 1): void {
    if (this.reducedFx) return;
    this.shakeTimer = Math.max(this.shakeTimer, duration * intensity);
  }

  hitStop(duration = 0.05): void {
    if (this.reducedFx) return;
    this.hitStopTimer = Math.max(this.hitStopTimer, duration);
  }

  get timeScale(): number {
    return this.hitStopTimer > 0 ? 0 : 1;
  }
}
