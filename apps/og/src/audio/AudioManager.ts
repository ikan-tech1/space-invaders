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
  sfxVolume = 1;
  uiVolume = 1;
  muted = false;
  private stepPhase = 0;

  private categoryGain(category: "sfx" | "ui"): number {
    const cat = category === "ui" ? this.uiVolume : this.sfxVolume;
    return this.volume * cat;
  }

  private uiSounds = new Set<SfxType>(["slotSpin", "slotWin", "slotReelStop"]);

  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
  }

  resume(): void {
    this.init();
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private beep(
    freq: number,
    duration: number,
    type: OscillatorType = "square",
    gain = 0.15,
    category: "sfx" | "ui" = "sfx"
  ): void {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain * this.categoryGain(category);
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
    const cat = this.uiSounds.has(type) ? "ui" : "sfx";
    const b = (f: number, d: number, t: OscillatorType = "square", g = 0.15) =>
      this.beep(f, d, t, g, cat);
    switch (type) {
      case "shoot":
        b(880, 0.06, "square", 0.08);
        break;
      case "enemyShoot":
        b(180, 0.1, "sawtooth", 0.06);
        break;
      case "explosion":
        b(120, 0.2, "sawtooth", 0.12);
        b(60, 0.25, "sine", 0.1);
        break;
      case "alienStep":
        this.stepPhase = 1 - this.stepPhase;
        b(this.stepPhase ? 55 : 48, 0.04, "square", 0.05);
        break;
      case "ufo":
        b(440, 0.15, "sine", 0.07);
        b(660, 0.15, "sine", 0.05);
        break;
      case "powerup":
        b(523, 0.08);
        b(784, 0.1);
        break;
      case "waveClear":
        b(392, 0.1);
        b(523, 0.1);
        b(659, 0.15);
        break;
      case "gameOver":
        b(220, 0.3, "sawtooth", 0.1);
        b(110, 0.5, "sine", 0.12);
        break;
      case "bossHit":
        b(200, 0.08, "sawtooth", 0.1);
        break;
      case "bossSpawn":
        b(110, 0.18, "sawtooth", 0.14);
        b(165, 0.22, "square", 0.1);
        b(220, 0.28, "sawtooth", 0.08);
        break;
      case "miniBossSpawn":
        b(140, 0.14, "sawtooth", 0.11);
        b(210, 0.2, "square", 0.08);
        break;
      case "bossDefeat":
        b(330, 0.12, "square", 0.1);
        b(440, 0.12, "square", 0.09);
        b(550, 0.18, "sine", 0.08);
        break;
      case "alienAggro":
        b(72, 0.06, "square", 0.04);
        break;
      case "secret":
        b(660, 0.08, "sine", 0.08);
        b(880, 0.1, "sine", 0.07);
        b(1046, 0.14, "sine", 0.06);
        break;
      case "playerHit":
        b(150, 0.25, "sawtooth", 0.12);
        break;
      case "slotSpin":
        this.beep(320, 0.05, "square", 0.06, "ui");
        this.beep(420, 0.05, "square", 0.05, "ui");
        this.beep(520, 0.05, "square", 0.04, "ui");
        break;
      case "slotWin":
        this.beep(523, 0.1, "square", 0.15, "ui");
        this.beep(659, 0.1, "square", 0.15, "ui");
        this.beep(784, 0.14, "square", 0.15, "ui");
        break;
      case "slotReelStop":
        this.beep(280 + Math.random() * 80, 0.06, "square", 0.05, "ui");
        break;
      case "combo":
        b(880, 0.06);
        b(1046, 0.08);
        break;
      case "highScore":
        b(523, 0.12);
        b(659, 0.12);
        b(784, 0.12);
        b(988, 0.18);
        break;
    }
  }
}
