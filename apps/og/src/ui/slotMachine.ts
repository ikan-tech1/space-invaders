import type { AudioManager } from "../audio/AudioManager";
import {
  POWERUP_LABELS,
  SLOT_LIFE_CHANCE,
  SLOT_POWERUP_CHANCE,
  SLOT_SYMBOLS,
  type PowerUpType,
} from "../config";

export type SlotOutcome =
  | { type: "life" }
  | { type: "powerup"; powerUp: PowerUpType }
  | { type: "miss" };

export interface SlotMachineContext {
  lives: number;
  maxLives: number;
  powerUpPool: PowerUpType[];
  luckySlot?: boolean;
}

type ReelSymbol = "life" | "miss" | PowerUpType;

const FILLER: ReelSymbol[] = [
  "miss",
  "rapid",
  "spread",
  "twin",
  "triple",
  "plasma",
  "shield",
  "clone",
  "bunker",
  "slow",
];

function rollOutcome(ctx: SlotMachineContext): SlotOutcome {
  const canWinLife = ctx.lives < ctx.maxLives;
  const canWinPower = ctx.powerUpPool.length > 0;
  const luck = ctx.luckySlot ? 1.35 : 1;
  const lifeChance = canWinLife ? SLOT_LIFE_CHANCE * luck : 0;
  const powerChance = canWinPower ? SLOT_POWERUP_CHANCE * luck : 0;
  const roll = Math.random();

  if (roll < lifeChance) return { type: "life" };
  if (roll < lifeChance + powerChance) {
    const powerUp = ctx.powerUpPool[Math.floor(Math.random() * ctx.powerUpPool.length)]!;
    return { type: "powerup", powerUp };
  }
  return { type: "miss" };
}

function outcomeSymbol(outcome: SlotOutcome): ReelSymbol {
  if (outcome.type === "life") return "life";
  if (outcome.type === "powerup") return outcome.powerUp;
  return "miss";
}

function buildReels(outcome: SlotOutcome, pool: PowerUpType[]): ReelSymbol[] {
  const winSymbol = outcomeSymbol(outcome);
  if (outcome.type !== "miss") {
    return [winSymbol, winSymbol, winSymbol];
  }

  const symbols = new Set<ReelSymbol>(["miss", ...pool.slice(0, 6)]);
  const choices = [...symbols];
  const reels: ReelSymbol[] = [];
  for (let i = 0; i < 3; i++) {
    let sym = choices[Math.floor(Math.random() * choices.length)]!;
    let guard = 0;
    while (guard < 12 && reels.length === 2 && reels[0] === sym && reels[1] === sym) {
      sym = choices[Math.floor(Math.random() * choices.length)]!;
      guard++;
    }
    reels.push(sym);
  }
  return reels;
}

function reelStrip(final: ReelSymbol, filler: ReelSymbol[]): ReelSymbol[] {
  const strip: ReelSymbol[] = [];
  for (let i = 0; i < 8; i++) {
    strip.push(filler[(i + final.charCodeAt(0)) % filler.length]!);
  }
  strip.push(final);
  return strip;
}

function outcomeMessage(outcome: SlotOutcome): string {
  if (outcome.type === "life") return "JACKPOT — EXTRA LIFE!";
  if (outcome.type === "powerup") {
    return `POWER-UP — ${POWERUP_LABELS[outcome.powerUp].toUpperCase()}`;
  }
  return "NO MATCH — BETTER LUCK NEXT TIME";
}

function outcomeClass(outcome: SlotOutcome): string {
  if (outcome.type === "life") return "slot-result--life";
  if (outcome.type === "powerup") return "slot-result--power";
  return "slot-result--miss";
}

export function showSlotMachine(
  root: HTMLElement,
  audio: AudioManager,
  ctx: SlotMachineContext,
  onComplete: (outcome: SlotOutcome) => void
): void {
  const outcome = rollOutcome(ctx);
  const reels = buildReels(outcome, ctx.powerUpPool);
  const filler = [...new Set<ReelSymbol>([...FILLER, ...ctx.powerUpPool, "life", "miss"])];

  root.classList.remove("hidden");
  root.innerHTML = `
    <div class="slot-machine-panel arcade-cabinet arcade-cabinet--modal">
      <div class="arcade-frame" aria-hidden="true">
        <span class="arcade-corner arcade-corner-tl"></span>
        <span class="arcade-corner arcade-corner-tr"></span>
        <span class="arcade-corner arcade-corner-bl"></span>
        <span class="arcade-corner arcade-corner-br"></span>
        <span class="arcade-scanlines"></span>
        <span class="arcade-glow"></span>
      </div>
      <div class="slot-machine-header">
        <p class="cabinet-mini-status slot-status">
          <span class="arcade-status-dot arcade-status-dot--danger"></span>
          LAST CHANCE
        </p>
        <h2 class="slot-title">Lucky Reels</h2>
        <p class="slot-subtitle">Spin for one more life or a power-up</p>
      </div>
      <div class="slot-machine-body">
        <div class="slot-reels" aria-live="polite">
          ${reels
            .map((final, i) => {
              const strip = reelStrip(final, filler);
              return `
              <div class="slot-reel" data-reel="${i}">
                <div class="slot-reel-window">
                  <div class="slot-reel-strip">
                    ${strip
                      .map(
                        (sym) =>
                          `<span class="slot-symbol slot-symbol--${sym}">${SLOT_SYMBOLS[sym] ?? sym}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              </div>`;
            })
            .join("")}
        </div>
        <p class="slot-result hidden" id="slot-result"></p>
        <div class="screen-marquee slot-marquee" aria-hidden="true">
          <span>♥ LIFE · ✦ PLASMA · ⚡ POWER · — MISS</span>
        </div>
        <button type="button" class="btn btn-primary slot-spin btn-deploy" id="slot-spin">
          <span class="btn-deploy-label">Spin</span>
          <span class="btn-deploy-sub">Pull the lever</span>
        </button>
        <button type="button" class="btn btn-primary slot-continue hidden" id="slot-continue">
          Continue
        </button>
      </div>
    </div>
  `;

  const spinBtn = root.querySelector<HTMLButtonElement>("#slot-spin")!;
  const continueBtn = root.querySelector<HTMLButtonElement>("#slot-continue")!;
  const resultEl = root.querySelector<HTMLParagraphElement>("#slot-result")!;
  const reelEls = [...root.querySelectorAll<HTMLElement>(".slot-reel-strip")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let spinning = false;
  let finished = false;

  const finish = (): void => {
    if (finished) return;
    finished = true;
    root.classList.add("hidden");
    root.innerHTML = "";
    onComplete(outcome);
  };

  const showResult = (): void => {
    resultEl.textContent = outcomeMessage(outcome);
    resultEl.className = `slot-result ${outcomeClass(outcome)}`;
    resultEl.classList.remove("hidden");
    spinBtn.classList.add("hidden");
    continueBtn.classList.remove("hidden");
    const panel = root.querySelector(".slot-machine-panel");
    if (outcome.type !== "miss") {
      panel?.classList.add("slot-machine-panel--win");
      audio.play("slotWin");
    }
  };

  const runSpin = (): void => {
    if (spinning || finished) return;
    spinning = true;
    spinBtn.disabled = true;
    audio.play("slotSpin");

    if (reducedMotion) {
      reelEls.forEach((strip) => {
        strip.style.transform = "translateY(0)";
      });
      showResult();
      spinning = false;
      return;
    }

    reelEls.forEach((strip, i) => {
      const cellH = strip.firstElementChild?.getBoundingClientRect().height ?? 56;
      const offset = cellH * (strip.children.length - 1);
      strip.style.transition = "none";
      strip.style.transform = "translateY(0)";
      void strip.offsetHeight;
      const duration = 0.9 + i * 0.35;
      strip.style.transition = `transform ${duration}s cubic-bezier(0.12, 0.82, 0.22, 1)`;
      strip.style.transform = `translateY(-${offset}px)`;
      window.setTimeout(() => audio.play("slotReelStop"), duration * 1000);
    });

    const lastStopMs = 900 + (reelEls.length - 1) * 350 + 180;
    window.setTimeout(() => {
      showResult();
      spinning = false;
    }, lastStopMs);
  };

  spinBtn.addEventListener("click", runSpin, { once: true });
  continueBtn.addEventListener("click", finish, { once: true });

  window.setTimeout(() => {
    if (!finished && !spinning) runSpin();
  }, 450);
}
