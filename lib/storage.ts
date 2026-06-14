// Tiny localStorage wrapper for no-login persistence: just an all-time best
// score, so the start/result screens can show a "HI" target to beat.

const BEST_KEY = "wh:best";

export function getBest(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
}

export function setBest(score: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BEST_KEY, String(score));
}
