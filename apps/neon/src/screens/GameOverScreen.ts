import { AudioManager } from "../audio/AudioManager";
import { pendingBonusSummary } from "../progression/deathSlotRewards";
import type { LocalStorageRepo } from "../storage/LocalStorageRepo";
import { mountDeathSlotMachine } from "../ui/deathSlotMachine";
import type { Screen } from "./ScreenRouter";

export interface GameOverDeps {
  repo: LocalStorageRepo;
  score: number;
  wave: number;
  maxTier: number;
  onRetry: () => void;
  onMenu: () => void;
}

export class GameOverScreen implements Screen {
  id = "gameOver" as const;
  private initials = ["", "", ""];
  private slotDestroy: (() => void) | null = null;
  private spinComplete = false;

  constructor(private deps: GameOverDeps) {}

  mount(root: HTMLElement): void {
    const rank = this.deps.repo.rankForScore(this.deps.score);
    const qualifies =
      this.deps.score > 0 &&
      (rank > 0 && rank <= 10 || this.deps.repo.getHighScores().length < 10);
    const bonusHint = pendingBonusSummary();

    root.innerHTML = `
      <div class="screen sub-screen game-over-screen">
        <header class="sub-header sub-header--framed">
          <div class="sub-header-frame" aria-hidden="true">
            <span class="hangar-bracket hangar-bracket-tl"></span>
            <span class="hangar-bracket hangar-bracket-tr"></span>
            <span class="hangar-bracket hangar-bracket-bl"></span>
            <span class="hangar-bracket hangar-bracket-br"></span>
          </div>
          <h1 class="screen-title">Mission Failed</h1>
          <p class="screen-subtitle">Sector ${this.deps.wave} · Max T${this.deps.maxTier}${rank ? ` · #${rank}` : ""}</p>
        </header>
        <div class="sub-screen-body">
          <p class="final-score">${this.deps.score.toLocaleString()}</p>
          <div data-slot-host></div>
          ${
            qualifies
              ? `<section class="panel game-over-panel">
              <h2 class="panel-label">Callsign</h2>
              <div class="initials-form">
              <input maxlength="1" data-i="0" aria-label="Initial 1" /><input maxlength="1" data-i="1" aria-label="Initial 2" /><input maxlength="1" data-i="2" aria-label="Initial 3" />
            </div><button class="btn" data-save style="margin-top:10px">Save Record</button></section>`
              : ""
          }
        </div>
        <footer class="sub-screen-footer">
          <button class="btn btn-primary btn-deploy" data-retry disabled>
            <span class="btn-deploy-label">Redeploy</span>
            <span class="btn-deploy-sub">${bonusHint ? `Bonus armed: ${bonusHint}` : "Restart deployment"}</span>
          </button>
          <button class="btn" data-menu>Hangar</button>
        </footer>
      </div>`;

    const retryBtn = root.querySelector<HTMLButtonElement>("[data-retry]")!;
    const menuBtn = root.querySelector<HTMLButtonElement>("[data-menu]")!;
    const slotHost = root.querySelector<HTMLElement>("[data-slot-host]")!;

    const audio = new AudioManager();
    audio.volume = this.deps.repo.getSettings().volume;
    audio.muted = this.deps.repo.getSettings().muted;

    const slot = mountDeathSlotMachine(slotHost, {
      autoSpinMs: 1400,
      onSpinStart: () => audio.play("slotSpin"),
      onSpinEnd: (outcome) => {
        if (outcome.kind !== "nothing") audio.play("slotWin");
      },
      onComplete: () => {
        this.spinComplete = true;
        retryBtn.disabled = false;
        const hint = pendingBonusSummary();
        if (hint) {
          retryBtn.querySelector(".btn-deploy-sub")!.textContent = `Bonus armed: ${hint}`;
        } else {
          retryBtn.querySelector(".btn-deploy-sub")!.textContent = "Restart deployment";
        }
      },
    });
    this.slotDestroy = slot.destroy;

    const inputs = root.querySelectorAll<HTMLInputElement>(".initials-form input");
    inputs.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        this.initials[i] = inp.value.toUpperCase().slice(0, 1);
        inp.value = this.initials[i]!;
        if (inp.value && i < 2) inputs[i + 1]?.focus();
      });
    });
    root.querySelector("[data-save]")?.addEventListener("click", () => {
      this.deps.repo.addHighScore({
        initials: (this.initials.join("") || "NEO").padEnd(3, "X").slice(0, 3),
        score: this.deps.score,
        wave: this.deps.wave,
        maxTier: this.deps.maxTier,
        date: new Date().toISOString().slice(0, 10),
      });
      const btn = root.querySelector("[data-save]")!;
      btn.textContent = "Saved";
    });
    retryBtn.addEventListener("click", () => {
      if (!this.spinComplete) return;
      this.deps.onRetry();
    });
    menuBtn.addEventListener("click", () => this.deps.onMenu());
    if (qualifies) inputs[0]?.focus();
  }

  unmount(): void {
    this.slotDestroy?.();
    this.slotDestroy = null;
  }
}
