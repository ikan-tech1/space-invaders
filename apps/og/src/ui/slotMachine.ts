import type { AudioManager } from "../audio/AudioManager";
import {
  PICKUP_DEFS,
  POWERUP_LABELS,
  SLOT_LIFE_CHANCE,
  SLOT_POWERUP_CHANCE,
  SLOT_SECOND_WIND_CHANCE,
  SLOT_SHIELD_CHANCE,
  SLOT_SYMBOLS,
  SLOT_TOKEN_CHANCE,
  SLOT_TOKEN_PAYOUT,
  type PowerUpType,
} from "../config";

export type SlotOutcome =
  | { type: "life" }
  | { type: "powerup"; powerUp: PowerUpType }
  | { type: "shield" }
  | { type: "tokens"; amount: number }
  | { type: "secondWind" }
  | { type: "miss" };

export interface SlotMachineContext {
  lives: number;
  maxLives: number;
  powerUpPool: PowerUpType[];
  luckySlot?: boolean;
}

type ReelSymbol = "life" | "miss" | "shield" | "tokens" | "secondWind" | PowerUpType;

const FILLER: ReelSymbol[] = [
  "miss",
  "shield",
  "tokens",
  "secondWind",
  "rapid",
  "spread",
  "twin",
  "triple",
  "plasma",
  "volleyUp",
  "fireRate",
  "scatter",
  "homing",
  "comboAura",
  "tokenBurst",
  "hyperSpeed",
  "clone",
  "bunker",
  "slow",
  "invulnPulse",
];

function rollOutcome(ctx: SlotMachineContext): SlotOutcome {
  const canWinLife = ctx.lives < ctx.maxLives;
  const canWinPower = ctx.powerUpPool.length > 0;
  const luck = ctx.luckySlot ? 1.35 : 1;
  const lifeChance = canWinLife ? SLOT_LIFE_CHANCE * luck : 0;
  const powerChance = canWinPower ? SLOT_POWERUP_CHANCE * luck : 0;
  const shieldChance = SLOT_SHIELD_CHANCE;
  const tokenChance = SLOT_TOKEN_CHANCE;
  const secondWindChance = SLOT_SECOND_WIND_CHANCE;
  const roll = Math.random();

  let cursor = 0;
  if (roll < (cursor += lifeChance)) return { type: "life" };
  if (roll < (cursor += powerChance)) {
    const powerUp = ctx.powerUpPool[Math.floor(Math.random() * ctx.powerUpPool.length)]!;
    return { type: "powerup", powerUp };
  }
  if (roll < (cursor += shieldChance)) return { type: "shield" };
  if (roll < (cursor += tokenChance)) return { type: "tokens", amount: SLOT_TOKEN_PAYOUT };
  if (roll < (cursor += secondWindChance)) return { type: "secondWind" };
  return { type: "miss" };
}

function outcomeSymbol(outcome: SlotOutcome): ReelSymbol {
  if (outcome.type === "life") return "life";
  if (outcome.type === "powerup") return outcome.powerUp;
  if (outcome.type === "shield") return "shield";
  if (outcome.type === "tokens") return "tokens";
  if (outcome.type === "secondWind") return "secondWind";
  return "miss";
}

function buildReels(outcome: SlotOutcome, pool: PowerUpType[]): ReelSymbol[] {
  const winSymbol = outcomeSymbol(outcome);
  if (outcome.type !== "miss") {
    return [winSymbol, winSymbol, winSymbol];
  }

  const symbols = new Set<ReelSymbol>(["miss", "shield", "tokens", "secondWind", ...pool.slice(0, 6)]);
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

const SLOT_PIXEL_SYMBOLS: Partial<Record<ReelSymbol, string>> = {
  life: "1UP",
  miss: "X",
  shield: "SHD",
  tokens: "TOK",
  secondWind: "WND",
  rapid: "RPD",
  spread: "SPR",
  twin: "TWN",
  triple: "TRI",
  quint: "QNT",
  plasma: "PLS",
  volleyUp: "VOL",
  fireRate: "FR",
  scatter: "SCT",
  homing: "HMG",
  comboAura: "CMB",
  tokenBurst: "BRS",
  hyperSpeed: "SPD",
  clone: "CLN",
  bunker: "BNK",
  slow: "SLW",
  invulnPulse: "INV",
  aegis: "AEG",
  curseSolo: "CRS",
  curseSlowFire: "JAM",
  curseJam: "JAM",
};

function symbolLabel(sym: ReelSymbol): string {
  if (sym in SLOT_PIXEL_SYMBOLS) return SLOT_PIXEL_SYMBOLS[sym as ReelSymbol]!;
  return SLOT_SYMBOLS[sym as keyof typeof SLOT_SYMBOLS] ?? sym.slice(0, 3).toUpperCase();
}

function symbolClass(sym: ReelSymbol): string {
  const base = `slot-symbol slot-symbol--${sym}`;
  if (sym === "life" || sym === "miss" || sym === "shield" || sym === "tokens" || sym === "secondWind") {
    return base;
  }
  const cat = PICKUP_DEFS[sym as PowerUpType]?.category ?? "weapon";
  return `${base} slot-symbol--cat-${cat}`;
}

function outcomeMessage(outcome: SlotOutcome): string {
  switch (outcome.type) {
    case "life":
      return "JACKPOT — EXTRA LIFE!";
    case "powerup":
      return `POWER-UP — ${POWERUP_LABELS[outcome.powerUp].toUpperCase()}`;
    case "shield":
      return "SHIELD RESTORE — ALL BUNKERS PATCHED";
    case "tokens":
      return `RUN STASH — +${outcome.amount} ◎ TO SUPPLY DEPOT`;
    case "secondWind":
      return "SECOND WIND — EXTENDED INVULNERABILITY";
    default:
      return "NO MATCH — BETTER LUCK NEXT TIME";
  }
}

function outcomeDetail(outcome: SlotOutcome): string {
  switch (outcome.type) {
    case "life":
      return "One life restored. Last-chance bonus only — hold the line.";
    case "powerup":
      return `${POWERUP_LABELS[outcome.powerUp]} armed immediately on respawn.`;
    case "shield":
      return "Every shield bunker on the field is repaired.";
    case "tokens":
      return "Tokens go to your run pool for the supply depot.";
    case "secondWind":
      return "Double invulnerability window after respawn.";
    default:
      return "No bonus this spin — the run ends unless the reels grant a life.";
  }
}

function outcomeClass(outcome: SlotOutcome): string {
  if (outcome.type === "miss") return "slot-result--miss";
  if (outcome.type === "life") return "slot-result--life";
  if (outcome.type === "tokens") return "slot-result--tokens";
  return "slot-result--power";
}

function oddsLegend(ctx: SlotMachineContext): string {
  const luck = ctx.luckySlot ? " · Lucky Reels +" : "";
  const parts = [
    `♥ ${Math.round(SLOT_LIFE_CHANCE * (ctx.luckySlot ? 135 : 100))}%`,
    `✦ ${Math.round(SLOT_POWERUP_CHANCE * (ctx.luckySlot ? 135 : 100))}%`,
    `◆ ${Math.round(SLOT_SHIELD_CHANCE * 100)}%`,
    `◎ ${Math.round(SLOT_TOKEN_CHANCE * 100)}%`,
    `☼ ${Math.round(SLOT_SECOND_WIND_CHANCE * 100)}%`,
  ];
  return `Odds${luck}: ${parts.join(" · ")}`;
}

export function showSlotMachine(
  root: HTMLElement,
  audio: AudioManager,
  ctx: SlotMachineContext,
  onComplete: (outcome: SlotOutcome) => void
): void {
  const outcome = rollOutcome(ctx);
  const reels = buildReels(outcome, ctx.powerUpPool);
  const filler = [
    ...new Set<ReelSymbol>([...FILLER, ...ctx.powerUpPool, "life", "miss", "shield", "tokens", "secondWind"]),
  ];

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
        <p class="slot-subtitle">One spin — life, power-up, shields, tokens, or second wind</p>
      </div>
      <div class="slot-machine-body">
        <p class="slot-odds">${oddsLegend(ctx)}</p>
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
                          `<span class="${symbolClass(sym)}">${symbolLabel(sym)}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              </div>`;
            })
            .join("")}
        </div>
        <p class="slot-result hidden" id="slot-result"></p>
        <p class="slot-result-detail hidden" id="slot-result-detail"></p>
      </div>
      <footer class="slot-machine-footer">
        <div class="screen-marquee slot-marquee" aria-hidden="true">
          <span>♥ LIFE · ✦ POWER · ◆ SHIELDS · ◎ TOKENS · ☼ WIND</span>
        </div>
        <button type="button" class="btn btn-primary slot-spin btn-deploy" id="slot-spin">
          <span class="btn-deploy-label">Spin</span>
          <span class="btn-deploy-sub">Pull the lever</span>
        </button>
        <button type="button" class="btn btn-primary slot-continue hidden" id="slot-continue">
          Continue
        </button>
      </footer>
    </div>
  `;

  const spinBtn = root.querySelector<HTMLButtonElement>("#slot-spin")!;
  const continueBtn = root.querySelector<HTMLButtonElement>("#slot-continue")!;
  const resultEl = root.querySelector<HTMLParagraphElement>("#slot-result")!;
  const detailEl = root.querySelector<HTMLParagraphElement>("#slot-result-detail")!;
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
    detailEl.textContent = outcomeDetail(outcome);
    detailEl.classList.remove("hidden");
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
