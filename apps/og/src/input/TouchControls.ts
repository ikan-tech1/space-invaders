export class TouchControls {
  moveAxis = 0;
  firePressed = false;
  pausePressed = false;
  private moveTouchId: number | null = null;
  private movePointerId: number | null = null;
  private thumbEl: HTMLElement | null = null;

  constructor(
    private moveEl: HTMLElement,
    fireEl: HTMLElement,
    pauseEl: HTMLElement,
    scale = 1
  ) {
    const touchScale = `scale(${scale})`;
    moveEl.style.transform = touchScale;
    fireEl.style.transform = touchScale;
    pauseEl.style.transform = touchScale;

    let thumb = moveEl.querySelector<HTMLElement>(".touch-move-thumb");
    if (!thumb) {
      thumb = document.createElement("span");
      thumb.className = "touch-move-thumb";
      thumb.setAttribute("aria-hidden", "true");
      moveEl.appendChild(thumb);
    }
    this.thumbEl = thumb;

    moveEl.addEventListener("touchstart", this.onMoveStart, { passive: false });
    moveEl.addEventListener("touchmove", this.onMoveMove, { passive: false });
    moveEl.addEventListener("touchend", this.onMoveEnd, { passive: false });
    moveEl.addEventListener("touchcancel", this.onMoveEnd, { passive: false });
    moveEl.addEventListener("pointerdown", this.onPointerDown);
    moveEl.addEventListener("pointermove", this.onPointerMove);
    moveEl.addEventListener("pointerup", this.onPointerUp);
    moveEl.addEventListener("pointercancel", this.onPointerUp);

    const onFireDown = (e: Event): void => {
      e.preventDefault();
      this.firePressed = true;
      fireEl.classList.add("touch-fire--active");
    };
    const onFireUp = (): void => {
      this.firePressed = false;
      fireEl.classList.remove("touch-fire--active");
    };

    fireEl.addEventListener("touchstart", onFireDown, { passive: false });
    fireEl.addEventListener("touchend", onFireUp);
    fireEl.addEventListener("touchcancel", onFireUp);
    fireEl.addEventListener("pointerdown", onFireDown);
    fireEl.addEventListener("pointerup", onFireUp);
    fireEl.addEventListener("pointerleave", onFireUp);
    fireEl.addEventListener("pointercancel", onFireUp);

    const onPause = (e: Event): void => {
      e.preventDefault();
      this.pausePressed = true;
      pauseEl.classList.add("touch-pause--active");
      window.setTimeout(() => pauseEl.classList.remove("touch-pause--active"), 120);
    };

    pauseEl.addEventListener("touchstart", onPause, { passive: false });
    pauseEl.addEventListener("pointerdown", onPause);
    pauseEl.addEventListener("click", onPause);
  }

  private onMoveStart = (e: TouchEvent): void => {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (!t) return;
    this.moveTouchId = t.identifier;
    this.setMoveActive(true);
    this.updateAxis(t.clientX);
  };

  private onMoveMove = (e: TouchEvent): void => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this.moveTouchId) {
        this.updateAxis(t.clientX);
        break;
      }
    }
  };

  private onMoveEnd = (e: TouchEvent): void => {
    for (const t of e.changedTouches) {
      if (t.identifier === this.moveTouchId) {
        this.clearMove();
      }
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === "touch") return;
    e.preventDefault();
    this.movePointerId = e.pointerId;
    this.moveEl.setPointerCapture(e.pointerId);
    this.setMoveActive(true);
    this.updateAxis(e.clientX);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.movePointerId) return;
    e.preventDefault();
    this.updateAxis(e.clientX);
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.movePointerId) return;
    try {
      this.moveEl.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    this.movePointerId = null;
    this.clearMove();
  };

  private clearMove(): void {
    this.moveTouchId = null;
    this.moveAxis = 0;
    this.setMoveActive(false);
    if (this.thumbEl) this.thumbEl.style.left = "50%";
  }

  private setMoveActive(active: boolean): void {
    this.moveEl.classList.toggle("touch-active", active);
  }

  private updateAxis(clientX: number): void {
    const rect = this.moveEl.getBoundingClientRect();
    const half = rect.width / 2;
    const delta = clientX - (rect.left + half);
    this.moveAxis = Math.max(-1, Math.min(1, delta / half));
    if (this.thumbEl) {
      const pct = ((this.moveAxis + 1) / 2) * 100;
      this.thumbEl.style.left = `${pct}%`;
    }
  }

  consumePause(): boolean {
    if (this.pausePressed) {
      this.pausePressed = false;
      return true;
    }
    return false;
  }
}
