import type { SectorScript } from "../narrative/campaignScript";

export function showSectorBriefingModal(
  root: HTMLElement,
  sector: SectorScript,
  onContinue: () => void
): void {
  root.innerHTML = `
    <div class="sector-briefing deploy-card">
      <div class="deploy-card-header">
        <div class="deploy-card-rail" aria-hidden="true">
          <span class="status-dot"></span>
          <span>MISSION DEPLOY</span>
        </div>
        <p class="sector-briefing-label">SECTOR ${String(sector.level).padStart(2, "0")}</p>
        <h2 class="sector-briefing-title">${sector.title}</h2>
      </div>
      <div class="deploy-card-body">
        <div class="deploy-objective">
          <span class="deploy-objective-tag">OBJECTIVE</span>
          <p class="sector-briefing-objective">${sector.objective}</p>
        </div>
        <div class="deploy-intel">
          <span class="deploy-intel-tag">INTEL</span>
          <p class="sector-briefing-text">${sector.briefing}</p>
        </div>
      </div>
      <div class="deploy-card-footer">
        <button type="button" class="btn btn-primary btn-deploy" data-continue autofocus>
          <span class="btn-deploy-label">Engage</span>
          <span class="btn-deploy-sub">Deploy to sector ${sector.level} · Enter</span>
        </button>
      </div>
    </div>`;

  const engage = () => {
    window.removeEventListener("keydown", onKey);
    onContinue();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      engage();
    }
  };

  root.querySelector("[data-continue]")?.addEventListener("click", engage);
  window.addEventListener("keydown", onKey);
  (root.querySelector("[data-continue]") as HTMLButtonElement | null)?.focus();
}
