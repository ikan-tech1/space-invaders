import { CANVAS_HEIGHT, CANVAS_WIDTH, type Difficulty, type GameMode } from "../config";
import { AudioManager } from "../audio/AudioManager";
import { GameLoop } from "../game/GameLoop";
import { NeonGame } from "../game/NeonGame";
import { InputManager } from "../input/InputManager";
import { getSector } from "../narrative/campaignScript";
import { getActiveTrailReward } from "../progression/hangarCodes";
import { loadNeonMeta } from "../progression/metaStore";
import { NeonRenderer } from "../render/NeonRenderer";
import type { LocalStorageRepo, SavedRun } from "../storage/LocalStorageRepo";
import { showLevelCompleteModal } from "../ui/levelCompleteModal";
import { showSectorBriefingModal } from "../ui/sectorBriefingModal";

export interface GameScreenDeps {
  repo: LocalStorageRepo;
  difficulty: Difficulty;
  gameMode: GameMode;
  continueRun: boolean;
  onGameOver: (score: number, wave: number, maxTier: number) => void;
}

export class GameScreen {
  private canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  private layer = document.getElementById("game-layer") as HTMLElement;
  private levelModal = document.getElementById("level-complete-modal") as HTMLElement;
  private briefingModal = document.getElementById("sector-briefing-modal") as HTMLElement;
  private loop: GameLoop | null = null;
  private game: NeonGame | null = null;
  private input: InputManager | null = null;
  private saveIv: ReturnType<typeof setInterval> | null = null;

  constructor(private deps: GameScreenDeps) {}

  start(): void {
    const settings = this.deps.repo.getSettings();
    const reduced =
      settings.reducedFx ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.layer.classList.remove("hidden");
    document.getElementById("screen-root")!.classList.add("hidden");
    this.levelModal.classList.add("hidden");
    this.levelModal.innerHTML = "";
    this.briefingModal.classList.add("hidden");
    this.briefingModal.innerHTML = "";

    const pauseOverlay = document.getElementById("pause-overlay")!;
    pauseOverlay.classList.add("hidden");

    const ctx = this.canvas.getContext("2d")!;
    const renderer = new NeonRenderer(ctx);
    renderer.vfx.setPlayerTrail(getActiveTrailReward(loadNeonMeta().unlockedTrails));
    this.fit(renderer);

    const audio = new AudioManager();
    audio.volume = settings.volume;
    audio.muted = settings.muted;

    this.input = new InputManager();
    this.input.bindTouch(
      document.getElementById("touch-move")!,
      document.getElementById("touch-fire")!,
      document.getElementById("touch-pause")!,
      settings.touchScale
    );

    const el = {
      score: document.getElementById("hud-score")!,
      wave: document.getElementById("hud-wave")!,
      lives: document.getElementById("hud-lives")!,
      weapon: document.getElementById("hud-weapon")!,
      xp: document.getElementById("hud-xp-fill")!,
      heat: document.getElementById("hud-heat-fill")!,
      combo: document.getElementById("hud-combo")!,
      powerups: document.getElementById("hud-powerups")!,
      pickupToast: document.getElementById("pickup-toast")!,
      pickupIcon: document.getElementById("pickup-toast-icon")!,
      pickupText: document.getElementById("pickup-toast-text")!,
      pauseWeapon: document.getElementById("pause-weapon")!,
      pausePowerups: document.getElementById("pause-powerups")!,
      banner: document.getElementById("wave-banner")!,
      bossInbound: document.getElementById("boss-inbound")!,
      pause: document.getElementById("pause-overlay")!,
      levelup: document.getElementById("levelup-flash")!,
    };

    let pickupToastTimer: ReturnType<typeof setTimeout> | null = null;
    let lastWeaponName = "Pulse Carbine";
    let lastPowerups: { label: string; timer: number; max: number }[] = [];

    const renderPowerupChips = (
      container: HTMLElement,
      items: { label: string; timer: number; max: number }[],
      chipClass: string
    ) => {
      container.innerHTML = items
        .map((item) => {
          const pct = Math.ceil((item.timer / item.max) * 100);
          return `<span class="${chipClass}">${item.label} ${pct}%</span>`;
        })
        .join("");
    };

    let saved: SavedRun | undefined;
    if (this.deps.continueRun) {
      const s = this.deps.repo.getSavedRun();
      if (s) saved = s;
    }

    this.game = new NeonGame(renderer, audio, this.input, {
      onScoreChange: (s) => {
        el.score.textContent = s.toLocaleString();
      },
      onLivesChange: (l) => {
        el.lives.textContent = "♥".repeat(Math.max(0, l)) || "—";
      },
      onWaveChange: (w, sectorTitle) => {
        el.wave.textContent = sectorTitle ? sectorTitle.toUpperCase() : `LEVEL ${w}`;
      },
      onWeaponChange: (_tier, name, xpPct, heat) => {
        lastWeaponName = name;
        el.weapon.textContent = name;
        (el.xp as HTMLElement).style.width = `${xpPct * 100}%`;
        (el.heat as HTMLElement).style.width = `${heat * 100}%`;
      },
      onComboChange: (m) => {
        if (m > 1) {
          el.combo.classList.remove("hidden");
          el.combo.textContent = `CHAIN ×${m}`;
          el.combo.classList.remove("combo-pulse");
          void el.combo.offsetWidth;
          el.combo.classList.add("combo-pulse");
        } else el.combo.classList.add("hidden");
      },
      onWaveBanner: (text) => {
        el.banner.textContent = text;
        el.banner.classList.remove("hidden");
        setTimeout(() => el.banner.classList.add("hidden"), 1500);
      },
      onBossInbound: (text) => {
        el.bossInbound.textContent = text;
        el.bossInbound.classList.remove("hidden");
        setTimeout(() => el.bossInbound.classList.add("hidden"), 2000);
      },
      onSectorBriefing: (level, onContinue) => {
        audio.haltCombat();
        const sector = getSector(level);
        this.briefingModal.classList.remove("hidden");
        showSectorBriefingModal(this.briefingModal, sector, () => {
          this.briefingModal.classList.add("hidden");
          onContinue();
        });
      },
      onLevelComplete: (report) => {
        audio.haltCombat();
        this.levelModal.classList.remove("hidden");
        showLevelCompleteModal(this.levelModal, report, () => {
          this.levelModal.classList.add("hidden");
          if (this.game) this.game.interstitialTimer = 0;
        });
      },
      onLevelUp: (name) => {
        el.levelup.textContent = `${name} ONLINE`;
        el.levelup.classList.remove("hidden");
        el.levelup.classList.remove("levelup-pulse");
        void el.levelup.offsetWidth;
        el.levelup.classList.add("levelup-pulse");
        setTimeout(() => el.levelup.classList.add("hidden"), 2000);
      },
      onCampaignClear: () => {
        el.banner.textContent = "CAMPAIGN CLEARED — ENDLESS UNLOCKED";
        el.banner.classList.remove("hidden");
      },
      onPauseChange: (p) => {
        el.pause.classList.toggle("hidden", !p);
        if (p) {
          el.pauseWeapon.textContent = `Weapon: ${lastWeaponName}`;
          renderPowerupChips(el.pausePowerups, lastPowerups, "pause-powerup-chip");
        }
      },
      onPickupToast: (icon, name, effect) => {
        el.pickupIcon.textContent = icon;
        el.pickupText.innerHTML = `<strong>${name}</strong> — ${effect}`;
        el.pickupToast.classList.remove("hidden");
        if (pickupToastTimer) clearTimeout(pickupToastTimer);
        pickupToastTimer = setTimeout(() => el.pickupToast.classList.add("hidden"), 2600);
      },
      onPowerupsChange: (items) => {
        lastPowerups = items;
        if (items.length) {
          el.powerups.classList.remove("hidden");
          renderPowerupChips(el.powerups, items, "hud-powerup-chip");
        } else {
          el.powerups.classList.add("hidden");
          el.powerups.innerHTML = "";
        }
      },
      onGameOver: (score, wave, maxTier) => {
        this.levelModal.classList.add("hidden");
        this.briefingModal.classList.add("hidden");
        audio.haltCombat();
        this.stop();
        this.deps.repo.clearSavedRun();
        this.deps.onGameOver(score, wave, maxTier);
      },
    });

    document.getElementById("pause-resume")?.addEventListener("click", () => {
      if (this.game?.state === "paused") this.game.togglePause();
    });

    this.game.particles.reduced = reduced;
    this.game.juice.reducedFx = reduced;
    this.game.renderer.vfx.reducedFx = reduced;
    this.game.init(this.deps.difficulty, this.deps.gameMode, saved);
    if (saved) this.deps.repo.clearSavedRun();

    this.loop = new GameLoop(
      (dt) => this.game?.update(dt),
      () => this.game?.draw()
    );
    this.loop.start();
    audio.resume();

    this.saveIv = setInterval(() => {
      if (this.game && this.game.state !== "gameOver") {
        const d = this.game.getSaveData();
        this.deps.repo.saveRun(d);
      }
    }, 5000);

    window.addEventListener("resize", this.onResize);
  }

  private onResize = (): void => {
    if (!this.game) return;
    this.fit(this.game.renderer);
  };

  private fit(renderer: NeonRenderer): void {
    const maxW = window.innerWidth - 24;
    const maxH = window.innerHeight - 120;
    const scale = Math.min(maxW / CANVAS_WIDTH, maxH / CANVAS_HEIGHT, 2);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.resize(CANVAS_WIDTH, CANVAS_HEIGHT, dpr);
    this.canvas.style.width = `${CANVAS_WIDTH * scale}px`;
    this.canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
  }

  stop(): void {
    this.loop?.stop();
    this.input?.destroy();
    if (this.saveIv) clearInterval(this.saveIv);
    window.removeEventListener("resize", this.onResize);
    this.layer.classList.add("hidden");
    document.getElementById("screen-root")!.classList.remove("hidden");
  }
}
