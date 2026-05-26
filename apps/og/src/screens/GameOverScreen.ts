import type { LocalStorageRepo } from "../storage/LocalStorageRepo";
import type { Screen } from "./ScreenRouter";
import { AudioManager } from "../audio/AudioManager";

export interface GameOverScreenDeps {
  repo: LocalStorageRepo;
  score: number;
  wave: number;
  onRetry: () => void;
  onMenu: () => void;
}

export class GameOverScreen implements Screen {
  id = "gameOver" as const;
  private initials = ["", "", ""];

  constructor(private deps: GameOverScreenDeps) {}

  mount(root: HTMLElement): void {
    const rank = this.deps.repo.rankForScore(this.deps.score);
    const qualifies = this.deps.score > 0 && (rank > 0 && rank <= 10 || this.deps.repo.getHighScores().length < 10);
    const isNewHigh = rank === 1 && this.deps.score > 0;

    root.innerHTML = `
      <div class="screen sub-screen game-over-screen ${isNewHigh ? "game-over-screen--record" : ""}">
        <header class="sub-header cabinet-mini cabinet-mini--danger">
          <div class="cabinet-mini-glow" aria-hidden="true"></div>
          <p class="cabinet-mini-status"><span class="arcade-status-dot arcade-status-dot--danger"></span> GAME OVER</p>
          <h1 class="screen-title screen-title--danger">${isNewHigh ? "New High Score!" : "Game Over"}</h1>
          <p class="screen-subtitle">Level ${this.deps.wave}${rank > 0 ? ` · Rank #${rank}` : ""}</p>
          <div class="screen-marquee screen-marquee--danger" aria-hidden="true">
            <span>— INSERT COIN —</span>
          </div>
        </header>

        <div class="game-over-score-cabinet">
          <span class="game-over-score-label">Final Score</span>
          <p class="final-score">${this.deps.score.toLocaleString()}</p>
        </div>

        ${
          qualifies
            ? `
        <section class="panel cabinet-panel game-over-panel">
          <h2 class="panel-label">Enter initials</h2>
          <div class="initials-form">
            <input type="text" maxlength="1" data-idx="0" aria-label="Initial 1" />
            <input type="text" maxlength="1" data-idx="1" aria-label="Initial 2" />
            <input type="text" maxlength="1" data-idx="2" aria-label="Initial 3" />
          </div>
          <button type="button" class="btn btn-save-score" data-action="save">Save Score</button>
        </section>`
            : ""
        }
        <button type="button" class="btn btn-primary btn-deploy" data-action="retry">
          <span class="btn-deploy-label">Play Again</span>
          <span class="btn-deploy-sub">Restart from level 1</span>
        </button>
        <button type="button" class="btn" data-action="menu">Main Menu</button>
      </div>
    `;

    const inputs = root.querySelectorAll<HTMLInputElement>(".initials-form input");
    inputs.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        this.initials[i] = inp.value.toUpperCase().slice(0, 1);
        inp.value = this.initials[i]!;
        if (inp.value && i < 2) inputs[i + 1]?.focus();
      });
    });

    root.querySelector('[data-action="save"]')?.addEventListener("click", () => {
      const initials = this.initials.join("") || "AAA";
      this.deps.repo.addHighScore({
        initials: initials.padEnd(3, "A").slice(0, 3),
        score: this.deps.score,
        wave: this.deps.wave,
        date: new Date().toISOString().slice(0, 10),
      });
      root.querySelector('[data-action="save"]')!.textContent = "Saved!";
    });

    root.querySelector('[data-action="retry"]')?.addEventListener("click", () => {
      this.deps.onRetry();
    });
    root.querySelector('[data-action="menu"]')?.addEventListener("click", () => {
      this.deps.onMenu();
    });

    if (qualifies) inputs[0]?.focus();

    if (isNewHigh) {
      const audio = new AudioManager();
      audio.resume();
      audio.play("highScore");
    }
  }

  unmount(): void {}
}
