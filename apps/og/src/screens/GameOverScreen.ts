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
    const qualifies =
      this.deps.score > 0 && ((rank > 0 && rank <= 10) || this.deps.repo.getHighScores().length < 10);
    const isNewHigh = rank === 1 && this.deps.score > 0;
    const projectedRank = rank > 0 ? `#${rank}` : "TOP 10";

    root.innerHTML = `
      <div class="screen sub-screen game-over-screen ${isNewHigh ? "game-over-screen--record" : ""}">
        <header class="sub-header cabinet-mini cabinet-mini--danger sub-cabinet">
          <div class="cabinet-mini-glow" aria-hidden="true"></div>
          <p class="cabinet-mini-status"><span class="arcade-status-dot arcade-status-dot--danger"></span> GAME OVER</p>
          <h1 class="screen-title screen-title--danger">${isNewHigh ? "New High Score!" : "Mission Failed"}</h1>
          <p class="screen-subtitle">Level ${this.deps.wave}${rank > 0 ? ` · Rank ${projectedRank}` : ""}</p>
          <div class="screen-marquee screen-marquee--danger" aria-hidden="true">
            <span>— INSERT COIN —</span>
          </div>
        </header>

        <div class="game-over-score-cabinet go-score-hero">
          <span class="game-over-score-label">Final Score</span>
          <p class="final-score">${this.deps.score.toLocaleString()}</p>
          ${rank > 0 ? `<p class="go-rank-badge">Rank ${projectedRank}</p>` : ""}
        </div>

        ${
          qualifies
            ? `
        <section class="panel cabinet-panel game-over-panel initials-panel">
          <h2 class="panel-label">Enter initials</h2>
          <p class="initials-hint">A–Z only · auto-advance · backspace to edit</p>
          <div class="initials-form initials-form--arcade" role="group" aria-label="Three letter initials">
            <input type="text" maxlength="1" inputmode="text" pattern="[A-Z]*" autocapitalize="characters" autocomplete="off" data-idx="0" aria-label="Initial 1" />
            <input type="text" maxlength="1" inputmode="text" pattern="[A-Z]*" autocapitalize="characters" autocomplete="off" data-idx="1" aria-label="Initial 2" />
            <input type="text" maxlength="1" inputmode="text" pattern="[A-Z]*" autocapitalize="characters" autocomplete="off" data-idx="2" aria-label="Initial 3" />
          </div>
          <p class="initials-rank-preview">Board slot: <strong>${projectedRank}</strong></p>
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

    const inputs = [...root.querySelectorAll<HTMLInputElement>(".initials-form input")];
    const saveBtn = root.querySelector<HTMLButtonElement>('[data-action="save"]');

    const saveScore = (): void => {
      if (!saveBtn || saveBtn.disabled) return;
      const initials = this.initials.join("") || "AAA";
      this.deps.repo.addHighScore({
        initials: initials.padEnd(3, "A").slice(0, 3),
        score: this.deps.score,
        wave: this.deps.wave,
        date: new Date().toISOString().slice(0, 10),
      });
      saveBtn.textContent = "Saved!";
      saveBtn.disabled = true;
      inputs.forEach((inp) => {
        inp.disabled = true;
      });
    };

    inputs.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        const letter = inp.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1);
        this.initials[i] = letter;
        inp.value = letter;
        inp.classList.toggle("initials-filled", !!letter);
        if (letter && i < 2) inputs[i + 1]?.focus();
        if (letter && i === 2 && this.initials.every((c) => c)) saveScore();
      });

      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !inp.value && i > 0) {
          inputs[i - 1]?.focus();
          inputs[i - 1]!.select();
        }
        if (e.key === "Enter") saveScore();
        if (e.key === "ArrowLeft" && i > 0) {
          e.preventDefault();
          inputs[i - 1]?.focus();
        }
        if (e.key === "ArrowRight" && i < 2) {
          e.preventDefault();
          inputs[i + 1]?.focus();
        }
      });

      inp.addEventListener("focus", () => inp.select());
      inp.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData?.getData("text") ?? "").toUpperCase().replace(/[^A-Z]/g, "");
        for (let j = 0; j < 3; j++) {
          this.initials[j] = text[j] ?? this.initials[j] ?? "";
          if (inputs[j]) {
            inputs[j]!.value = this.initials[j]!;
            inputs[j]!.classList.toggle("initials-filled", !!this.initials[j]);
          }
        }
        const nextEmpty = this.initials.findIndex((c) => !c);
        inputs[nextEmpty >= 0 ? nextEmpty : 2]?.focus();
      });
    });

    saveBtn?.addEventListener("click", saveScore);

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
