const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface FocusTrapOptions {
  initial?: HTMLElement | null;
  returnFocus?: HTMLElement | null;
}

export interface FocusTrapHandle {
  release: () => void;
}

function focusableIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1 && el.offsetParent !== null
  );
}

/** Keep keyboard focus inside a modal until release() is called. */
export function trapFocus(container: HTMLElement, options: FocusTrapOptions = {}): FocusTrapHandle {
  const previous = document.activeElement as HTMLElement | null;

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== "Tab") return;
    const items = focusableIn(container);
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (e.shiftKey) {
      if (document.activeElement === first || !container.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last || !container.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", onKeyDown);
  const initial = options.initial ?? focusableIn(container)[0];
  initial?.focus();

  return {
    release: () => {
      container.removeEventListener("keydown", onKeyDown);
      const restore = options.returnFocus ?? previous;
      if (restore?.isConnected) restore.focus();
    },
  };
}
