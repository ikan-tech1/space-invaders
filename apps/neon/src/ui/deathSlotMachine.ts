import {
  persistDeathSlotOutcome,
  rollDeathSlotOutcome,
  symbolLabel,
  symbolTitle,
  type DeathSlotOutcome,
  type SlotReelSymbol,
} from "../progression/deathSlotRewards";

export interface DeathSlotMachineOptions {
  onSpinStart?: () => void;
  onSpinEnd?: (outcome: DeathSlotOutcome) => void;
  onComplete?: () => void;
  autoSpinMs?: number;
  reducedMotion?: boolean;
}

const REEL_SPIN_MS = 1400;
const REEL_STAGGER_MS = 320;

export function mountDeathSlotMachine(
  host: HTMLElement,
  opts: DeathSlotMachineOptions = {}
): { spin: () => void; destroy: () => void } {
  const reducedMotion =
    opts.reducedMotion ??
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let spun = false;
  let autoTimer: ReturnType<typeof setTimeout> | null = null;

  function decoyStrip(): SlotReelSymbol[] {
    const pool: SlotReelSymbol[] = ["empty", "stars", "aegis", "overdrive", "life", "weaponCore"];
    return Array.from({ length: 8 }, () => pool[Math.floor(Math.random() * pool.length)]!);
  }

  function renderStripSymbols(symbols: SlotReelSymbol[]): string {
    return symbols
      .map(
        (s) =>
          `<span class="death-slot-symbol" title="${symbolTitle(s)}">${symbolLabel(s)}</span>`
      )
      .join("");
  }

  const initialReel = renderStripSymbols(decoyStrip());

  host.innerHTML = `
    <section class="panel death-slot-panel" aria-label="Deploy slot machine">
      <div class="death-slot-frame" aria-hidden="true">
        <span class="hangar-bracket hangar-bracket-tl"></span>
        <span class="hangar-bracket hangar-bracket-tr"></span>
        <span class="hangar-bracket hangar-bracket-bl"></span>
        <span class="hangar-bracket hangar-bracket-br"></span>
      </div>
      <p class="panel-label death-slot-label">Deploy Slot</p>
      <p class="death-slot-sub">One spin per defeat</p>
      <div class="death-slot-reels" data-reels>
        ${[0, 1, 2]
          .map(
            (i) => `
          <div class="death-slot-reel" data-reel="${i}">
            <div class="death-slot-reel-window">
              <div class="death-slot-reel-strip" data-strip="${i}">
                ${initialReel}
              </div>
            </div>
          </div>`
          )
          .join("")}
      </div>
      <button type="button" class="btn btn-primary death-slot-spin" data-spin>
        <span class="btn-deploy-label">Spin</span>
        <span class="btn-deploy-sub">Roll for redeploy bonus</span>
      </button>
      <div class="death-slot-result hidden" data-result role="status" aria-live="polite"></div>
    </section>`;

  const spinBtn = host.querySelector<HTMLButtonElement>("[data-spin]")!;
  const resultEl = host.querySelector<HTMLElement>("[data-result]")!;

  function setSpinning(active: boolean): void {
    host.querySelectorAll(".death-slot-reel").forEach((r) => {
      r.classList.toggle("is-spinning", active);
    });
  }

  function stopReel(index: number, sym: SlotReelSymbol): void {
    const reel = host.querySelector<HTMLElement>(`[data-reel="${index}"]`)!;
    const strip = reel.querySelector<HTMLElement>("[data-strip]")!;
    reel.classList.remove("is-spinning");
    strip.innerHTML = `<span class="death-slot-symbol death-slot-symbol--land">${symbolLabel(sym)}</span>`;
  }

  function finish(out: DeathSlotOutcome): void {
    spun = true;
    persistDeathSlotOutcome(out);
    opts.onSpinEnd?.(out);

    const win = out.kind !== "nothing";
    resultEl.classList.remove("hidden");
    resultEl.classList.toggle("death-slot-result--win", win);
    resultEl.innerHTML = `
      <p class="death-slot-result-label">${out.label}</p>
      <p class="death-slot-result-detail">${out.detail}</p>`;

    if (win) host.classList.add("death-slot-panel--win");

    spinBtn.disabled = true;
    spinBtn.innerHTML = `<span class="btn-deploy-label">Spun</span>`;
    opts.onComplete?.();
  }

  async function animateReels(out: DeathSlotOutcome): Promise<void> {
    setSpinning(true);
    opts.onSpinStart?.();

    if (reducedMotion) {
      out.reels.forEach((sym, i) => stopReel(i, sym));
      setSpinning(false);
      finish(out);
      return;
    }

    await new Promise((r) => setTimeout(r, REEL_SPIN_MS * 0.45));

    for (let i = 0; i < out.reels.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, REEL_STAGGER_MS));
      stopReel(i, out.reels[i]!);
    }

    setSpinning(false);
    finish(out);
  }

  function spin(): void {
    if (spun) return;
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
    spinBtn.disabled = true;
    const out = rollDeathSlotOutcome();
    void animateReels(out);
  }

  spinBtn.addEventListener("click", spin);

  if (opts.autoSpinMs !== 0) {
    autoTimer = setTimeout(spin, opts.autoSpinMs ?? 1400);
  }

  return {
    spin,
    destroy: () => {
      if (autoTimer) clearTimeout(autoTimer);
    },
  };
}
