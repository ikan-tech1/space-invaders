export type SfxType =
  | "shoot"
  | "enemyShoot"
  | "explosion"
  | "alienStep"
  | "ufo"
  | "powerup"
  | "waveClear"
  | "gameOver"
  | "bossHit"
  | "playerHit"
  | "slotSpin"
  | "slotWin"
  | "slotReelStop"
  | "combo"
  | "highScore";

export class AudioManager {
  private ctx: AudioContext | null = null;
  volume = 0.6;
  muted = false;
  private stepPhase = 0;

  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
  }

  resume(): void {
    this.init();
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private beep(freq: number, duration: number, type: OscillatorType = "square", gain = 0.15): void {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain * this.volume;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  play(type: SfxType): void {
    this.resume();
    switch (type) {
      case "shoot":
        this.beep(880, 0.06, "square", 0.08);
        break;
      case "enemyShoot":
        this.beep(180, 0.1, "sawtooth", 0.06);
        break;
      case "explosion":
        this.beep(120, 0.2, "sawtooth", 0.12);
        this.beep(60, 0.25, "sine", 0.1);
        break;
      case "alienStep":
        this.stepPhase = 1 - this.stepPhase;
        this.beep(this.stepPhase ? 55 : 48, 0.04, "square", 0.05);
        break;
      case "ufo":
        this.beep(440, 0.15, "sine", 0.07);
        this.beep(660, 0.15, "sine", 0.05);
        break;
      case "powerup":
        this.beep(523, 0.08);
        this.beep(784, 0.1);
        break;
      case "waveClear":
        this.beep(392, 0.1);
        this.beep(523, 0.1);
        this.beep(659, 0.15);
        break;
      case "gameOver":
        this.beep(220, 0.3, "sawtooth", 0.1);
        this.beep(110, 0.5, "sine", 0.12);
        break;
      case "bossHit":
        this.beep(200, 0.08, "sawtooth", 0.1);
        break;
      case "playerHit":
        this.beep(150, 0.25, "sawtooth", 0.12);
        break;
      case "slotSpin":
        this.beep(320, 0.05, "square", 0.06);
        this.beep(420, 0.05, "square", 0.05);
        this.beep(520, 0.05, "square", 0.04);
        break;
      case "slotWin":
        this.beep(523, 0.1);
        this.beep(659, 0.1);
        this.beep(784, 0.14);
        break;
      case "slotReelStop":
        this.beep(280 + Math.random() * 80, 0.06, "square", 0.05);
        break;
      case "combo":
        this.beep(880, 0.06);
        this.beep(1046, 0.08);
        break;
      case "highScore":
        this.beep(523, 0.12);
        this.beep(659, 0.12);
        this.beep(784, 0.12);
        this.beep(988, 0.18);
        break;
    }
  }
}
