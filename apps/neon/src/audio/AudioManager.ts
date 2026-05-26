export type SfxType =
  | "shoot"
  | "gauss"
  | "ion"
  | "nova"
  | "beam"
  | "deflect"
  | "enemyShoot"
  | "explosion"
  | "hit"
  | "ufo"
  | "powerup"
  | "waveClear"
  | "gameOver"
  | "playerHit"
  | "levelUp"
  | "slotSpin"
  | "slotWin";

export class AudioManager {
  private ctx: AudioContext | null = null;
  private beamOsc: OscillatorNode | null = null;
  private beamGain: GainNode | null = null;
  volume = 0.65;
  muted = false;

  init(): void {
    if (!this.ctx) this.ctx = new AudioContext();
  }

  resume(): void {
    this.init();
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType = "sawtooth",
    gain = 0.12
  ): void {
    if (this.muted || !this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain * this.volume;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }

  playBeam(dt: number): void {
    if (this.muted || !this.ctx) return;
    if (!this.beamOsc) {
      this.beamOsc = this.ctx.createOscillator();
      this.beamGain = this.ctx.createGain();
      this.beamOsc.type = "sawtooth";
      this.beamOsc.frequency.value = 720;
      this.beamGain.gain.value = 0.03 * this.volume;
      this.beamOsc.connect(this.beamGain);
      this.beamGain.connect(this.ctx.destination);
      this.beamOsc.start();
    }
    if (this.beamGain) {
      this.beamGain.gain.value = Math.min(
        0.07 * this.volume,
        this.beamGain.gain.value + dt * 0.4
      );
    }
    if (this.beamOsc) {
      this.beamOsc.frequency.value = 720 + Math.min(180, this.beamGain!.gain.value * 800);
    }
  }

  stopBeam(): void {
    if (this.beamOsc) {
      try {
        this.beamOsc.stop();
      } catch {
        /* already stopped */
      }
      this.beamOsc.disconnect();
      this.beamGain?.disconnect();
      this.beamOsc = null;
      this.beamGain = null;
    }
  }

  /** Stop all sustained combat audio (beam). */
  haltCombat(): void {
    this.stopBeam();
  }

  play(type: SfxType): void {
    this.resume();
    switch (type) {
      case "shoot":
        this.tone(520, 0.05, "square", 0.06);
        this.tone(880, 0.04, "sine", 0.04);
        break;
      case "gauss":
        this.tone(65, 0.08, "sine", 0.14);
        this.tone(140, 0.06, "square", 0.1);
        this.tone(320, 0.12, "sawtooth", 0.08);
        this.tone(480, 0.05, "triangle", 0.05);
        break;
      case "ion":
        this.tone(720, 0.08, "sine", 0.08);
        this.tone(1200, 0.06, "triangle", 0.05);
        break;
      case "nova":
        this.tone(180, 0.2, "sawtooth", 0.12);
        this.tone(90, 0.25, "sine", 0.08);
        break;
      case "beam":
        break;
      case "deflect":
        this.tone(640, 0.04, "sine", 0.06);
        this.tone(980, 0.05, "triangle", 0.04);
        this.tone(1200, 0.03, "sine", 0.03);
        break;
      case "enemyShoot":
        this.tone(200, 0.08, "triangle", 0.05);
        break;
      case "explosion":
        this.tone(90, 0.25, "sawtooth", 0.1);
        this.tone(45, 0.3, "sine", 0.08);
        break;
      case "hit":
        this.tone(180, 0.06, "square", 0.08);
        break;
      case "ufo":
        this.tone(330, 0.12, "sine", 0.06);
        break;
      case "powerup":
        this.tone(660, 0.08);
        this.tone(990, 0.1);
        break;
      case "waveClear":
        this.tone(440, 0.1);
        this.tone(554, 0.1);
        this.tone(659, 0.15);
        break;
      case "gameOver":
        this.tone(110, 0.5, "sawtooth", 0.12);
        break;
      case "playerHit":
        this.tone(150, 0.2, "sawtooth", 0.1);
        break;
      case "levelUp":
        this.tone(523, 0.1);
        this.tone(659, 0.08);
        this.tone(784, 0.1);
        this.tone(1047, 0.18, "sine", 0.12);
        break;
      case "slotSpin":
        this.tone(280, 0.06, "square", 0.05);
        this.tone(360, 0.06, "square", 0.04);
        break;
      case "slotWin":
        this.tone(440, 0.08);
        this.tone(554, 0.08);
        this.tone(659, 0.1);
        this.tone(880, 0.14, "sine", 0.1);
        break;
    }
  }
}
