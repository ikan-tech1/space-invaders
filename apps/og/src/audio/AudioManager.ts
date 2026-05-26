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
  | "bossSpawn"
  | "bossDefeat"
  | "miniBossSpawn"
  | "playerHit"
  | "slotSpin"
  | "slotWin"
  | "slotReelStop"
  | "combo"
  | "highScore"
  | "secret"
  | "alienAggro";

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

  playBossHit(kind: "mini" | "big" = "mini"): void {
    this.resume();
    if (this.muted || !this.ctx) return;
    const base = kind === "big" ? 160 : 220;
    this.beep(base, 0.07, "sawtooth", 0.11);
    if (kind === "big") {
      this.beep(95, 0.12, "sine", 0.08);
    }
  }

  playBossSpawn(kind: "mini" | "big"): void {
    this.play(kind === "big" ? "bossSpawn" : "miniBossSpawn");
  }

  playShoot(profile: string): void {
    this.play("shoot");
    this.resume();
    if (this.muted || !this.ctx) return;
    const mult = profile === "shockwave" ? 0.7 : profile === "homing" ? 1.15 : profile === "scatter" ? 1.05 : 1;
    const base = profile === "double" || profile === "twin" ? 760 : profile === "triple" || profile === "burst3" ? 920 : 880;
    this.beep(base * mult, 0.05, profile === "shockwave" ? "sawtooth" : "square", 0.07);
    if (profile === "burst2" || profile === "burst3") {
      window.setTimeout(() => this.beep(base * 0.92, 0.04, "square", 0.05), 40);
    }
    if (profile === "homing") {
      this.beep(660, 0.06, "sine", 0.05);
    }
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
      case "bossSpawn":
        this.beep(110, 0.18, "sawtooth", 0.14);
        this.beep(165, 0.22, "square", 0.1);
        this.beep(220, 0.28, "sawtooth", 0.08);
        break;
      case "miniBossSpawn":
        this.beep(140, 0.14, "sawtooth", 0.11);
        this.beep(210, 0.2, "square", 0.08);
        break;
      case "bossDefeat":
        this.beep(330, 0.12, "square", 0.1);
        this.beep(440, 0.12, "square", 0.09);
        this.beep(550, 0.18, "sine", 0.08);
        break;
      case "alienAggro":
        this.beep(72, 0.06, "square", 0.04);
        break;
      case "secret":
        this.beep(660, 0.08, "sine", 0.08);
        this.beep(880, 0.1, "sine", 0.07);
        this.beep(1046, 0.14, "sine", 0.06);
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
