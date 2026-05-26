import type { SectorBriefing } from "../progression/sectorBriefings";

export function showSectorBriefingModal(
  root: HTMLElement,
  briefing: SectorBriefing,
  onDismiss: () => void
): void {
  root.classList.remove("hidden");
  root.innerHTML = `
    <div class="sector-briefing-panel arcade-cabinet arcade-cabinet--modal">
      <div class="arcade-frame" aria-hidden="true">
        <span class="arcade-corner arcade-corner-tl"></span>
        <span class="arcade-corner arcade-corner-tr"></span>
        <span class="arcade-corner arcade-corner-bl"></span>
        <span class="arcade-corner arcade-corner-br"></span>
        <span class="arcade-scanlines"></span>
        <span class="arcade-glow"></span>
      </div>
      <div class="sector-briefing-header">
        <p class="cabinet-mini-status"><span class="arcade-status-dot"></span> SECTOR BRIEFING</p>
        <h2 class="sector-briefing-title">${briefing.title}</h2>
        <p class="sector-briefing-level">Level ${briefing.level} · Sector ${briefing.sector} · Threat: ${briefing.threat}</p>
      </div>
      <div class="sector-briefing-body">
        <p class="sector-briefing-body-text">${briefing.body}</p>
        <div class="sector-briefing-tip">
          <span class="sector-briefing-tip-label">Operator tip</span>
          <p>${briefing.tip}</p>
        </div>
        <div class="screen-marquee sector-briefing-marquee" aria-hidden="true">
          <span>INSERT COIN TO DEPLOY</span>
        </div>
        <button type="button" class="btn btn-primary btn-deploy sector-briefing-go">
          <span class="btn-deploy-label">Deploy</span>
          <span class="btn-deploy-sub">Engage hostiles</span>
        </button>
      </div>
    </div>`;

  const dismiss = (): void => {
    root.classList.add("hidden");
    root.innerHTML = "";
    onDismiss();
  };

  root.querySelector(".sector-briefing-go")?.addEventListener("click", dismiss, { once: true });

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dismiss();
      window.removeEventListener("keydown", onKey);
    }
  };
  window.addEventListener("keydown", onKey);
}
