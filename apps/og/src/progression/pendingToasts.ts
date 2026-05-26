const KEY = "og_pending_toasts";

export function queuePendingToast(message: string): void {
  try {
    const raw = localStorage.getItem(KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(message)) list.push(message);
    localStorage.setItem(KEY, JSON.stringify(list.slice(-8)));
  } catch {
    localStorage.setItem(KEY, JSON.stringify([message]));
  }
}

export const queueAchievementToast = queuePendingToast;

export function loadPendingToasts(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as string[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function clearPendingToasts(): void {
  localStorage.removeItem(KEY);
}

export function drainPendingToasts(): string[] {
  const list = loadPendingToasts();
  clearPendingToasts();
  return list;
}
