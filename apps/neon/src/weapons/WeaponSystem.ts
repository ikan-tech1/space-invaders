import {
  BEAM_HEAT_RATE,
  HEAT_COOL_RATE,
  HEAT_PER_SHOT_HEAVY,
  MAX_HEAT,
  WEAPON_NAMES,
  WEAPON_XP_THRESHOLDS,
  type WeaponTier,
} from "../config";
import type { NeonModule } from "../progression/metaStore";
import {
  createBurstVolley,
  createGaussSlug,
  createIonLance,
  createNovaShell,
  createPlayerProjectile,
  type Projectile,
} from "./projectiles";

export interface BeamState {
  active: boolean;
  x: number;
  y: number;
  length: number;
  width: number;
  ramp: number;
  damage: number;
  tickTimer: number;
}

export interface WeaponUpdateResult {
  projectiles: Projectile[];
  gaussFired: boolean;
}

export class WeaponSystem {
  tier: WeaponTier = 1;
  xp = 0;
  heat = 0;
  fireCooldown = 0;
  prismActive = false;
  prismTimer = 0;
  private modules: NeonModule[] = [];
  burstCount = 0;
  burstTimer = 0;
  ionLanceTimer = 0;
  novaShellTimer = 0;
  railBurstTimer = 0;
  beamOverchargeTimer = 0;
  gaussRecoil = 0;
  beam: BeamState = {
    active: false,
    x: 0,
    y: 0,
    length: 420,
    width: 6,
    ramp: 0,
    damage: 1,
    tickTimer: 0,
  };

  private onLevelUp?: (tier: WeaponTier, name: string) => void;

  setModules(m: NeonModule[]): void {
    this.modules = m;
  }

  private heatCap(): number {
    return this.modules.includes("overcharger") ? MAX_HEAT * 0.8 : MAX_HEAT;
  }

  setLevelUpCallback(cb: (tier: WeaponTier, name: string) => void): void {
    this.onLevelUp = cb;
  }

  addXp(amount: number): void {
    this.xp += amount;
    while (this.tier < 5 && this.xp >= WEAPON_XP_THRESHOLDS[this.tier]!) {
      this.tier = (this.tier + 1) as WeaponTier;
      this.onLevelUp?.(this.tier, WEAPON_NAMES[this.tier]);
    }
  }

  getXpProgress(): { current: number; next: number; pct: number } {
    const cur = WEAPON_XP_THRESHOLDS[this.tier - 1] ?? 0;
    const next = WEAPON_XP_THRESHOLDS[this.tier] ?? this.xp;
    if (this.tier >= 5) return { current: this.xp, next: this.xp, pct: 1 };
    const pct = (this.xp - cur) / (next - cur);
    return { current: this.xp - cur, next: next - cur, pct: Math.min(1, pct) };
  }

  setBurst(count: number, duration: number): void {
    this.burstCount = count;
    this.burstTimer = duration;
  }

  setIonLance(duration: number): void {
    this.ionLanceTimer = duration;
  }

  setNovaShell(duration: number): void {
    this.novaShellTimer = duration;
  }

  setRailBurst(duration: number): void {
    this.railBurstTimer = duration;
  }

  setBeamOvercharge(duration: number): void {
    this.beamOverchargeTimer = duration;
  }

  getFireLabel(): string {
    if (this.beamOverchargeTimer > 0) return "Beam Overcharge";
    if (this.railBurstTimer > 0) return "Gauss Burst";
    if (this.novaShellTimer > 0) return "Nova Shell";
    if (this.ionLanceTimer > 0) return "Ion Lance";
    if (this.burstTimer > 0) return `${this.burstCount}-barrel Burst`;
    if (this.beam.active) return WEAPON_NAMES[4];
    return WEAPON_NAMES[this.tier];
  }

  private canUseBeam(): boolean {
    return this.tier >= 4 || this.beamOverchargeTimer > 0;
  }

  private fireGauss(px: number, py: number): WeaponUpdateResult {
    const pierceBonus = this.modules.includes("stabilizer") ? 2 : 0;
    const burst = this.railBurstTimer > 0;
    this.fireCooldown = burst ? 0.28 : 0.52;
    this.gaussRecoil = 1;
    return {
      projectiles: [createGaussSlug(px, py - 20, 3 + pierceBonus)],
      gaussFired: true,
    };
  }

  update(dt: number, firing: boolean, px: number, py: number): WeaponUpdateResult {
    const out: Projectile[] = [];
    let gaussFired = false;

    if (this.gaussRecoil > 0) this.gaussRecoil = Math.max(0, this.gaussRecoil - dt * 5);

    if (this.burstTimer > 0) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) this.burstCount = 0;
    }
    if (this.ionLanceTimer > 0) this.ionLanceTimer -= dt;
    if (this.novaShellTimer > 0) this.novaShellTimer -= dt;
    if (this.railBurstTimer > 0) this.railBurstTimer -= dt;
    if (this.beamOverchargeTimer > 0) this.beamOverchargeTimer -= dt;

    if (this.prismTimer > 0) {
      this.prismTimer -= dt;
      if (this.prismTimer <= 0) this.prismActive = false;
    }

    const beamMode = this.canUseBeam() && firing;
    if (beamMode) {
      this.beam.active = true;
      this.beam.x = px;
      this.beam.y = py - 18;
      this.beam.ramp = Math.min(1, this.beam.ramp + dt * 1.5);
      this.beam.width = 6 + this.beam.ramp * 4;
      if (this.modules.includes("stabilizer")) this.beam.width += 2;
      this.beam.damage = 1 + Math.floor(this.beam.ramp * 2);
      this.heat = Math.min(MAX_HEAT, this.heat + BEAM_HEAT_RATE * dt);
    } else {
      this.beam.active = false;
      this.beam.ramp = Math.max(0, this.beam.ramp - dt * 2);
      if (this.tier >= 5 && firing) {
        this.heat = Math.min(MAX_HEAT, this.heat + HEAT_PER_SHOT_HEAVY * dt * 4);
      } else {
        this.heat = Math.max(0, this.heat - HEAT_COOL_RATE * dt * (this.tier >= 4 ? 1 : 1.5));
      }
    }

    if (this.beam.active || this.heat >= this.heatCap()) {
      return { projectiles: out, gaussFired };
    }

    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    const gaussMode = this.railBurstTimer > 0 || this.tier === 3;

    if (gaussMode && firing && this.fireCooldown <= 0) {
      const result = this.fireGauss(px, py);
      return result;
    }

    if (!firing || this.fireCooldown > 0) {
      return { projectiles: out, gaussFired };
    }

    if (this.ionLanceTimer > 0) {
      this.fireCooldown = 0.42;
      const pierceBonus = this.modules.includes("stabilizer") ? 2 : 0;
      return {
        projectiles: createIonLance(px, py - 18, pierceBonus),
        gaussFired,
      };
    }

    if (this.novaShellTimer > 0) {
      this.fireCooldown = 0.68;
      return {
        projectiles: [createNovaShell(px, py - 14)],
        gaussFired,
      };
    }

    if (this.burstCount >= 2) {
      this.fireCooldown = this.burstCount >= 5 ? 0.36 : 0.26;
      return {
        projectiles: createBurstVolley(this.burstCount, px, py - 14),
        gaussFired,
      };
    }

    const rates: Record<WeaponTier, number> = {
      1: 0.12,
      2: 0.3,
      3: 0.52,
      4: 0.7,
      5: 0.42,
    };
    this.fireCooldown = rates[this.tier];

    if (this.tier === 2) {
      return {
        projectiles: createPlayerProjectile(2, px, py - 16),
        gaussFired,
      };
    }
    if (this.tier === 5) {
      return {
        projectiles: createPlayerProjectile(5, px, py - 14),
        gaussFired,
      };
    }
    return {
      projectiles: createPlayerProjectile(this.tier, px, py - 14),
      gaussFired,
    };
  }

  tickBeamDamage(): { damage: number; ready: boolean } {
    if (!this.beam.active) return { damage: 0, ready: false };
    this.beam.tickTimer -= 1 / 60;
    if (this.beam.tickTimer > 0) return { damage: 0, ready: false };
    this.beam.tickTimer = 0.08;
    return { damage: this.beam.damage, ready: true };
  }

  activatePrism(duration: number): void {
    this.prismActive = true;
    this.prismTimer = duration;
  }

  get overheated(): boolean {
    return this.heat >= this.heatCap();
  }
}
