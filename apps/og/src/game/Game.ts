import {
  ALIEN_POINTS,
  ALIEN_STEP_DOWN,
  BASE_ALIEN_H_STEP,
  BASE_ALIEN_TICK,
  BOSS_POINTS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COMBO_MAX,
  COMBO_WINDOW,
  DIFFICULTY_CONFIG,
  ENEMY_BULLET_SPEED,
  INVULN_TIME,
  MIN_ALIEN_TICK,
  PLAYER_FIRE_COOLDOWN,
  PLAYER_SPEED,
  PLAYER_Y,
  PLASMA_FIRE_COOLDOWN,
  POWERUP_DURATION,
  POWERUP_LABELS,
  RAPID_FIRE_COOLDOWN,
  SINGLE_BULLET_TOP_EXIT_Y,
  SINGLE_FIRE_COOLDOWN,
  SLOW_DURATION,
  SLOT_MAX_LIVES,
  UFO_POINTS,
  type Difficulty,
  type GameMode,
  type PowerUpType,
} from "../config";
import { AudioManager } from "../audio/AudioManager";
import { InputManager } from "../input/InputManager";
import { ParticleSystem } from "../render/ParticleSystem";
import { CanvasRenderer } from "../render/CanvasRenderer";
import { checkEnemyBulletHits, checkPlayerBulletHits } from "./CollisionSystem";
import { createShields, patchShield } from "./entities/ShieldGrid";
import type { Alien, Boss, Bullet, PowerUpDrop, Shield, UFO } from "./entities/types";
import { formationBounds } from "./formations";
import { LevelDirector } from "../progression/LevelDirector";
import { CAMPAIGN_MAX_LEVEL, getLevelConfig } from "../progression/levelScript";
import { bossMoveSpeed } from "../progression/bosses";
import { ChallengeTracker, OG_CHALLENGES } from "../progression/challenges";
import { EasterEggRegistry } from "../progression/easterEggs";
import type { LevelCompleteReport } from "../progression/levelComplete";
import { LevelChallengeTracker } from "../progression/levelChallenges";
import { loadOgMeta, saveOgMeta, type OgMeta } from "../progression/metaStore";
import {
  createVolley,
  playerBulletBlocksSlot,
  profileBypassesBulletSlot,
  profileFireCooldownMult,
  type GunVolley,
  GUN_VOLLEY_LABELS,
} from "./weaponVolley";
import { getRunConsumable, type RunConsumableId } from "../progression/runShop";
import { getShipProfile } from "../progression/ships";
import type { SlotMachineContext, SlotOutcome } from "../ui/slotMachine";

export type GameState =
  | "playing"
  | "paused"
  | "waveBanner"
  | "levelInterstitial"
  | "slotMachine"
  | "gameOver";

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onWaveChange: (level: number) => void;
  onComboChange: (combo: number, mult: number) => void;
  onWaveBanner: (text: string) => void;
  onLevelComplete: (report: LevelCompleteReport) => void;
  onToast: (text: string) => void;
  onGameOver: (score: number, level: number) => void;
  onPauseChange: (paused: boolean) => void;
  onCampaignClear: () => void;
  onSlotMachine: (ctx: SlotMachineContext) => void;
  onTokensChange: (tokens: number) => void;
  onRunPoolChange: (pool: number) => void;
  onEndlessMultChange: (mult: number) => void;
  onLoadoutChange: (ship: string, gun: string) => void;
}

const BASE_POWERUPS: PowerUpType[] = ["rapid", "spread", "shield", "slow"];

export class Game {
  state: GameState = "playing";
  score = 0;
  lives = 3;
  difficulty: Difficulty = "classic";
  gameMode: GameMode = "campaign";
  meta: OgMeta = loadOgMeta();

  playerX = CANVAS_WIDTH / 2;
  playerY = PLAYER_Y;
  invulnTimer = 0;
  fireCooldown = 0;
  canFire = true;
  cloneTimer = 0;
  plasmaTimer = 0;
  gunVolley: GunVolley = "single";
  gunVolleyTimer = 0;

  aliens: Alien[] = [];
  bullets: Bullet[] = [];
  shields: Shield[] = [];
  powerUps: PowerUpDrop[] = [];
  ufo: UFO | null = null;
  boss: Boss | null = null;

  alienDir = 1;
  alienTickTimer = 0;
  animTick = 0;
  ufoTimer = 8;
  bossWeakTimer = 0;

  comboTimer = 0;
  comboCount = 0;
  comboMult = 1;

  activePowerUp: PowerUpType | null = null;
  powerUpTimer = 0;
  slowTimer = 0;

  shakeX = 0;
  shakeY = 0;
  shakeTimer = 0;

  waveBannerTimer = 0;
  interstitialTimer = 0;
  pendingStars = 0;
  interstitialMessages: string[] = [];

  levelDirector = new LevelDirector();
  particles = new ParticleSystem();
  challenges: ChallengeTracker;
  levelChallenges = new LevelChallengeTracker();
  eggs: EasterEggRegistry;

  levelDamageThisLevel = false;
  runTokensEarned = 0;
  runTokenPool = 0;
  levelTokensEarned = 0;
  interstitialPurchases: RunConsumableId[] = [];
  pendingOverdrive = false;
  pendingTokenBoost = 0;
  pendingComboCharge = false;
  pendingLifeBuffer = false;
  pendingMagnetBurst = false;
  magnetBurstActive = false;
  bossPhase2Reached = false;
  rerolledChallengeIds = new Set<string>();

  constructor(
    public renderer: CanvasRenderer,
    public audio: AudioManager,
    public input: InputManager,
    private callbacks: GameCallbacks
  ) {
    this.challenges = new ChallengeTracker(
      loadOgMeta().badges,
      loadOgMeta().equippedShip,
      loadOgMeta().equippedGun,
      loadOgMeta().unlockedGuns.length
    );
    this.eggs = new EasterEggRegistry(0, false);
  }

  init(
    difficulty: Difficulty,
    mode: GameMode,
    continueRun?: { score: number; wave: number; lives: number }
  ): void {
    this.difficulty = difficulty;
    this.gameMode = mode;
    this.meta = loadOgMeta();
    const cfg = DIFFICULTY_CONFIG[difficulty];
    this.lives = continueRun?.lives ?? cfg.lives;
    if (this.meta.upgrades.includes("extraLife")) this.lives++;
    this.score = continueRun?.score ?? 0;
    if (continueRun) this.levelDirector.level = continueRun.wave;
    this.challenges = new ChallengeTracker(
      this.meta.badges,
      this.meta.equippedShip,
      this.meta.equippedGun,
      this.meta.unlockedGuns.length
    );
    this.eggs = new EasterEggRegistry(
      parseInt(localStorage.getItem("og_total_kills") || "0", 10),
      localStorage.getItem("og_secret_initials") === "1"
    );
    if (localStorage.getItem("og_konami_pending")) {
      this.eggs.activateKonamiRun();
      localStorage.removeItem("og_konami_pending");
    }
    if (
      localStorage.getItem("og_secret_initials") === "1" &&
      !this.meta.unlockedPickups.includes("clone")
    ) {
      this.meta.unlockedPickups.push("clone");
      saveOgMeta(this.meta);
    }
    this.shields = createShields(4);
    if (this.meta.upgrades.includes("shieldRepair")) {
      for (const s of this.shields) patchShield(s);
    }
    this.runTokensEarned = 0;
    this.runTokenPool = 0;
    this.startLevel();
    this.callbacks.onLivesChange(this.lives);
    this.callbacks.onScoreChange(this.score);
    this.callbacks.onWaveChange(this.levelDirector.level);
    this.callbacks.onTokensChange(this.meta.tokens);
    this.callbacks.onRunPoolChange(this.runTokenPool);
    this.callbacks.onEndlessMultChange(this.getEndlessTokenMult());
    this.callbacks.onLoadoutChange(this.getShipLabel(), this.getGunLabel());
  }

  private getShipProfile() {
    return getShipProfile(this.meta.equippedShip);
  }

  private grantTokens(amount: number, toast?: string, playSecret = false): void {
    if (amount <= 0) return;
    const mult = this.getEndlessTokenMult();
    const payout = Math.max(1, Math.round(amount * mult));
    this.meta.tokens += payout;
    this.runTokensEarned += payout;
    this.runTokenPool += payout;
    this.levelTokensEarned += payout;
    saveOgMeta(this.meta);
    this.callbacks.onTokensChange(this.meta.tokens);
    this.callbacks.onRunPoolChange(this.runTokenPool);
    if (toast) this.callbacks.onToast(toast);
    if (playSecret) this.audio.play("secret");
  }

  private getEndlessTokenMult(): number {
    if (this.gameMode !== "endless") return 1;
    return 1 + Math.min(1.5, (this.levelDirector.level - 1) * 0.08);
  }

  spendInterstitialTokens(id: RunConsumableId): boolean {
    if (this.state !== "levelInterstitial") return false;
    const item = getRunConsumable(id);
    const count = this.interstitialPurchases.filter((p) => p === id).length;
    const max = item.maxPerInterstitial ?? 99;
    if (count >= max || this.runTokenPool < item.cost) return false;

    this.runTokenPool -= item.cost;
    this.interstitialPurchases.push(id);
    this.callbacks.onRunPoolChange(this.runTokenPool);

    switch (id) {
      case "shield_patch":
        for (const s of this.shields) patchShield(s);
        this.callbacks.onToast("Shields patched!");
        break;
      case "overdrive":
        this.pendingOverdrive = true;
        this.callbacks.onToast("Overdrive armed!");
        break;
      case "token_boost":
        this.pendingTokenBoost += 3;
        this.callbacks.onToast("+3 tokens on next clear!");
        break;
      case "combo_charge":
        this.pendingComboCharge = true;
        this.callbacks.onToast("Combo charge armed — 3× start!");
        break;
      case "life_buffer":
        this.pendingLifeBuffer = true;
        this.callbacks.onToast("Life buffer armed!");
        break;
      case "magnet_burst":
        this.pendingMagnetBurst = true;
        this.callbacks.onToast("Magnet burst — +2 ◎ per kill next level!");
        break;
      case "challenge_reroll": {
        const failed = this.levelChallenges
          .evaluate()
          .filter((c) => !c.passed && !this.rerolledChallengeIds.has(c.id));
        if (failed.length > 0) {
          const pick = failed[Math.floor(Math.random() * failed.length)]!;
          this.rerolledChallengeIds.add(pick.id);
          const half = Math.floor(pick.bonus / 2);
          this.score += half;
          this.callbacks.onScoreChange(this.score);
          this.callbacks.onToast(`Reroll: +${half} (${pick.label.split("—")[0]?.trim()})`);
        } else {
          this.score += 50;
          this.callbacks.onScoreChange(this.score);
          this.callbacks.onToast("Reroll: +50 consolation");
        }
        break;
      }
    }
    return true;
  }

  private handleEggReward(reward: ReturnType<EasterEggRegistry["onScore"]>): void {
    if (!reward) return;
    if (reward.tokens) this.grantTokens(reward.tokens, reward.message, true);
    else this.callbacks.onToast(reward.message);
    if (reward.message.includes("Phantom") && !this.meta.unlockedShips.includes("phantom")) {
      this.meta.unlockedShips.push("phantom");
      saveOgMeta(this.meta);
    }
  }

  startLevel(): void {
    this.challenges.startLevel();
    this.levelChallenges.startLevel(this.score);
    this.levelDamageThisLevel = false;
    this.levelTokensEarned = 0;
    this.interstitialPurchases = [];
    this.rerolledChallengeIds.clear();
    this.bossPhase2Reached = false;
    this.magnetBurstActive = this.pendingMagnetBurst;
    this.pendingMagnetBurst = false;
    this.bullets = [];
    this.canFire = true;
    this.fireCooldown = 0;
    this.gunVolley = "single";
    this.gunVolleyTimer = 0;
    const enc = this.levelDirector.encounter;
    if (enc === "bigBoss") {
      this.aliens = [];
      this.boss = this.levelDirector.spawnBigBoss();
      this.audio.playBossSpawn("big");
    } else if (enc === "miniBoss") {
      this.aliens = [];
      this.boss = this.levelDirector.spawnMiniBoss();
      this.audio.playBossSpawn("mini");
    } else {
      this.boss = null;
      this.aliens = this.levelDirector.spawnAliens(this.difficulty);
    }
    this.showBanner(this.levelDirector.getBanner());
    this.alienDir = 1;
    this.alienTickTimer = 0;
    this.ufoTimer = 6 + Math.random() * 8;

    if (this.pendingOverdrive) {
      this.pendingOverdrive = false;
      this.applyPowerUp("rapid");
      this.powerUpTimer = 8;
      this.callbacks.onToast("Overdrive engaged!");
    }
    if (this.pendingComboCharge) {
      this.pendingComboCharge = false;
      this.comboMult = 3;
      this.comboCount = 3;
      this.comboTimer = COMBO_WINDOW;
      this.callbacks.onComboChange(this.comboCount, this.comboMult);
      this.callbacks.onToast("Combo charge — 3× active!");
    }
  }

  showBanner(text: string): void {
    this.state = "waveBanner";
    this.waveBannerTimer = 1.4;
    this.callbacks.onWaveBanner(text);
  }

  update(dt: number): void {
    if (this.state === "gameOver") return;
    this.eggs.update(dt);
    this.handleEggReward(this.eggs.onScore(this.score));

    if (this.gunVolleyTimer > 0) {
      this.gunVolleyTimer -= dt;
      if (this.gunVolleyTimer <= 0) this.gunVolley = "single";
    }

    if (this.state === "levelInterstitial") {
      this.interstitialTimer -= dt;
      if (this.interstitialTimer <= 0) {
        if (
          this.gameMode === "campaign" &&
          this.levelDirector.level >= CAMPAIGN_MAX_LEVEL
        ) {
          this.meta.campaignCleared = true;
          this.meta.endlessUnlocked = true;
          saveOgMeta(this.meta);
          this.callbacks.onCampaignClear();
          this.endGame(true);
          return;
        }
        this.levelDirector.nextLevel();
        this.callbacks.onWaveChange(this.levelDirector.level);
        this.callbacks.onEndlessMultChange(this.getEndlessTokenMult());
        this.startLevel();
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

    if (this.state === "slotMachine") {
      this.particles.update(dt);
      return;
    }

    if (this.input.consumePause()) this.togglePause();
    if (this.state === "paused") {
      this.particles.update(dt);
      return;
    }

    this.updateShake(dt);
    this.updateBullets(dt);
    this.updatePlayer(dt);
    this.updateAliens(dt);
    this.updateUfo(dt);
    this.updateBoss(dt);
    this.updatePowerUpDrops(dt);
    this.updateCombo(dt);
    this.checkLevelClear();
    this.particles.update(dt);
  }

  togglePause(): void {
    if (this.state === "slotMachine") return;
    if (this.state === "playing") {
      this.state = "paused";
      this.callbacks.onPauseChange(true);
    } else if (this.state === "paused") {
      this.state = "playing";
      this.callbacks.onPauseChange(false);
    }
  }

  private updateShake(dt: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      this.shakeX = (Math.random() - 0.5) * 8;
      this.shakeY = (Math.random() - 0.5) * 8;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  addShake(duration = 0.2): void {
    if (this.particles.reducedMotion) return;
    this.shakeTimer = duration;
  }

  private resolveFireProfile(): GunVolley {
    if (this.plasmaTimer > 0) return "plasma";
    if (this.gunVolleyTimer > 0) return this.gunVolley;
    if (this.activePowerUp === "spread") return "spread";
    if (this.activePowerUp === "rapid") return "rapid";
    return this.meta.equippedGun as GunVolley;
  }

  private updatePlayer(dt: number): void {
    const ship = this.getShipProfile();
    const axis = this.input.getMoveAxis();
    this.playerX += axis * PLAYER_SPEED * ship.speedMult * dt;
    this.playerX = Math.max(24, Math.min(CANVAS_WIDTH - 24, this.playerX));

    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.eggs.isInvulnBuff()) this.invulnTimer = Math.max(this.invulnTimer, 0.1);

    if (this.plasmaTimer > 0) this.plasmaTimer -= dt;
    if (this.cloneTimer > 0) this.cloneTimer -= dt;

    const profile = this.resolveFireProfile();

    const rapid = profile === "rapid";
    const plasma = profile === "plasma" || this.plasmaTimer > 0;
    const bypassSlot = profileBypassesBulletSlot(profile);
    const slotOpen = bypassSlot || !playerBulletBlocksSlot(this.bullets);
    this.canFire = slotOpen;

    const cooldown =
      (rapid
        ? RAPID_FIRE_COOLDOWN
        : plasma
          ? PLASMA_FIRE_COOLDOWN
          : bypassSlot
            ? PLAYER_FIRE_COOLDOWN
            : SINGLE_FIRE_COOLDOWN) *
      profileFireCooldownMult(profile) *
      ship.fireCooldownMult *
      (this.meta.upgrades.includes("fastShot") ? 0.82 : 1) *
      DIFFICULTY_CONFIG[this.difficulty].fireCooldownMult;
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    if (!this.input.isFirePressed() || this.fireCooldown > 0 || !slotOpen) return;

    this.fireVolley(profile);
    if (this.cloneTimer > 0) {
      this.bullets.push(...createVolley(profile, this.playerX - 36, this.playerY));
      this.bullets.push(...createVolley(profile, this.playerX + 36, this.playerY));
    }
    this.fireCooldown = cooldown;
    this.canFire = bypassSlot;
    this.audio.playShoot(profile);
  }

  private fireVolley(profile: GunVolley): void {
    const volley = createVolley(profile, this.playerX, this.playerY);
    for (const b of volley) {
      this.levelChallenges.onShotFired();
      this.bullets.push(b);
    }
    if (!volley.some((b) => b.spread)) this.canFire = false;

    if (profile === "shockwave") {
      this.addShake(0.14);
      this.particles.burst(this.playerX, this.playerY - 20, "#7bff6e", 10);
    } else if (profile === "homing") {
      this.particles.burst(this.playerX, this.playerY - 18, "#ff2d95", 6);
    } else if (profile === "scatter" || profile === "plasma") {
      this.addShake(0.08);
    }
  }

  private updateBullets(dt: number): void {
    const ship = this.getShipProfile();
    for (const b of this.bullets) {
      if (!b.active) continue;

      if (b.homing && b.fromPlayer) {
        let targetX = 0;
        let targetY = 0;
        let best = Infinity;
        for (const a of this.aliens) {
          if (!a.alive) continue;
          const d = (a.x + 14 - b.x) ** 2 + (a.y + 11 - b.y) ** 2;
          if (d < best) {
            best = d;
            targetX = a.x + 14;
            targetY = a.y + 11;
          }
        }
        if (this.boss?.active) {
          const d = (this.boss.x - b.x) ** 2 + (this.boss.y - b.y) ** 2;
          if (d < best) {
            targetX = this.boss.x;
            targetY = this.boss.y;
          }
        }
        if (best < Infinity) {
          const dx = targetX - b.x;
          const dy = targetY - b.y;
          const len = Math.hypot(dx, dy) || 1;
          b.vx = (b.vx ?? 0) * 0.9 + (dx / len) * 240 * dt;
        }
      }

      b.x += (b.vx ?? 0) * dt;
      b.y += b.vy * dt;
      if (
        b.fromPlayer &&
        !b.spread &&
        b.y < SINGLE_BULLET_TOP_EXIT_Y
      ) {
        b.active = false;
      } else if (b.y < -20 || b.y > CANVAS_HEIGHT + 20) {
        b.active = false;
      }

      if (b.fromPlayer) {
        const hit = checkPlayerBulletHits(b, this.aliens, this.shields, this.ufo, this.boss);
        if (hit.shield) this.addShake(0.05);
        if (hit.ufo && this.ufo) {
          this.levelChallenges.onShotHit();
          const pts = this.ufo.points;
          this.grantTokens(Math.max(2, Math.floor(pts / 40)));
          this.addScore(pts);
          this.particles.burst(this.ufo.x, this.ufo.y, "#ffd24a", 16);
          this.ufo.active = false;
          this.audio.play("explosion");
          this.maybeDropPowerUp(this.ufo.x, this.ufo.y);
        }
        if (hit.boss && this.boss) {
          this.levelChallenges.onShotHit();
          this.boss.hp -= this.boss.kind === "mini" ? 2 : 3;
          this.boss.weakPoint = Math.floor(Math.random() * 3);
          this.audio.playBossHit(this.boss.kind);
          if (this.boss.hp <= this.boss.maxHp * 0.5 && this.boss.kind === "big") {
            this.boss.phase = 2;
            this.bossPhase2Reached = true;
            this.audio.play("alienAggro");
          }
          if (this.boss.hp <= 0) {
            this.grantTokens(this.boss.kind === "mini" ? 8 : 15);
            this.addScore(BOSS_POINTS);
            this.particles.burst(this.boss.x, this.boss.y, "#ff2d95", 24);
            const bossKind = this.boss.kind;
            this.boss.active = false;
            this.audio.play("bossDefeat");
            if (!this.levelDamageThisLevel) {
              this.handleEggReward(
                this.eggs.onBossFlawless(bossKind, this.bossPhase2Reached)
              );
            }
          }
        }
        if (hit.alien) {
          this.levelChallenges.onShotHit();
          hit.alien.alive = false;
          this.handleEggReward(this.eggs.onKill());
          localStorage.setItem("og_total_kills", String(this.eggs.totalKills));
          if (this.eggs.totalKills >= 100) {
            localStorage.setItem("og_secret_initials", "1");
          }
          const killTokens =
            1 +
            (this.meta.upgrades.includes("tokenMagnet") ? 1 : 0) +
            (this.magnetBurstActive ? 2 : 0);
          this.grantTokens(killTokens);
          this.addScore(ALIEN_POINTS[hit.alien.type] ?? 10);
          this.particles.burst(hit.alien.x + 14, hit.alien.y + 11, "#00f0ff", 14);
          if (killTokens > 0) {
            this.particles.burst(hit.alien.x + 14, hit.alien.y + 4, "#ffd24a", 4 + killTokens);
          }
          this.audio.play("explosion");
          this.registerComboKill();
          this.maybeDropPowerUp(hit.alien.x, hit.alien.y);
        }
        const pierce = (b as Bullet & { pierce?: boolean }).pierce;
        if (!pierce) {
          /* bullet deactivated by collision */
        }
      } else {
        const result = checkEnemyBulletHits(
          b,
          this.playerX,
          this.playerY,
          this.shields,
          this.invulnTimer > 0 || this.eggs.isInvulnBuff(),
          ship.hitboxScale
        );
        if (result === "player") this.hitPlayer();
      }
    }
    this.bullets = this.bullets.filter((b) => b.active);
    this.canFire = !playerBulletBlocksSlot(this.bullets);
  }

  private updateAliens(dt: number): void {
    const alive = this.aliens.filter((a) => a.alive);
    if (!alive.length) return;

    const speedMult = this.levelDirector.speedMult(this.difficulty);
    const slow = this.slowTimer > 0 ? 0.4 : 1;
    const levelPace = 1 + Math.min(0.14, (this.levelDirector.level - 1) * 0.018);
    const tick = Math.max(
      MIN_ALIEN_TICK,
      (BASE_ALIEN_TICK - (55 - alive.length) * 0.008) / speedMult / slow / levelPace
    );

    this.alienTickTimer += dt;
    if (this.alienTickTimer >= tick) {
      this.alienTickTimer = 0;
      this.audio.play("alienStep");
      const bounds = formationBounds(this.aliens);
      let hitEdge = false;
      const step = BASE_ALIEN_H_STEP * speedMult;
      if (bounds.maxX >= CANVAS_WIDTH - 16 && this.alienDir > 0) {
        this.alienDir = -1;
        hitEdge = true;
      } else if (bounds.minX <= 16 && this.alienDir < 0) {
        this.alienDir = 1;
        hitEdge = true;
      }
      for (const a of alive) {
        if (hitEdge) a.y += ALIEN_STEP_DOWN;
        else a.x += this.alienDir * step;
      }
      if (bounds.maxY >= this.playerY - 40) this.hitPlayer();

      const fireChance =
        DIFFICULTY_CONFIG[this.difficulty].enemyFireChance *
        this.levelDirector.fireMult(this.difficulty) *
        0.15;
      if (Math.random() < fireChance) {
        const bottom = this.getBottomRowAliens();
        if (bottom.length) {
          const shooter = bottom[Math.floor(Math.random() * bottom.length)]!;
          this.bullets.push({
            x: shooter.x + 14,
            y: shooter.y + 22,
            vy: ENEMY_BULLET_SPEED,
            fromPlayer: false,
            active: true,
          });
          this.audio.play("enemyShoot");
          if (alive.length < 12 && Math.random() < 0.35) {
            this.audio.play("alienAggro");
          }
        }
      }
    }
  }

  private getBottomRowAliens(): Alien[] {
    const byCol = new Map<number, Alien>();
    for (const a of this.aliens) {
      if (!a.alive) continue;
      const col = Math.round(a.x / 36);
      const existing = byCol.get(col);
      if (!existing || a.y > existing.y) byCol.set(col, a);
    }
    return [...byCol.values()];
  }

  private updateUfo(dt: number): void {
    if (this.eggs.consumeGoldUfo() && !this.ufo?.active) {
      this.ufo = {
        x: -40,
        y: 48,
        direction: 1,
        active: true,
        points: 500,
      };
    }
    this.ufoTimer -= dt;
    if (
      !this.ufo?.active &&
      this.ufoTimer <= 0 &&
      this.levelDirector.encounter === "standard"
    ) {
      this.ufo = {
        x: Math.random() < 0.5 ? -40 : CANVAS_WIDTH + 40,
        y: 48,
        direction: 1,
        active: true,
        points: UFO_POINTS[Math.floor(Math.random() * UFO_POINTS.length)]!,
      };
      if (this.ufo.x < 0) this.ufo.direction = 1;
      else this.ufo.direction = -1;
      this.ufoTimer = 8 + Math.random() * 7;
      this.audio.play("ufo");
    }
    if (this.ufo?.active) {
      this.ufo.x += this.ufo.direction * 90 * dt;
      if (this.ufo.x < -60 || this.ufo.x > CANVAS_WIDTH + 60) {
        this.ufo.active = false;
      }
    }
  }

  private updateBoss(dt: number): void {
    if (!this.boss?.active) return;
    const spd = bossMoveSpeed(this.boss.kind);
    this.boss.x += this.boss.direction * spd * dt;
    const margin = this.boss.kind === "mini" ? 60 : 80;
    if (this.boss.x < margin || this.boss.x > CANVAS_WIDTH - margin) {
      this.boss.direction *= -1;
    }
    this.bossWeakTimer += dt;
    if (this.bossWeakTimer > 2) {
      this.boss.weakPoint = Math.floor(Math.random() * 3);
      this.bossWeakTimer = 0;
    }
    const rate = this.boss.kind === "mini" ? 0.03 : this.boss.phase === 2 ? 0.05 : 0.02;
    if (Math.random() < rate) {
      this.bullets.push({
        x: this.boss.x + (Math.random() - 0.5) * 80,
        y: this.boss.y + 30,
        vy: ENEMY_BULLET_SPEED * (this.boss.phase === 2 ? 1.3 : 1.1),
        fromPlayer: false,
        active: true,
      });
      this.audio.play("enemyShoot");
    }
    if (this.boss.y > this.playerY - 60) this.hitPlayer();
  }

  private updatePowerUpDrops(dt: number): void {
    for (const p of this.powerUps) {
      if (!p.active) continue;
      p.y += p.vy * dt;
      if (p.y > CANVAS_HEIGHT) p.active = false;
      if (
        Math.abs(p.x - this.playerX) < 28 &&
        Math.abs(p.y - this.playerY) < 24
      ) {
        p.active = false;
        this.applyPowerUp(p.type);
      }
    }
    this.powerUps = this.powerUps.filter((p) => p.active);
  }

  private getAvailablePowerups(): PowerUpType[] {
    const list: PowerUpType[] = [...BASE_POWERUPS, "twin", "triple"];
    if (this.levelDirector.level >= 2) list.push("quint");
    if (this.levelDirector.level >= 4) list.push("hex");
    if (this.meta.unlockedPickups.includes("plasma") || this.challenges.completed.has("no_hit_l3"))
      list.push("plasma");
    if (this.levelDirector.level >= 3) list.push("bunker");
    if (this.meta.unlockedPickups.includes("clone")) list.push("clone");
    return list;
  }

  private maybeDropPowerUp(x: number, y: number): void {
    if (Math.random() > 0.12) return;
    const types = this.getAvailablePowerups();
    const type = types[Math.floor(Math.random() * types.length)]!;
    this.powerUps.push({ x, y, vy: 60, type, active: true });
  }

  private applyPowerUp(type: PowerUpType): void {
    this.audio.play("powerup");
    if (type === "shield") {
      for (const s of this.shields) patchShield(s);
      return;
    }
    if (type === "bunker") {
      const sh = createShields(1)[0]!;
      sh.x = CANVAS_WIDTH / 2 - 24;
      sh.y = 400;
      this.shields.push(sh);
      return;
    }
    if (type === "slow") {
      this.slowTimer = SLOW_DURATION;
      return;
    }
    if (type === "plasma") {
      this.plasmaTimer = 6;
      this.gunVolley = "plasma";
      return;
    }
    if (type === "clone") {
      this.cloneTimer = 5;
      return;
    }
    if (type === "twin" || type === "triple" || type === "quint" || type === "hex") {
      this.gunVolley = type;
      this.gunVolleyTimer = POWERUP_DURATION;
      return;
    }
    if (type === "rapid" || type === "spread") {
      this.gunVolley = type;
      this.gunVolleyTimer = POWERUP_DURATION;
      return;
    }
    this.activePowerUp = type;
    this.powerUpTimer = POWERUP_DURATION;
  }

  getGunLabel(): string {
    const p = this.resolveFireProfile();
    return GUN_VOLLEY_LABELS[p];
  }

  getShipLabel(): string {
    return this.getShipProfile().name;
  }

  private updateCombo(dt: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboMult = 1;
        this.callbacks.onComboChange(0, 1);
      }
    }
  }

  private registerComboKill(): void {
    const comboWindow =
      COMBO_WINDOW + (this.meta.upgrades.includes("comboExtend") ? 0.5 : 0);
    this.comboTimer = comboWindow;
    this.comboCount++;
    this.comboMult = Math.min(COMBO_MAX, 1 + Math.floor(this.comboCount / 2));
    this.challenges.onCombo(this.comboMult);
    this.callbacks.onComboChange(this.comboCount, this.comboMult);
    if (this.comboMult >= 4 && this.comboMult % 2 === 0) {
      this.particles.burst(this.playerX, this.playerY - 24, "#ffd24a", 8 + this.comboMult);
      this.audio.play("combo");
    }
  }

  private addScore(base: number): void {
    this.score += base * this.comboMult;
    this.callbacks.onScoreChange(this.score);
  }

  private hitPlayer(): void {
    if (this.invulnTimer > 0 || this.eggs.isInvulnBuff()) return;
    this.levelDamageThisLevel = true;
    this.challenges.onDamage();
    this.levelChallenges.onDamage();

    if (this.pendingLifeBuffer) {
      this.pendingLifeBuffer = false;
      this.invulnTimer = INVULN_TIME;
      this.addShake(0.2);
      this.audio.play("powerup");
      this.callbacks.onToast("Life buffer absorbed the hit!");
      this.respawnAfterHit();
      return;
    }

    this.lives--;
    this.invulnTimer = INVULN_TIME;
    this.addShake(0.35);
    this.audio.play("playerHit");
    this.particles.burst(this.playerX, this.playerY, "#ff4466", 20);
    this.callbacks.onLivesChange(this.lives);
    this.comboCount = 0;
    this.comboMult = 1;
    this.callbacks.onComboChange(0, 1);
    this.respawnAfterHit();

    if (this.lives > 0) return;

    this.state = "slotMachine";
    this.callbacks.onSlotMachine({
      lives: this.lives,
      maxLives: SLOT_MAX_LIVES,
      powerUpPool: this.getAvailablePowerups(),
      isFinalSpin: true,
      luckySlot: this.meta.upgrades.includes("luckySlot"),
    });
  }

  /** Clear player shots and reset firing so respawn is fair. */
  private respawnAfterHit(): void {
    this.bullets = this.bullets.filter((b) => !b.fromPlayer);
    this.canFire = true;
    this.fireCooldown = 0;
  }

  resolveSlotResult(outcome: SlotOutcome): void {
    if (this.state !== "slotMachine") return;

    if (outcome.type === "life") {
      this.lives = Math.min(this.lives + 1, SLOT_MAX_LIVES);
      this.callbacks.onLivesChange(this.lives);
      this.callbacks.onToast("+1 LIFE!");
    } else if (outcome.type === "powerup") {
      this.applyPowerUp(outcome.powerUp);
      this.callbacks.onToast(POWERUP_LABELS[outcome.powerUp]);
    }

    this.invulnTimer = INVULN_TIME;
    this.respawnAfterHit();

    if (this.lives <= 0) {
      this.endGame();
      return;
    }

    this.state = "playing";
  }

  private checkLevelClear(): void {
    if (this.state !== "playing") return;
    const enc = this.levelDirector.encounter;
    if (enc !== "standard") {
      if (this.boss?.active) return;
    } else if (this.aliens.some((a) => a.alive)) {
      return;
    }

    this.audio.play("waveClear");
    this.particles.burst(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, "#00f0ff", 28);
    this.particles.burst(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3, "#ffd24a", 16);
    this.addShake(0.25);
    const flawless = !this.levelDamageThisLevel;
    const isBoss = enc !== "standard";
    let stars = 1;
    if (flawless) stars = 2;
    if (isBoss) stars = 3;

    if (enc === "standard") {
      const cfg = getLevelConfig(this.levelDirector.level);
      this.handleEggReward(
        this.eggs.onFormationClear(
          cfg.formation,
          flawless,
          this.eggs.isArcCodeActive()
        )
      );
    }

    const levelResults = this.levelChallenges.evaluate();
    let challengeBonus = levelResults.reduce((s, c) => s + (c.passed ? c.bonus : 0), 0);

    const newChallenges = this.challenges.checkOnLevelComplete(this.levelDirector.level);
    for (const c of newChallenges) {
      challengeBonus += c.bonusScore;
      const def = OG_CHALLENGES.find((ch) => ch.id === c.id);
      if (def?.starReward) {
        this.meta.stars += def.starReward;
        this.callbacks.onToast(`${def.title} — +${def.starReward} ★`);
      }
      if (c.id === "no_hit_l3" && !this.meta.unlockedPickups.includes("plasma")) {
        this.meta.unlockedPickups.push("plasma");
      }
    }
    this.score += challengeBonus;
    this.meta.stars += stars;
    const levelTokens = 5 + stars * 3;
    if (this.pendingTokenBoost > 0) {
      this.grantTokens(this.pendingTokenBoost);
      this.pendingTokenBoost = 0;
    }
    this.grantTokens(levelTokens);
    this.handleEggReward(this.eggs.onLevelComplete(this.levelDirector.level));
    if (isBoss) {
      this.handleEggReward(
        this.eggs.onBossDefeat(this.levelDirector.level, enc === "bigBoss")
      );
    }
    this.meta.badges = this.challenges.getCompletedIds();
    if (this.levelDirector.level === 6) this.meta.endlessUnlocked = true;
    if (this.levelDirector.level >= CAMPAIGN_MAX_LEVEL && this.gameMode === "campaign") {
      this.meta.campaignCleared = true;
      this.meta.endlessUnlocked = true;
    }
    saveOgMeta(this.meta);

    const levelScore = this.levelChallenges.levelScore(this.score - challengeBonus);
    const campaignCleared =
      this.gameMode === "campaign" &&
      this.levelDirector.level >= CAMPAIGN_MAX_LEVEL;

    const tokensEarnedThisLevel = this.levelTokensEarned;
    const endlessTokenMult = this.getEndlessTokenMult();

    this.state = "levelInterstitial";
    this.interstitialTimer = 5;
    this.callbacks.onLevelComplete({
      level: this.levelDirector.level,
      levelScore,
      totalScore: this.score,
      lives: this.lives,
      stars,
      nextLevel: this.levelDirector.level + 1,
      levelChallenges: levelResults,
      challengeBonus,
      campaignCleared,
      tokensEarnedThisLevel,
      walletTokens: this.meta.tokens,
      runTokenPool: this.runTokenPool,
      endlessTokenMult,
    });
    this.callbacks.onEndlessMultChange(this.getEndlessTokenMult());
    this.callbacks.onScoreChange(this.score);
  }

  private endGame(campaignWin = false): void {
    this.state = "gameOver";
    if (!campaignWin) this.audio.play("gameOver");
    this.callbacks.onGameOver(this.score, this.levelDirector.level);
  }

  draw(): void {
    const { renderer, particles } = this;
    renderer.drawBackground(1 / 60);
    if (this.shakeTimer > 0) renderer.applyShake(this.shakeX, this.shakeY);
    renderer.drawShields(this.shields);
    renderer.drawAliens(this.aliens, this.animTick);
    renderer.drawUFO(this.ufo);
    renderer.drawBoss(this.boss);
    for (const p of this.powerUps) renderer.drawPowerUp(p);
    renderer.drawBullets(this.bullets);
    const ship = this.getShipProfile();
    renderer.drawPlayer(
      this.playerX,
      this.playerY,
      this.invulnTimer > 0,
      ship.color,
      ship.spriteKey
    );
    if (this.cloneTimer > 0) {
      renderer.drawPlayer(this.playerX - 36, this.playerY, true, ship.color, ship.spriteKey);
      renderer.drawPlayer(this.playerX + 36, this.playerY, true, ship.color, ship.spriteKey);
    }
    renderer.drawParticles(particles);
    if (this.shakeTimer > 0) renderer.clearShake();
  }

  getSaveData(): { score: number; wave: number; lives: number; difficulty: Difficulty } {
    return {
      score: this.score,
      wave: this.levelDirector.level,
      lives: this.lives,
      difficulty: this.difficulty,
    };
  }
}
