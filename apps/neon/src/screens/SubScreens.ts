import type { LocalStorageRepo } from "../storage/LocalStorageRepo";
import { loadNeonMeta, saveNeonMeta } from "../progression/metaStore";
import type { Screen } from "./ScreenRouter";

const SUB_HEADER_FRAME = `
  <div class="sub-header-frame" aria-hidden="true">
    <span class="hangar-bracket hangar-bracket-tl"></span>
    <span class="hangar-bracket hangar-bracket-tr"></span>
    <span class="hangar-bracket hangar-bracket-bl"></span>
    <span class="hangar-bracket hangar-bracket-br"></span>
  </div>`;

export function createSettingsScreen(repo: LocalStorageRepo, onBack: () => void): Screen {
  return {
    id: "settings",
    mount(root) {
      const s = repo.getSettings();
      root.innerHTML = `
        <div class="screen sub-screen">
          <header class="sub-header sub-header--framed">
            ${SUB_HEADER_FRAME}
            <h1 class="screen-title">Settings</h1>
            <p class="screen-subtitle">System configuration</p>
          </header>
          <div class="sub-screen-body">
            <section class="panel">
              <h2 class="panel-label">Audio &amp; Display</h2>
              <div class="settings-list">
                <div class="settings-row"><label for="vol">Volume</label><input type="range" id="vol" min="0" max="1" step="0.05" value="${s.volume}" /></div>
                <div class="settings-row"><label for="touch">Touch scale</label><input type="range" id="touch" min="0.8" max="1.4" step="0.1" value="${s.touchScale}" /></div>
                <div class="settings-row"><label for="mute">Mute</label><input type="checkbox" id="mute" ${s.muted ? "checked" : ""} /></div>
                <div class="settings-row"><label for="fx">Reduced FX</label><input type="checkbox" id="fx" ${s.reducedFx ? "checked" : ""} /></div>
              </div>
            </section>
          </div>
          <footer class="sub-screen-footer">
            <button type="button" class="btn btn-primary" data-back>Hangar</button>
          </footer>
        </div>`;
      const save = () => {
        repo.saveSettings({
          volume: parseFloat((root.querySelector("#vol") as HTMLInputElement).value),
          touchScale: parseFloat((root.querySelector("#touch") as HTMLInputElement).value),
          muted: (root.querySelector("#mute") as HTMLInputElement).checked,
          reducedFx: (root.querySelector("#fx") as HTMLInputElement).checked,
        });
      };
      root.querySelector("#vol")?.addEventListener("input", save);
      root.querySelector("#touch")?.addEventListener("input", save);
      root.querySelector("#mute")?.addEventListener("change", save);
      root.querySelector("#fx")?.addEventListener("change", save);
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createRecordsScreen(repo: LocalStorageRepo, onBack: () => void): Screen {
  return {
    id: "records",
    mount(root) {
      const scores = repo.getHighScores();
      const rows =
        scores.length === 0
          ? '<li class="records-empty">No records yet — deploy and score.</li>'
          : scores
              .map(
                (e, i) =>
                  `<li><span class="records-rank">${i + 1}. ${e.initials}</span><span class="records-score">${e.score.toLocaleString()} · W${e.wave} · T${e.maxTier}</span></li>`
              )
              .join("");
      root.innerHTML = `
        <div class="screen sub-screen">
          <header class="sub-header sub-header--framed">
            ${SUB_HEADER_FRAME}
            <h1 class="screen-title">Records</h1>
            <p class="screen-subtitle">Top deployment scores</p>
            ${scores.length ? `<div class="sub-header-rail">Entries <strong>${scores.length}</strong></div>` : ""}
          </header>
          <div class="sub-screen-body">
            <ul class="records-list high-score-list">${rows}</ul>
          </div>
          <footer class="sub-screen-footer">
            <button type="button" class="btn btn-primary" data-back>Hangar</button>
          </footer>
        </div>`;
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createBriefingScreen(onBack: () => void): Screen {
  return {
    id: "howToPlay",
    mount(root) {
      const meta = loadNeonMeta();
      if (!meta.briefingVisited) {
        meta.briefingVisited = true;
        saveNeonMeta(meta);
      }
      root.innerHTML = `
        <div class="screen sub-screen">
          <header class="sub-header sub-header--framed">
            ${SUB_HEADER_FRAME}
            <h1 class="screen-title">Briefing</h1>
            <p class="screen-subtitle">Operator manual</p>
          </header>
          <div class="sub-screen-body briefing-stack">
            <section class="panel briefing-block">
              <h2 class="panel-label">Mission</h2>
              <p><strong>Goal:</strong> Clear 12 campaign sectors. Mini boss L3/L9, capital boss L6/L12.</p>
              <p><strong>Weapons:</strong> T1 Pulse → T2 Scatter → T3 Kinetic Gauss (heavy slug) → T4 Beam Laser → T5 Singularity.</p>
              <p><strong>Mac:</strong> A/D or arrows move, Space fires (hold for beam), P pauses.</p>
              <p><strong>iPhone:</strong> Drag move zone, tap FIRE.</p>
            </section>
            <section class="panel briefing-block">
              <h2 class="panel-label">Systems</h2>
              <p><strong>Pickups:</strong> Overdrive, Prism, Aegis, Chrono, Nanite, Ion Lance, Nova, Gauss Burst, Clone Wing, Bunker, Slow.</p>
              <p><strong>Modules:</strong> Overcharger, Stabilizer, Salvager — unlock via Challenges.</p>
              <p><strong>Story:</strong> Pre-sector briefings and Sector Intel unlock as you progress.</p>
            </section>
            <section class="panel briefing-block">
              <h2 class="panel-label">Hangar Codes</h2>
              <p>8-character bonus codes unlock cosmetic bolt trails — not passwords, just fun rewards.</p>
              <p>Type a code in the Hangar Codes panel on the main deck. Hints appear as you clear sectors or read this briefing.</p>
              <p><strong>Starter hint:</strong> The hangar tagline says Space Invaders <em>2050</em> — combine NEON with that year.</p>
            </section>
          </div>
          <footer class="sub-screen-footer">
            <button type="button" class="btn btn-primary" data-back>Hangar</button>
          </footer>
        </div>`;
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}
