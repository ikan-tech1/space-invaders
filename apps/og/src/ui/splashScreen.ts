const SPLASH_KEY = "og_splash_seen";

export function showSplashIfNeeded(onDone: () => void): void {
  const overlay = document.getElementById("splash-overlay");
  if (!overlay || localStorage.getItem(SPLASH_KEY)) {
    onDone();
    return;
  }

  overlay.classList.remove("hidden");
  const bar = overlay.querySelector(".splash-loader-bar") as HTMLElement | null;
  const status = overlay.querySelector(".splash-status") as HTMLElement | null;
  const messages = ["Calibrating cabinet…", "Loading sprites…", "Syncing starfield…", "Ready."];

  let progress = 0;
  let msgIdx = 0;
  let done = false;

  const finish = (): void => {
    if (done) return;
    done = true;
    localStorage.setItem(SPLASH_KEY, "1");
    overlay.classList.add("splash-overlay--out");
    window.setTimeout(() => {
      overlay.classList.add("hidden");
      overlay.classList.remove("splash-overlay--out");
      if (bar) bar.style.width = "0%";
      onDone();
    }, 420);
  };

  const tick = window.setInterval(() => {
    progress = Math.min(100, progress + 9 + Math.random() * 7);
    if (bar) bar.style.width = `${progress}%`;
    if (status && progress > 22 * (msgIdx + 1) && msgIdx < messages.length - 1) {
      msgIdx++;
      status.textContent = messages[msgIdx]!;
    }
    if (progress >= 100) {
      window.clearInterval(tick);
      window.setTimeout(finish, 260);
    }
  }, 85);

  overlay.addEventListener(
    "click",
    () => {
      window.clearInterval(tick);
      finish();
    },
    { once: true }
  );
  window.setTimeout(() => {
    if (!done) finish();
  }, 2800);
}
