/** Shared arcade cabinet markup for sub-screens and game over. */

export const ARCADE_FRAME = `
  <div class="arcade-frame" aria-hidden="true">
    <span class="arcade-corner arcade-corner-tl"></span>
    <span class="arcade-corner arcade-corner-tr"></span>
    <span class="arcade-corner arcade-corner-bl"></span>
    <span class="arcade-corner arcade-corner-br"></span>
    <span class="arcade-scanlines"></span>
    <span class="arcade-glow"></span>
  </div>`;

export function renderSubHeader(title: string, subtitle: string, marquee = "— ARCADE MENU —"): string {
  return `
    <header class="sub-header cabinet-mini sub-cabinet">
      <div class="cabinet-mini-glow" aria-hidden="true"></div>
      <p class="cabinet-mini-status"><span class="arcade-status-dot"></span> CABINET OS</p>
      <h1 class="screen-title">${title}</h1>
      <p class="screen-subtitle">${subtitle}</p>
      <div class="screen-marquee" aria-hidden="true"><span>${marquee}</span></div>
    </header>`;
}

export interface SubCabinetShellOptions {
  screenClass?: string;
  shellClass?: string;
  headerHtml: string;
  bodyHtml: string;
  footerHtml: string;
}

export function renderSubCabinetShell(opts: SubCabinetShellOptions): string {
  const screenClass = opts.screenClass ?? "";
  const shellClass = opts.shellClass ?? "";
  return `
    <div class="screen sub-screen ${screenClass}">
      <div class="sub-cabinet-shell arcade-cabinet arcade-cabinet--sub ${shellClass}">
        ${ARCADE_FRAME}
        ${opts.headerHtml}
        <div class="sub-cabinet-scroll">${opts.bodyHtml}</div>
        <footer class="sub-cabinet-footer cabinet-footer">${opts.footerHtml}</footer>
      </div>
    </div>`;
}

export function renderSubBackFooter(label = "Main Menu"): string {
  return `<button type="button" class="btn btn-primary" data-back>${label}</button>`;
}

export interface GameOverShellOptions {
  screenClass?: string;
  headerHtml: string;
  bodyHtml: string;
  footerHtml: string;
}

export function renderGameOverShell(opts: GameOverShellOptions): string {
  const screenClass = opts.screenClass ?? "";
  return `
    <div class="screen sub-screen game-over-screen ${screenClass}">
      <div class="go-cabinet-shell arcade-cabinet arcade-cabinet--modal go-cabinet-shell--danger">
        ${ARCADE_FRAME}
        ${opts.headerHtml}
        <div class="go-cabinet-body sub-cabinet-scroll">${opts.bodyHtml}</div>
        <footer class="go-cabinet-footer cabinet-footer">${opts.footerHtml}</footer>
      </div>
    </div>`;
}

/** Apply wave / boss styling classes on the in-game banner element. */
export function styleWaveBanner(el: HTMLElement, text: string): void {
  el.classList.remove("wave-banner--level", "wave-banner--boss-mini", "wave-banner--boss-big", "wave-banner--clear");
  const upper = text.toUpperCase();
  if (upper.includes("BIG BOSS")) {
    el.classList.add("wave-banner--boss-big");
  } else if (upper.includes("MINI BOSS") || upper.includes("BOSS")) {
    el.classList.add("wave-banner--boss-mini");
  } else if (upper.includes("CAMPAIGN CLEARED") || upper.includes("CLEAR")) {
    el.classList.add("wave-banner--clear");
  } else {
    el.classList.add("wave-banner--level");
  }
}
