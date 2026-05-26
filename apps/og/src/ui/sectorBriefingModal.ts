import type { SectorBriefing } from "../progression/sectorBriefings";
import { getEncounterType, type EncounterType } from "../progression/levelScript";

const SECTOR_ROMAN = ["I", "II", "III", "IV"] as const;

const INVADER_STRIP_SVG = `<svg viewBox="0 0 88 12" width="88" height="12" focusable="false" aria-hidden="true">
  <g fill="currentColor">
    <rect x="2" y="2" width="2" height="2"/><rect x="6" y="0" width="2" height="2"/>
    <rect x="8" y="0" width="2" height="2"/><rect x="10" y="2" width="2" height="2"/>
    <rect x="0" y="4" width="14" height="2"/><rect x="2" y="6" width="2" height="2"/>
    <rect x="10" y="6" width="2" height="2"/><rect x="4" y="8" width="2" height="2"/>
    <rect x="8" y="8" width="2" height="2"/>
  </g>
  <g fill="currentColor" transform="translate(22 0)">
    <rect x="2" y="0" width="2" height="2"/><rect x="6" y="0" width="2" height="2"/>
    <rect x="10" y="0" width="2" height="2"/><rect x="0" y="2" width="2" height="2"/>
    <rect x="12" y="2" width="2" height="2"/><rect x="2" y="4" width="10" height="2"/>
    <rect x="0" y="6" width="4" height="2"/><rect x="10" y="6" width="4" height="2"/>
    <rect x="2" y="8" width="2" height="2"/><rect x="10" y="8" width="2" height="2"/>
  </g>
  <g fill="currentColor" transform="translate(44 0)">
    <rect x="4" y="0" width="6" height="2"/><rect x="2" y="2" width="2" height="2"/>
    <rect x="10" y="2" width="2" height="2"/><rect x="0" y="4" width="14" height="2"/>
    <rect x="2" y="6" width="2" height="2"/><rect x="10" y="6" width="2" height="2"/>
    <rect x="4" y="8" width="2" height="2"/><rect x="8" y="8" width="2" height="2"/>
  </g>
  <g fill="currentColor" transform="translate(66 0)">
    <rect x="2" y="0" width="10" height="2"/><rect x="0" y="2" width="2" height="2"/>
    <rect x="12" y="2" width="2" height="2"/><rect x="2" y="4" width="2" height="2"/>
    <rect x="6" y="4" width="2" height="2"/><rect x="10" y="4" width="2" height="2"/>
    <rect x="0" y="6" width="14" height="2"/><rect x="2" y="8" width="2" height="2"/>
    <rect x="10" y="8" width="2" height="2"/>
  </g>
</svg>`;

function sectorRoman(sector: number): string {
  return SECTOR_ROMAN[sector - 1] ?? String(sector);
}

function threatClass(threat: string): string {
  const key = threat.toLowerCase();
  if (key === "low") return "sb-threat--low";
  if (key === "medium") return "sb-threat--med";
  if (key === "high") return "sb-threat--high";
  if (key === "extreme") return "sb-threat--extreme";
  return "sb-threat--unknown";
}

function threatMeterPct(threat: string): number {
  const key = threat.toLowerCase();
  if (key === "low") return 28;
  if (key === "medium") return 52;
  if (key === "high") return 76;
  if (key === "extreme") return 100;
  return 40;
}

function encounterMeta(encounter: EncounterType): { label: string; icon: string; active: boolean }[] {
  return [
    { label: "Wave", icon: "▣", active: encounter === "standard" },
    { label: "Mini", icon: "◈", active: encounter === "miniBoss" },
    { label: "Boss", icon: "☠", active: encounter === "bigBoss" },
  ];
}

function encounterBadge(encounter: EncounterType): { label: string; mod: string } {
  if (encounter === "miniBoss") return { label: "Mini Boss", mod: "sb-badge--encounter-miniBoss" };
  if (encounter === "bigBoss") return { label: "Boss", mod: "sb-badge--encounter-bigBoss" };
  return { label: "Wave", mod: "sb-badge--encounter-wave" };
}

export function showSectorBriefingModal(
  root: HTMLElement,
  briefing: SectorBriefing,
  onDismiss: () => void
): void {
  const encounter = getEncounterType(briefing.level);
  const encBadge = encounterBadge(encounter);
  const threatMod = threatClass(briefing.threat);
  const meterPct = threatMeterPct(briefing.threat);
  const encounters = encounterMeta(encounter)
    .map(
      (e) =>
        `<span class="sb-encounter ${e.active ? "sb-encounter--active" : ""}" title="${e.label}">
          <span class="sb-encounter-icon" aria-hidden="true">${e.icon}</span>
          <span class="sb-encounter-label">${e.label}</span>
        </span>`
    )
    .join("");

  root.classList.remove("hidden");
  root.innerHTML = `
    <div class="sector-briefing-panel sector-briefing-panel--intro arcade-cabinet arcade-cabinet--modal">
      <div class="arcade-frame" aria-hidden="true">
        <span class="arcade-corner arcade-corner-tl"></span>
        <span class="arcade-corner arcade-corner-tr"></span>
        <span class="arcade-corner arcade-corner-bl"></span>
        <span class="arcade-corner arcade-corner-br"></span>
        <span class="arcade-scanlines"></span>
        <span class="arcade-glow"></span>
      </div>

      <header class="sector-briefing-header">
        <p class="sector-briefing-eyebrow">
          <span class="arcade-status-dot" aria-hidden="true"></span>
          <span>Sector Briefing</span>
        </p>
        <h2 class="sector-briefing-title" id="sector-briefing-heading">${briefing.title}</h2>
        <div class="sector-briefing-badges" role="list" aria-label="Mission metadata">
          <span class="sb-badge sb-badge--level" role="listitem">LV ${briefing.level}</span>
          <span class="sb-badge sb-badge--sector" role="listitem">SEC ${sectorRoman(briefing.sector)}</span>
          <span class="sb-badge sb-badge--encounter ${encBadge.mod}" role="listitem">${encBadge.label}</span>
          <span class="sb-badge sb-badge--threat ${threatMod}" role="listitem">${briefing.threat}</span>
          <span class="sb-badge sb-badge--encounter sb-badge--encounter-${encounter}" role="listitem">${encounter === "bigBoss" ? "BOSS" : encounter === "miniBoss" ? "MINI" : "WAVE"}</span>
        </div>
        <div class="sector-briefing-threat-meter" aria-label="Threat level ${briefing.threat}">
          <div class="sb-threat-meter-head">
            <span class="sb-threat-meter-label">Hostile density</span>
            <span class="sb-threat-meter-value ${threatMod}">${briefing.threat}</span>
          </div>
          <div class="sb-threat-track">
            <div class="sb-threat-fill ${threatMod}" style="width: ${meterPct}%"></div>
          </div>
        </div>
      </header>

      <div class="sector-briefing-scanband" aria-hidden="true">
        <div class="sb-radar">
          <span class="sb-radar-ring sb-radar-ring--outer"></span>
          <span class="sb-radar-ring sb-radar-ring--mid"></span>
          <span class="sb-radar-ring sb-radar-ring--inner"></span>
          <span class="sb-radar-sweep"></span>
          <span class="sb-radar-blip"></span>
        </div>
        <div class="arcade-invaders arcade-invaders--march sector-briefing-invaders">
          ${INVADER_STRIP_SVG}
        </div>
        <div class="sb-encounters">${encounters}</div>
      </div>

      <div class="sector-briefing-body">
        <p class="sector-briefing-body-text">${briefing.body}</p>
        <aside class="sector-briefing-tip">
          <span class="sector-briefing-tip-label">Operator tip</span>
          <p>${briefing.tip}</p>
        </aside>
      </div>

      <footer class="sector-briefing-footer">
        <button type="button" class="btn btn-primary btn-deploy sector-briefing-go" aria-describedby="sector-briefing-deploy-hint">
          <span class="btn-deploy-label">Deploy</span>
          <span class="btn-deploy-sub">Engage hostiles</span>
        </button>
        <p class="sector-briefing-deploy-hint" id="sector-briefing-deploy-hint">
          <kbd>Space</kbd> or <kbd>Enter</kbd> to launch
        </p>
      </footer>
    </div>`;

  const dismiss = (): void => {
    root.classList.add("hidden");
    root.innerHTML = "";
    onDismiss();
  };

  root.querySelector(".sector-briefing-go")?.addEventListener("click", dismiss, { once: true });

  const panel = root.querySelector(".sector-briefing-panel");
  requestAnimationFrame(() => {
    panel?.classList.remove("sector-briefing-panel--intro");
    panel?.classList.add("sector-briefing-panel--visible");
  });

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dismiss();
      window.removeEventListener("keydown", onKey);
    }
  };
  window.addEventListener("keydown", onKey);
}
