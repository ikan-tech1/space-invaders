import { CANVAS_HEIGHT, CANVAS_WIDTH, type Difficulty, type GameMode } from "../config";
import { AudioManager } from "../audio/AudioManager";
import { Game } from "../game/Game";
import { GameLoop } from "../game/GameLoop";
import { InputManager } from "../input/InputManager";
import { CanvasRenderer } from "../render/CanvasRenderer";
import type { LocalStorageRepo, SavedRun } from "../storage/LocalStorageRepo";
import { showLevelCompleteModal } from "../ui/levelCompleteModal";
import { showSectorBriefingModal } from "../ui/sectorBriefingModal";
import { getSectorBriefing } from "../progression/sectorBriefings";
import { showSlotMachine } from "../ui/slotMachine";
import { styleWaveBanner } from "../ui/cabinetShell";

export interface GameScreenDeps {
  repo: LocalStorageRepo;
  difficulty: Difficulty;
  gameMode: GameMode;
  continueRun: boolean;
  startLevel?: number;
  onGameOver: (score: number, wave: number) => void;
  onExitToMenu: () => void;
}

export class GameScreen {
  private canvas: HTMLCanvasElement;
  private gameLayer: HTMLElement;
  private loop: GameLoop | null = null;
  private game: Game | null = null;
  private input: InputManager | null = null;
  private audio: AudioManager | null = null;
  private saveInterval: ReturnType<typeof setInterval> | null = null;
  private levelModal: HTMLElement;
  private slotOverlay: HTMLElement;
  private briefingModal: HTMLElement;

  constructor(private deps: GameScreenDeps) {
    this.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    this.gameLayer = document.getElementById("game-layer") as HTMLElement;
    this.levelModal = document.getElementById("level-complete-modal") as HTMLElement;
    this.slotOverlay = document.getElementById("slot-machine-overlay") as HTMLElement;
    this.briefingModal = document.getElementById("sector-briefing-modal") as HTMLElement;
  }

  start(): void {
    const settings = this.deps.repo.getSettings();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.gameLayer.classList.remove("hidden");
    document.getElementById("screen-root")!.classList.add("hidden");
    this.levelModal.classList.add("hidden");
    this.levelModal.innerHTML = "";
    this.slotOverlay.classList.add("hidden");
    this.slotOverlay.innerHTML = "";
    this.briefingModal.classList.add("hidden");
    this.briefingModal.innerHTML = "";

    document.getElementById("pause-overlay")!.classList.add("hidden");
    document.getElementById("hud-boss-weak")!.classList.add("hidden");

    const ctx = this.canvas.getContext("2d")!;
    const renderer = new CanvasRenderer(ctx);
    this.fitCanvas(renderer);

    this.audio = new AudioManager();
    this.audio.volume = settings.volume;
    this.audio.sfxVolume = settings.sfxVolume;
    this.audio.uiVolume = settings.uiVolume;
    this.audio.muted = settings.muted;

    this.input = new InputManager();
    const touchMove = document.getElementById("touch-move")!;
    const touchFire = document.getElementById("touch-fire")!;
    const touchPause = document.getElementById("touch-pause")!;
    this.input.bindTouch(touchMove, touchFire, touchPause, settings.touchScale);

    const hudScore = document.getElementById("hud-score")!;
    const hudWave = document.getElementById("hud-wave")!;
    const hudLives = document.getElementById("hud-lives")!;
    const hudGun = document.getElementById("hud-gun-name")!;
    const hudShip = document.getElementById("hud-ship-name")!;
    const hudTokens = document.getElementById("hud-tokens")!;
    const hudRunPool = document.getElementById("hud-run-pool")!;
    const hudEndlessWrap = document.getElementById("hud-endless-wrap")!;
    const hudEndlessTier = document.getElementById("hud-endless-tier")!;
    const hudEndlessMult = document.getElementById("hud-endless-mult")!;
    const hudCombo = document.getElementById("hud-combo")!;
    const hudBuffs = document.getElementById("hud-buffs")!;
    const hudBossWeak = document.getElementById("hud-boss-weak")!;
    const waveBanner = document.getElementById("wave-banner")!;
    const pauseOverlay = document.getElementById("pause-overlay")!;

    const showToast = (text: string): void => {
      waveBanner.textContent = text;
      styleWaveBanner(waveBanner, text);
      waveBanner.classList.remove("hidden");
      window.setTimeout(() => waveBanner.classList.add("hidden"), 1800);
    };

    let continueData: SavedRun | undefined;
    if (this.deps.continueRun) {
      const saved = this.deps.repo.getSavedRun();
      if (saved) continueData = saved;
    }

    this.game = new Game(renderer, this.audio, this.input, {
      onScoreChange: (s) => {
        hudScore.textContent = s.toLocaleString();
      },
      onLivesChange: (l) => {
        hudLives.textContent = "♥".repeat(Math.max(0, l)) || "—";
      },
      onWaveChange: (w) => {
        hudWave.textContent = String(w);
      },
      onComboChange: (count, mult) => {
        if (mult > 1) {
          hudCombo.classList.remove("hidden");
          hudCombo.textContent = `COMBO x${mult} (${count})`;
        } else {
          hudCombo.classList.add("hidden");
        }
      },
      onWaveBanner: (text) => {
        waveBanner.textContent = text;
        styleWaveBanner(waveBanner, text);
        waveBanner.classList.remove("hidden");
        setTimeout(() => waveBanner.classList.add("hidden"), 1400);
      },
      onLevelComplete: (report) => {
        this.levelModal.classList.remove("hidden");
        const liveReport = { ...report };
        showLevelCompleteModal(this.levelModal, liveReport, {
          purchasedIds: this.game?.interstitialPurchases ?? [],
          endlessPurchasedIds: this.game?.interstitialEndlessPurchases ?? [],
          onPurchase: (id) => {
            const ok = this.game?.spendInterstitialTokens(id) ?? false;
            if (ok && this.game) {
              liveReport.walletTokens = this.game.meta.tokens;
              liveReport.runTokenPool = this.game.runTokenPool;
            }
            return ok;
          },
          onEndlessPurchase: (id) => {
            const ok = this.game?.spendInterstitialEndlessTokens(id) ?? false;
            if (ok && this.game) {
              liveReport.runTokenPool = this.game.runTokenPool;
            }
            return ok;
          },
          onContinue: () => {
            this.levelModal.classList.add("hidden");
            if (this.game) this.game.interstitialTimer = 0;
          },
        });
      },
      onToast: showToast,
      onPauseChange: (paused) => {
        pauseOverlay.classList.toggle("hidden", !paused);
      },
      onCampaignClear: () => {
        waveBanner.textContent = "CAMPAIGN CLEARED!";
        styleWaveBanner(waveBanner, "CAMPAIGN CLEARED!");
        waveBanner.classList.remove("hidden");
      },
      onTokensChange: (t) => {
        hudTokens.textContent = String(t);
      },
      onRunPoolChange: (pool) => {
        hudRunPool.textContent = String(pool);
      },
      onEndlessMultChange: (mult) => {
        if (this.deps.gameMode === "endless") {
          hudEndlessMult.textContent = `×${mult.toFixed(1)}`;
        }
      },
      onEndlessRankChange: (tierName, depth, nextDepth) => {
        if (this.deps.gameMode !== "endless") return;
        hudEndlessWrap.classList.remove("hidden");
        hudEndlessTier.textContent = tierName;
        hudEndlessTier.title = nextDepth
          ? `${tierName} · L${depth} · next tier L${nextDepth}`
          : `${tierName} · L${depth} · max rank`;
      },
      onLoadoutChange: (ship, gun) => {
        hudShip.textContent = ship;
        hudGun.textContent = gun;
      },
      onSectorBriefing: (level) => {
        this.briefingModal.classList.remove("hidden");
        showSectorBriefingModal(this.briefingModal, getSectorBriefing(level), () => {
          this.game?.dismissSectorBriefing();
        });
      },
      onBossWeakPoint: (visible, label) => {
        hudBossWeak.classList.toggle("hidden", !visible);
        if (visible) hudBossWeak.textContent = `◎ ${label}`;
      },
      onActiveBuffs: (buffs) => {
        if (!buffs.length) {
          hudBuffs.classList.add("hidden");
          hudBuffs.innerHTML = "";
          return;
        }
        hudBuffs.classList.remove("hidden");
        hudBuffs.innerHTML = buffs
          .map((b) => {
            const time =
              b.remaining < 0 ? "∞" : `${Math.ceil(b.remaining)}s`;
            return `<span class="hud-buff" title="${b.label}">${b.symbol}<small>${time}</small></span>`;
          })
          .join("");
      },
      onSlotMachine: (ctx) => {
        if (!this.game || !this.audio) return;
        showSlotMachine(this.slotOverlay, this.audio, ctx, (outcome) => {
          this.game?.resolveSlotResult(outcome);
          if (this.game) {
            hudGun.textContent = this.game.getGunLabel();
            hudShip.textContent = this.game.getShipLabel();
          }
        });
      },
      onGameOver: (score, wave) => {
        this.slotOverlay.classList.add("hidden");
        this.slotOverlay.innerHTML = "";
        this.levelModal.classList.add("hidden");
        this.stop();
        this.deps.repo.clearSavedRun();
        this.deps.onGameOver(score, wave);
      },
    });

    this.game.particles.setReducedMotion(reducedMotion);
    this.game.init(
      this.deps.difficulty,
      this.deps.gameMode,
      continueData,
      this.deps.continueRun ? undefined : this.deps.startLevel
    );
    if (continueData) this.deps.repo.clearSavedRun();
    hudGun.textContent = this.game.getGunLabel();
    hudShip.textContent = this.game.getShipLabel();
    hudTokens.textContent = String(this.game.meta.tokens);
    hudRunPool.textContent = String(this.game.runTokenPool);
    if (this.deps.gameMode === "endless") {
      hudEndlessWrap.classList.remove("hidden");
    }

    this.maybeShowOnboarding();

    this.loop = new GameLoop(
      (dt) => {
        this.game?.update(dt);
        if (this.game) {
          hudGun.textContent = this.game.getGunLabel();
          hudShip.textContent = this.game.getShipLabel();
        }
      },
      () => this.game?.draw()
    );
    this.loop.start();

    this.saveInterval = setInterval(() => {
      if (this.game && this.game.state !== "gameOver" && this.game.state !== "slotMachine" && this.game.state !== "sectorBriefing") {
        const d = this.game.getSaveData();
        this.deps.repo.saveRun({
          score: d.score,
          wave: d.wave,
          lives: d.lives,
          difficulty: d.difficulty,
        });
      }
    }, 5000);

    document.getElementById("pause-resume")?.addEventListener("click", () => {
      if (this.game?.state === "paused") this.game.togglePause();
    });

    window.addEventListener("resize", this.onResize);
    this.audio.resume();
  }

  private maybeShowOnboarding(): void {
    if (localStorage.getItem("og_onboarding_seen")) return;
    localStorage.setItem("og_onboarding_seen", "1");
    const tip = document.createElement("div");
    tip.className = "onboarding-tip";
    tip.innerHTML = `
      <p class="onboarding-tip-title">Quick briefing</p>
      <p>Move with <kbd>←</kbd> <kbd>→</kbd> or drag the zone. Tap <strong>FIRE</strong> or press <kbd>Space</kbd>.</p>
      <p>Chain kills for combos. On your <strong>last life</strong>, <strong>Lucky Reels</strong> offers a last-chance spin.</p>
      <button type="button" class="btn btn-primary onboarding-dismiss">Got it</button>
    `;
    this.gameLayer.appendChild(tip);
    const dismiss = (): void => tip.remove();
    tip.querySelector(".onboarding-dismiss")?.addEventListener("click", dismiss, { once: true });
    window.setTimeout(dismiss, 12000);
  }

  private onResize = (): void => {
    if (!this.game) return;
    this.fitCanvas(this.game.renderer);
  };

  private fitCanvas(renderer: CanvasRenderer): void {
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
    this.loop = null;
    this.input?.destroy();
    this.input = null;
    if (this.saveInterval) clearInterval(this.saveInterval);
    window.removeEventListener("resize", this.onResize);
    this.levelModal.classList.add("hidden");
    this.slotOverlay.classList.add("hidden");
    this.briefingModal.classList.add("hidden");
    this.gameLayer.classList.add("hidden");
    document.getElementById("screen-root")!.classList.remove("hidden");
  }
}
