import {
  BASE_POWERUP_TYPES,
  BOSS_POINTS,
  ALIEN_STEP_DOWN,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CLONE_DURATION,
  COLORS,
  COMBO_MAX,
  COMBO_WINDOW,
  DIFFICULTY_CONFIG,
  DRONE_POINTS,
  INVULN_TIME,
  PLAYER_SPEED,
  PLAYER_Y,
  POWERUP_DISPLAY,
  SLOW_DURATION,
  type Difficulty,
  type GameMode,
  type PowerUpType,
} from "../config";
import { AudioManager } from "../audio/AudioManager";
import { JuiceController } from "./JuiceController";
import { InputManager } from "../input/InputManager";
import { ParticleSystem } from "../render/ParticleSystem";
import { NeonRenderer } from "../render/NeonRenderer";
import { WeaponSystem } from "../weapons/WeaponSystem";
import type { Projectile } from "../weapons/projectiles";
import { createPrismSplit, projectileHitRect } from "../weapons/projectiles";
import { bossFirePattern, droneRect, tryDroneFire } from "./EnemyAI";
import { createShields, projectileHitsShield, repairShields } from "./entities/ShieldGrid";
import type { Boss, Drone, PowerUpDrop, Shield, UFO } from "./entities/types";
import { formationBounds } from "./formations";
import { LevelDirector } from "../progression/LevelDirector";
import { CAMPAIGN_MAX_LEVEL } from "../progression/levelScript";
import { bossMoveSpeed } from "../progression/bosses";
import { ChallengeTracker } from "../progression/challenges";
import { EasterEggRegistry } from "../progression/easterEggs";
import type { LevelCompleteReport } from "../progression/levelComplete";
import { LevelChallengeTracker } from "../progression/levelChallenges";
import { getSector } from "../narrative/campaignScript";
import { loadNeonMeta, saveNeonMeta, type NeonMeta } from "../progression/metaStore";

export type GameState =
  | "playing"
  | "paused"
  | "waveBanner"
  | "sectorBriefing"
  | "levelInterstitial"
  | "gameOver";

export interface ActivePowerup {
  label: string;
  timer: number;
  max: number;
}

export interface NeonCallbacks {
  onScoreChange: (s: number) => void;
  onLivesChange: (l: number) => void;
  onWaveChange: (w: number, sectorTitle?: string) => void;
  onWeaponChange: (tier: number, name: string, xpPct: number, heat: number) => void;
  onComboChange: (mult: number) => void;
  onWaveBanner: (text: string) => void;
  onBossInbound: (text: string) => void;
  onSectorBriefing: (level: number, onContinue: () => void) => void;
  onLevelComplete: (report: LevelCompleteReport) => void;
  onLevelUp: (name: string) => void;
  onGameOver: (score: number, wave: number, maxTier: number) => void;
  onPauseChange: (p: boolean) => void;
  onPickupToast: (icon: string, name: string, effect: string) => void;
  onPowerupsChange: (items: ActivePowerup[]) => void;
  onCampaignClear: () => void;
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function canDeflectEnemyBullet(kind: Projectile["kind"]): boolean {
  switch (kind) {
    case "gauss":
    case "ion":
    case "nova":
    case "singularity":
      return true;
    case "plasma":
      return Math.random() < 0.55;
    case "pulse":
      return Math.random() < 0.3;
    default:
      return false;
  }
}

export class NeonGame {
  state: GameState = "playing";
  score = 0;
  lives = 3;
  difficulty: Difficulty = "classic";
  gameMode: GameMode = "campaign";
  meta: NeonMeta = loadNeonMeta();
  maxTierReached = 1;

  playerX = CANVAS_WIDTH / 2;
  playerY = PLAYER_Y;
  playerTilt = 0;
  invulnTimer = 0;
  aegisShield = 0;
  chronoTimer = 0;
  overdriveTimer = 0;
  slowTimer = 0;
  cloneTimer = 0;

  drones: Drone[] = [];
  projectiles: Projectile[] = [];
  shields: Shield[] = [];
  pickups: PowerUpDrop[] = [];
  ufo: UFO | null = null;
  boss: Boss | null = null;

  alienDir = 1;
  alienTick = 0;
  ufoTimer = 10;
  waveBannerTimer = 0;
  interstitialTimer = 0;
  comboMult = 1;
  comboCount = 0;
  comboTimer = 0;

  levelDirector = new LevelDirector();
  weapons = new WeaponSystem();
  particles = new ParticleSystem();
  juice = new JuiceController();
  challenges = new ChallengeTracker();
  levelChallenges = new LevelChallengeTracker();
  eggs = new EasterEggRegistry();

  private beamHitCooldown = new Set<string>();
  private startPowerup: PowerUpType | null = null;

  constructor(
    public renderer: NeonRenderer,
    public audio: AudioManager,
    public input: InputManager,
    private cb: NeonCallbacks
  ) {
    this.weapons.setLevelUpCallback((tier, name) => {
      this.maxTierReached = Math.max(this.maxTierReached, tier);
      this.cb.onLevelUp(name);
      this.audio.play("levelUp");
      this.juice.shake(0.25, 1.2);
    });
  }

  init(
    difficulty: Difficulty,
    mode: GameMode,
    saved?: { score: number; wave: number; lives: number }
  ): void {
    this.difficulty = difficulty;
    this.gameMode = mode;
    this.meta = loadNeonMeta();
    const cfg = DIFFICULTY_CONFIG[difficulty];
    this.lives = saved?.lives ?? cfg.lives;
    this.score = saved?.score ?? 0;
    if (saved) this.levelDirector.level = saved.wave;
    this.challenges = new ChallengeTracker(this.meta.badges);
    this.weapons.setModules(this.meta.activeModules);
    if (!saved) this.consumePendingRedeployBonuses();
    if (this.meta.hangarUpgrades.includes("aegisStart")) this.aegisShield = 0.5;
    this.shields = createShields(4);
    this.beginSector();
    this.syncHud();
  }

  private beginSector(): void {
    this.haltCombatAudio();
    if (this.gameMode === "campaign") {
      this.state = "sectorBriefing";
      this.cb.onSectorBriefing(this.levelDirector.level, () => this.startLevel());
      return;
    }
    this.startLevel();
  }

  startLevel(): void {
    this.applyStartPowerupIfQueued();
    this.challenges.startLevel(this.weapons.tier);
    this.levelChallenges.startLevel(this.score);
    this.eggs.onSectorBanner(this.levelDirector.level);
    const enc = this.levelDirector.encounter;
    const inbound = this.levelDirector.getInboundFlash();
    if (enc === "bigBoss") {
      this.drones = [];
      this.boss = this.levelDirector.spawnBigBoss();
    } else if (enc === "miniBoss") {
      this.drones = [];
      this.boss = this.levelDirector.spawnMiniBoss();
    } else {
      this.boss = null;
      this.drones = this.levelDirector.spawnDrones(this.difficulty);
    }
    const sector = getSector(this.levelDirector.level);
    this.cb.onWaveChange(this.levelDirector.level, sector.title);
    this.cb.onWaveBanner(this.levelDirector.getBanner());
    if (inbound) this.cb.onBossInbound(inbound);
    this.state = "waveBanner";
    this.waveBannerTimer = 1.5;
  }

  syncHud(): void {
    const prog = this.weapons.getXpProgress();
    const sector = getSector(this.levelDirector.level);
    this.cb.onScoreChange(this.score);
    this.cb.onLivesChange(this.lives);
    this.cb.onWaveChange(this.levelDirector.level, sector.title);
    this.cb.onWeaponChange(
      this.weapons.tier,
      this.weapons.getFireLabel(),
      prog.pct,
      this.weapons.heat / 100
    );
    this.syncActivePowerups();
  }

  private haltCombatAudio(): void {
    this.audio.haltCombat();
    this.weapons.beam.active = false;
    this.weapons.beam.ramp = 0;
    this.weapons.gaussRecoil = 0;
  }

  private syncActivePowerups(): void {
    const w = this.weapons;
    const items: ActivePowerup[] = [];
    if (this.overdriveTimer > 0) {
      items.push({ label: "Overdrive", timer: this.overdriveTimer, max: 8 });
    }
    if (w.prismTimer > 0) items.push({ label: "Prism", timer: w.prismTimer, max: 10 });
    if (this.chronoTimer > 0) {
      const max = this.meta.hangarUpgrades.includes("chronoPlus") ? 5 : 4;
      items.push({ label: "Chrono", timer: this.chronoTimer, max });
    }
    if (this.slowTimer > 0) items.push({ label: "Slow", timer: this.slowTimer, max: SLOW_DURATION });
    if (this.cloneTimer > 0) {
      items.push({ label: "Clone Wing", timer: this.cloneTimer, max: CLONE_DURATION });
    }
    if (w.burstTimer > 0) items.push({ label: "Burst", timer: w.burstTimer, max: 8 });
    if (w.ionLanceTimer > 0) items.push({ label: "Ion Lance", timer: w.ionLanceTimer, max: 6 });
    if (w.novaShellTimer > 0) items.push({ label: "Nova Shell", timer: w.novaShellTimer, max: 6 });
    if (w.railBurstTimer > 0) items.push({ label: "Gauss Burst", timer: w.railBurstTimer, max: 6 });
    if (w.beamOverchargeTimer > 0) {
      items.push({ label: "Beam Overcharge", timer: w.beamOverchargeTimer, max: 6 });
    }
    if (this.aegisShield >= 1) {
      items.push({ label: "Aegis", timer: this.aegisShield, max: 1 });
    }
    this.cb.onPowerupsChange(items);
  }

  update(dt: number): void {
    if (this.state === "gameOver") return;

    if (this.state !== "playing") {
      this.haltCombatAudio();
    }

    this.renderer.vfx.update(dt);
    this.juice.update(dt);
    const timeScale = this.juice.timeScale;
    dt *= timeScale;

    if (this.state === "sectorBriefing") return;

    if (this.state === "levelInterstitial") {
      this.interstitialTimer -= dt;
      if (this.interstitialTimer <= 0) {
        if (
          this.gameMode === "campaign" &&
          this.levelDirector.level >= CAMPAIGN_MAX_LEVEL
        ) {
          this.cb.onCampaignClear();
          this.state = "gameOver";
          this.cb.onGameOver(this.score, this.levelDirector.level, this.maxTierReached);
          return;
        }
        this.levelDirector.nextLevel();
        this.syncHud();
        this.beginSector();
      }
      this.particles.update(dt);
      return;
    }

    if (this.state === "waveBanner") {
      this.waveBannerTimer -= dt;
      if (this.waveBannerTimer <= 0) this.state = "playing";
      this.particles.update(dt);
      return;
    }

    if (this.input.consumePause()) this.togglePause();
    if (this.state === "paused") {
      this.particles.update(dt);
      return;
    }

    const chrono = this.chronoTimer > 0 ? 0.35 : 1;
    const slow = this.slowTimer > 0 ? 0.4 : 1;
    if (this.chronoTimer > 0) this.chronoTimer -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;
    if (this.overdriveTimer > 0) {
      this.overdriveTimer -= dt;
      this.weapons.fireCooldown = 0;
    }
    if (this.cloneTimer > 0) this.cloneTimer -= dt;
    if (this.aegisShield > 0 && this.aegisShield < 1) {
      this.aegisShield = Math.min(1, this.aegisShield + dt * 0.15);
    }

    const axis = this.input.getMoveAxis();
    this.playerX += axis * PLAYER_SPEED * dt;
    this.playerX = Math.max(28, Math.min(CANVAS_WIDTH - 28, this.playerX));
    this.playerTilt = axis;
    if (Math.abs(axis) > 0.1) this.particles.engineTrail(this.playerX, this.playerY);

    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    const firing = this.input.isFirePressed();
    const result = this.weapons.update(dt, firing, this.playerX, this.playerY);
    if (result.projectiles.length) {
      for (let i = 0; i < result.projectiles.length; i++) this.levelChallenges.onShotFired();
      const shots: Projectile[] = [...result.projectiles];
      if (this.cloneTimer > 0) {
        for (const off of [-36, 36]) {
          for (const s of result.projectiles) {
            shots.push({ ...s, x: s.x + off, trail: [] });
          }
        }
      }
      this.projectiles.push(...shots);
      if (result.gaussFired) {
        this.audio.play("gauss");
        this.juice.shake(0.2, 1.1);
        this.juice.hitStop(0.025);
        this.renderer.vfx.triggerGaussMuzzle(this.playerX, this.playerY);
      } else if (result.projectiles[0]?.kind === "nova") {
        this.audio.play("nova");
      } else if (result.projectiles[0]?.kind === "ion") {
        this.audio.play("ion");
      } else {
        this.audio.play("shoot");
      }
    }
    if (this.weapons.beam.active) {
      this.audio.playBeam(dt);
      this.updateBeamDamage();
    } else {
      this.audio.stopBeam();
    }
    if (this.weapons.overheated) {
      this.levelChallenges.onOverheat();
      if (this.boss?.active && this.boss.kind === "big") {
        this.challenges.onOverheatDuringBoss(true);
      }
    }
    this.challenges.onTier(this.weapons.tier);

    this.updateProjectiles(dt * chrono);
    this.updateDrones(dt * chrono * slow);
    this.updateBoss(dt * chrono);
    this.updateUfo(dt);
    this.updatePickups(dt);
    this.checkWaveClear();
    this.particles.update(dt);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboMult = 1;
        this.cb.onComboChange(1);
      }
    }

    const prog = this.weapons.getXpProgress();
    this.cb.onWeaponChange(
      this.weapons.tier,
      this.weapons.getFireLabel(),
      prog.pct,
      this.weapons.heat / 100
    );
    this.syncActivePowerups();
  }

  private updateBeamDamage(): void {
    const { ready, damage } = this.weapons.tickBeamDamage();
    if (!ready || damage <= 0) return;
    const beam = this.weapons.beam;
    const left = beam.x - beam.width / 2;
    const right = beam.x + beam.width / 2;
    const top = beam.y - beam.length;

    const hitBeamRect = (key: string, rect: { x: number; y: number; w: number; h: number }) => {
      if (this.beamHitCooldown.has(key)) return false;
      const overlap =
        left < rect.x + rect.w &&
        right > rect.x &&
        top < rect.y + rect.h &&
        beam.y > rect.y;
      if (!overlap) return false;
      this.beamHitCooldown.add(key);
      setTimeout(() => this.beamHitCooldown.delete(key), 80);
      return true;
    };

    if (this.boss?.active) {
      const br = { x: this.boss.x - 60, y: this.boss.y - 30, w: 120, h: 70 };
      if (hitBeamRect("boss", br)) {
        this.levelChallenges.onShotHit();
        this.boss.hp -= damage;
        this.particles.burst(beam.x, beam.y - 80, "#ff3355", 4);
        if (this.boss.hp <= this.boss.maxHp * 0.5 && this.boss.kind === "big") this.boss.phase = 2;
        if (this.boss.hp <= 0) this.killBoss();
      }
    }

    for (const d of this.drones) {
      if (!d.alive) continue;
      const dr = droneRect(d);
      if (hitBeamRect(`d${d.x}${d.y}`, dr)) {
        this.levelChallenges.onShotHit();
        d.hp -= damage;
        if (d.hp <= 0) this.killDrone(d);
      }
    }

    this.deflectEnemyBulletsInBeam(left, right, top, beam.y);
  }

  private deflectEnemyBulletsInBeam(
    left: number,
    right: number,
    top: number,
    bottom: number
  ): void {
    for (const ep of this.projectiles) {
      if (ep.fromPlayer || !ep.active) continue;
      const pr = projectileHitRect(ep);
      const overlap =
        left < pr.x + pr.w &&
        right > pr.x &&
        top < pr.y + pr.h &&
        bottom > pr.y;
      if (!overlap) continue;
      ep.active = false;
      this.particles.burst(ep.x, ep.y, COLORS.accent, 5);
      this.audio.play("deflect");
    }
  }

  private onGaussImpact(x: number, y: number): void {
    this.particles.shockwave(x, y, COLORS.gold);
    this.renderer.vfx.triggerGaussImpact(x, y);
    this.juice.hitStop(0.03);
  }

  private onProjectileHit(p: Projectile, x: number, y: number): void {
    if (this.weapons.prismActive) {
      this.projectiles.push(...createPrismSplit(x, y));
    }
    void p;
  }

  private updateProjectiles(dt: number): void {
    for (const p of this.projectiles) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.y < -40 || p.y > CANVAS_HEIGHT + 40 || p.life <= 0) p.active = false;

      for (const sh of this.shields) {
        if (projectileHitsShield(sh, p)) break;
      }

      if (p.fromPlayer) {
        for (const ep of this.projectiles) {
          if (ep === p || ep.fromPlayer || !ep.active) continue;
          if (!rectsOverlap(projectileHitRect(p), projectileHitRect(ep))) continue;
          if (!canDeflectEnemyBullet(p.kind)) continue;
          ep.active = false;
          this.particles.deflectSpark(ep.x, ep.y);
          this.particles.burst(ep.x, ep.y, COLORS.gold, 4);
          this.audio.play("deflect");
          if (p.kind === "pulse" || p.kind === "plasma") {
            if (Math.random() < 0.45) p.active = false;
          }
        }
        if (!p.active) continue;

        const pr = projectileHitRect(p);
        if (this.boss?.active) {
          const br = { x: this.boss.x - 60, y: this.boss.y - 30, w: 120, h: 70 };
          if (rectsOverlap(pr, br)) {
            this.levelChallenges.onShotHit();
            this.onProjectileHit(p, p.x, p.y);
            if (p.kind === "gauss") this.onGaussImpact(p.x, p.y);
            p.active = p.pierce-- > 0;
            this.boss.hp -= p.damage;
            this.audio.play("hit");
            this.particles.burst(p.x, p.y, "#ff3355", p.kind === "gauss" ? 14 : 8);
            if (this.boss.hp <= this.boss.maxHp * 0.5 && this.boss.kind === "big") {
              this.boss.phase = 2;
            }
            if (this.boss.hp <= 0) this.killBoss();
          }
        }
        if (this.ufo?.active) {
          const ur = { x: this.ufo.x - 28, y: this.ufo.y - 12, w: 56, h: 24 };
          if (rectsOverlap(pr, ur)) {
            this.levelChallenges.onShotHit();
            this.onProjectileHit(p, p.x, p.y);
            p.active = false;
            this.addScore(this.ufo.points);
            this.ufo.active = false;
            this.particles.burst(this.ufo.x, this.ufo.y, "#ffcc33", 20);
            this.audio.play("explosion");
            this.maybeDrop(this.ufo.x, this.ufo.y);
          }
        }
        for (const d of this.drones) {
          if (!d.alive) continue;
          const dr = droneRect(d);
          if (rectsOverlap(pr, dr)) {
            this.levelChallenges.onShotHit();
            if (p.kind === "singularity" && d.droneClass === "elite") {
              this.eggs.onEliteSingularityKill();
            }
            if (p.kind === "nova" || p.kind === "singularity") {
              this.damageDroneArea(p.x, p.y, p.radius + 10, p.damage);
              p.active = false;
            } else {
              this.onProjectileHit(p, p.x, p.y);
              if (p.kind === "gauss") this.onGaussImpact(p.x, p.y);
              d.hp -= p.damage;
              if (d.hp <= 0) this.killDrone(d);
              else if (p.kind === "gauss") this.audio.play("hit");
              p.active = p.pierce-- > 0;
            }
            if (!p.active) break;
          }
        }
      } else {
        const pr = { x: p.x - 5, y: p.y - 5, w: 10, h: 10 };
        const pl = { x: this.playerX - 18, y: this.playerY - 16, w: 36, h: 28 };
        if (this.invulnTimer <= 0 && rectsOverlap(pr, pl)) {
          if (this.aegisShield >= 1) {
            this.aegisShield = Math.max(0, this.aegisShield - 0.35);
            p.active = false;
          } else {
            p.active = false;
            this.hitPlayer();
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.active);
  }

  private damageDroneArea(cx: number, cy: number, r: number, dmg: number): void {
    for (const d of this.drones) {
      if (!d.alive) continue;
      if (Math.hypot(d.x + 15 - cx, d.y + 12 - cy) < r) {
        d.hp -= dmg;
        if (d.hp <= 0) this.killDrone(d);
      }
    }
  }

  private registerCombo(): void {
    this.comboTimer = COMBO_WINDOW;
    this.comboCount++;
    this.comboMult = Math.min(COMBO_MAX, 1 + Math.floor(this.comboCount / 2));
    this.levelChallenges.onCombo(this.comboMult);
    this.cb.onComboChange(this.comboMult);
    if (this.comboMult >= 3) this.juice.shake(0.08, this.comboMult * 0.15);
    if (this.comboMult >= 4) this.challenges.onCombo(this.comboMult);
  }

  private killDrone(d: Drone): void {
    d.alive = false;
    const pts = DRONE_POINTS[d.droneClass] ?? 10;
    this.addScore(pts);
    const xpMult = this.meta.hangarUpgrades.includes("xpBoost") ? 1.1 : 1;
    this.weapons.addXp(Math.floor(pts * xpMult));
    this.registerCombo();
    if (d.droneClass === "elite" || d.droneClass === "bulwark") {
      this.juice.hitStop(0.04);
    }
    this.particles.burst(d.x + 15, d.y + 12, "#00e8ff", 12);
    this.audio.play("explosion");
    this.maybeDrop(d.x, d.y);
  }

  private killBoss(): void {
    if (!this.boss) return;
    this.addScore(BOSS_POINTS);
    this.weapons.addXp(150);
    this.particles.burst(this.boss.x, this.boss.y, "#ff3d9a", 30);
    this.boss.active = false;
    this.audio.play("explosion");
    this.juice.shake(0.4, 1.5);
    this.juice.hitStop(0.08);
  }

  private updateDrones(dt: number): void {
    const alive = this.drones.filter((d) => d.alive);
    if (!alive.length) return;

    for (const d of alive) d.animPhase += dt;

    const speed = this.levelDirector.speedMult(this.difficulty);
    this.alienTick += dt;
    const tick = Math.max(0.1, 0.5 - alive.length * 0.006) / speed;

    if (this.alienTick >= tick) {
      this.alienTick = 0;
      const b = formationBounds(this.drones);
      let edge = false;
      const step = 6 * speed;
      if (b.maxX >= CANVAS_WIDTH - 20 && this.alienDir > 0) {
        this.alienDir = -1;
        edge = true;
      } else if (b.minX <= 20 && this.alienDir < 0) {
        this.alienDir = 1;
        edge = true;
      }
      for (const d of alive) {
        if (edge) d.y += ALIEN_STEP_DOWN;
        else d.x += this.alienDir * step;
      }
      if (b.maxY >= this.playerY - 50) this.hitPlayer();
    }

    for (const d of alive) {
      const shot = tryDroneFire(d, dt, this.playerX, this.playerY, this.difficulty);
      if (shot) {
        this.projectiles.push(shot);
        this.audio.play("enemyShoot");
      }
    }
  }

  private updateBoss(dt: number): void {
    if (!this.boss?.active) return;
    const spd = bossMoveSpeed(this.boss.kind);
    const margin = this.boss.kind === "mini" ? 70 : 90;
    this.boss.x += this.boss.direction * spd * dt;
    if (this.boss.x < margin || this.boss.x > CANVAS_WIDTH - margin) {
      this.boss.direction *= -1;
    }
    this.boss.patternTimer += dt;
    if (this.boss.kind === "big" && this.boss.hp <= this.boss.maxHp * 0.5) {
      this.boss.phase = 2;
    }
    const rate = this.boss.kind === "mini" ? 0.03 : this.boss.phase === 2 ? 0.06 : 0.035;
    if (Math.random() < rate) {
      this.projectiles.push(...bossFirePattern(this.boss, this.playerX, this.playerY));
    }
  }

  private updateUfo(dt: number): void {
    this.ufoTimer -= dt;
    if (!this.ufo?.active && this.ufoTimer <= 0 && this.levelDirector.encounter === "standard") {
      this.ufo = {
        x: Math.random() < 0.5 ? -50 : CANVAS_WIDTH + 50,
        y: 52,
        direction: 1,
        active: true,
        points: [80, 120, 200, 400][Math.floor(Math.random() * 4)]!,
      };
      if (this.ufo.x < 0) this.ufo.direction = 1;
      else this.ufo.direction = -1;
      this.ufoTimer = 14 + Math.random() * 10;
      this.audio.play("ufo");
    }
    if (this.ufo?.active) {
      this.ufo.x += this.ufo.direction * 100 * dt;
      if (this.ufo.x < -70 || this.ufo.x > CANVAS_WIDTH + 70) this.ufo.active = false;
    }
  }

  private updatePickups(dt: number): void {
    for (const p of this.pickups) {
      if (!p.active) continue;
      p.rot += dt * 3;
      p.y += p.vy * dt;
      if (p.y > CANVAS_HEIGHT) p.active = false;
      if (Math.hypot(p.x - this.playerX, p.y - this.playerY) < 32) {
        p.active = false;
        this.applyPickup(p.type);
      }
    }
    this.pickups = this.pickups.filter((p) => p.active);
  }

  private getDropPool(): PowerUpType[] {
    const pool: PowerUpType[] = [...BASE_POWERUP_TYPES];
    if (this.levelDirector.level >= 3) pool.push("deployBunker", "temporalSlow");
    for (const id of this.meta.unlockedPickups) {
      const t = id as PowerUpType;
      if (!pool.includes(t)) pool.push(t);
    }
    return pool;
  }

  private maybeDrop(x: number, y: number): void {
    if (this.eggs.consumeWeaponCoreDrop()) {
      this.pickups.push({ x, y, vy: 55, type: "weaponCore", active: true, rot: 0 });
      return;
    }
    if (Math.random() > 0.14) return;
    const pool = this.getDropPool();
    const type = pool[Math.floor(Math.random() * pool.length)]!;
    this.pickups.push({ x, y, vy: 55, type, active: true, rot: 0 });
  }

  private consumePendingRedeployBonuses(): void {
    let dirty = false;
    if (this.meta.pendingBonusLife) {
      this.lives += 1;
      this.meta.pendingBonusLife = false;
      dirty = true;
    }
    if (this.meta.pendingStartPowerup) {
      this.startPowerup = this.meta.pendingStartPowerup;
      this.meta.pendingStartPowerup = null;
      dirty = true;
    }
    if (dirty) saveNeonMeta(this.meta);
  }

  private applyStartPowerupIfQueued(): void {
    if (!this.startPowerup) return;
    const type = this.startPowerup;
    this.startPowerup = null;
    this.applyPickup(type);
    const info = POWERUP_DISPLAY[type];
    this.cb.onPickupToast(info.icon, info.name, info.effect);
  }

  private applyPickup(type: PowerUpType): void {
    this.audio.play("powerup");
    const info = POWERUP_DISPLAY[type];
    if (info) this.cb.onPickupToast(info.icon, info.name, info.effect);
    switch (type) {
      case "overdrive":
        this.overdriveTimer = 8;
        this.weapons.fireCooldown = 0;
        break;
      case "prism":
        this.weapons.activatePrism(10);
        break;
      case "aegis":
        this.aegisShield = 1;
        break;
      case "chrono":
        this.chronoTimer = this.meta.hangarUpgrades.includes("chronoPlus") ? 5 : 4;
        this.challenges.onChrono();
        break;
      case "nanite":
        repairShields(this.shields);
        if (this.meta.activeModules.includes("salvager")) repairShields(this.shields);
        break;
      case "weaponCore":
        this.weapons.addXp(80);
        break;
      case "burst2":
        this.weapons.setBurst(2, 8);
        break;
      case "burst3":
        this.weapons.setBurst(3, 8);
        break;
      case "burst5":
        this.weapons.setBurst(5, 8);
        break;
      case "burst6":
        this.weapons.setBurst(6, 8);
        break;
      case "ionLance":
        this.weapons.setIonLance(6);
        break;
      case "novaShell":
        this.weapons.setNovaShell(6);
        break;
      case "railBurst":
        this.weapons.setRailBurst(6);
        break;
      case "beamOvercharge":
        this.weapons.setBeamOvercharge(6);
        break;
      case "cloneWing":
        this.cloneTimer = CLONE_DURATION;
        break;
      case "deployBunker": {
        const sh = createShields(1)[0]!;
        sh.x = CANVAS_WIDTH / 2 - 24;
        sh.y = 400;
        this.shields.push(sh);
        break;
      }
      case "temporalSlow":
        this.slowTimer = SLOW_DURATION;
        break;
    }
    this.syncActivePowerups();
  }

  private addScore(base: number): void {
    this.score += base * this.comboMult;
    this.cb.onScoreChange(this.score);
  }

  private hitPlayer(): void {
    if (this.invulnTimer > 0) return;
    this.levelChallenges.onDamage();
    this.lives--;
    this.invulnTimer = INVULN_TIME;
    this.juice.shake(0.35);
    this.audio.play("playerHit");
    this.particles.burst(this.playerX, this.playerY, "#ff3355", 18);
    this.cb.onLivesChange(this.lives);
    this.comboCount = 0;
    this.comboMult = 1;
    this.cb.onComboChange(1);
    if (this.lives <= 0) {
      this.haltCombatAudio();
      this.state = "gameOver";
      this.audio.play("gameOver");
      this.cb.onGameOver(this.score, this.levelDirector.level, this.maxTierReached);
    }
  }

  private unlockPickupFromChallenge(challengeId: string, level: number): void {
    const map: Record<string, PowerUpType> = {
      no_hit: "ionLance",
      cool: "beamOvercharge",
      marksman: "railBurst",
      combo_master: "cloneWing",
    };
    if (challengeId === "no_hit" && level !== 3) return;
    const pickup = map[challengeId];
    if (pickup && !this.meta.unlockedPickups.includes(pickup)) {
      this.meta.unlockedPickups.push(pickup);
    }
  }

  private checkWaveClear(): void {
    if (this.state !== "playing") return;
    const enc = this.levelDirector.encounter;
    if (enc !== "standard") {
      if (this.boss?.active) return;
    } else if (this.drones.some((d) => d.alive)) return;

    this.audio.play("waveClear");
    const wasBig = enc === "bigBoss";
    const flawless = !this.levelChallenges.damageTaken;
    let stars = 1;
    if (flawless) stars = 2;
    if (wasBig || enc === "miniBoss") stars = 3;

    const levelResults = this.levelChallenges.evaluate();
    let challengeBonus = levelResults.reduce((s, c) => s + (c.passed ? c.bonus : 0), 0);

    for (const c of levelResults) {
      if (c.passed) this.unlockPickupFromChallenge(c.id, this.levelDirector.level);
    }

    const newCh = this.challenges.checkOnLevelComplete(
      this.levelDirector.level,
      this.weapons.tier,
      wasBig
    );
    for (const c of newCh) {
      challengeBonus += c.bonusScore;
      if (c.id === "tier3_by_l5" && !this.meta.modules.includes("overcharger")) {
        this.meta.modules.push("overcharger");
      }
      if (c.id === "boss_no_overheat" && !this.meta.modules.includes("stabilizer")) {
        this.meta.modules.push("stabilizer");
      }
      if (c.id === "chrono_master" && !this.meta.modules.includes("salvager")) {
        this.meta.modules.push("salvager");
      }
    }

    if (!this.meta.clearedSectors.includes(this.levelDirector.level)) {
      this.meta.clearedSectors.push(this.levelDirector.level);
    }

    this.score += challengeBonus;
    this.meta.stars += stars;
    this.meta.badges = this.challenges.getCompletedIds();
    if (this.levelDirector.level >= 6) this.meta.endlessUnlocked = true;
    const campaignCleared =
      this.gameMode === "campaign" && this.levelDirector.level >= CAMPAIGN_MAX_LEVEL;
    if (campaignCleared) {
      this.meta.campaignCleared = true;
      this.meta.endlessUnlocked = true;
    }
    saveNeonMeta(this.meta);

    const levelScore = this.levelChallenges.levelScore(this.score - challengeBonus);

    this.haltCombatAudio();
    this.state = "levelInterstitial";
    this.interstitialTimer = 5;
    this.cb.onLevelComplete({
      level: this.levelDirector.level,
      levelScore,
      totalScore: this.score,
      lives: this.lives,
      stars,
      nextLevel: this.levelDirector.level + 1,
      levelChallenges: levelResults,
      challengeBonus,
      campaignCleared,
    });
  }

  togglePause(): void {
    if (this.state === "playing") {
      this.haltCombatAudio();
      this.state = "paused";
      this.cb.onPauseChange(true);
    } else if (this.state === "paused") {
      this.state = "playing";
      this.cb.onPauseChange(false);
    }
  }

  draw(): void {
    this.renderer.drawBackground(1 / 60);
    const sx = this.juice.shakeX;
    const sy = this.juice.shakeY;
    if (sx || sy) this.renderer.applyShake(sx, sy);
    this.renderer.drawShields(this.shields);
    const animTick = performance.now() / 1000;
    for (const d of this.drones) this.renderer.drawDrone(d, animTick);
    this.renderer.drawUFO(this.ufo);
    this.renderer.drawBoss(this.boss);
    for (const p of this.pickups) this.renderer.drawPowerUp(p);
    for (const p of this.projectiles) this.renderer.drawProjectile(p);
    const heatPct = this.weapons.heat / 100;
    this.renderer.drawBeam(this.weapons.beam.active ? this.weapons.beam : null, heatPct);
    this.renderer.drawGaussMuzzle();
    this.renderer.drawShockwaves();
    if (this.weapons.gaussRecoil > 0) {
      this.renderer.drawGaussRecoil(this.playerX, this.playerY, this.weapons.gaussRecoil);
    }
    const cloneOffsets = this.cloneTimer > 0 ? [-36, 36] : [];
    this.renderer.drawPlayer(
      this.playerX,
      this.playerY,
      this.weapons.tier,
      this.aegisShield,
      this.invulnTimer > 0,
      cloneOffsets
    );
    this.renderer.drawParticles(this.particles);
    if (sx || sy) this.renderer.clearShake();
  }

  getSaveData() {
    return {
      score: this.score,
      wave: this.levelDirector.level,
      lives: this.lives,
      difficulty: this.difficulty,
    };
  }
}
