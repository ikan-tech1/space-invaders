export class TouchControls {
  moveAxis = 0;
  firePressed = false;
  pausePressed = false;
  private moveTouchId: number | null = null;

  constructor(
    private moveEl: HTMLElement,
    fireEl: HTMLElement,
    pauseEl: HTMLElement,
    scale = 1
  ) {
    moveEl.style.transform = `scale(${scale})`;
    fireEl.style.transform = `scale(${scale})`;

    moveEl.addEventListener("touchstart", this.onMoveStart, { passive: false });
    moveEl.addEventListener("touchmove", this.onMoveMove, { passive: false });
    moveEl.addEventListener("touchend", this.onMoveEnd, { passive: false });
    moveEl.addEventListener("touchcancel", this.onMoveEnd, { passive: false });

    const onFireDown = (e: Event): void => {
      e.preventDefault();
      this.firePressed = true;
    };
    const onFireUp = (): void => {
      this.firePressed = false;
    };

    fireEl.addEventListener("touchstart", onFireDown, { passive: false });
    fireEl.addEventListener("touchend", onFireUp);
    fireEl.addEventListener("touchcancel", onFireUp);
    fireEl.addEventListener("pointerdown", onFireDown);
    fireEl.addEventListener("pointerup", onFireUp);
    fireEl.addEventListener("pointerleave", onFireUp);
    fireEl.addEventListener("pointercancel", onFireUp);

    pauseEl.addEventListener("click", () => {
      this.pausePressed = true;
    });
  }

  private onMoveStart = (e: TouchEvent): void => {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (!t) return;
    this.moveTouchId = t.identifier;
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
        this.moveTouchId = null;
        this.moveAxis = 0;
      }
    }
  };

  private updateAxis(clientX: number): void {
    const rect = this.moveEl.getBoundingClientRect();
    const half = rect.width / 2;
    const delta = clientX - (rect.left + half);
    this.moveAxis = Math.max(-1, Math.min(1, delta / half));
  }

  consumePause(): boolean {
    if (this.pausePressed) {
      this.pausePressed = false;
      return true;
    }
    return false;
  }
}
