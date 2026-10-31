"use client";
/** Tiny Web Audio beeper · no assets, works offline. */
let ctx: AudioContext | null = null;

export function beep(pattern: number[] = [0, 180, 360], freq = 880) {
  try {
    ctx ??= new AudioContext();
    const c = ctx;
    if (c.state === "suspended") void c.resume();
    for (const offset of pattern) {
      const t = c.currentTime + offset / 1000;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    }
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    // Audio unavailable (e.g. no user gesture yet) · silent fallback.
  }
}

export function notify(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted" || document.visibilityState === "visible") return;
  try {
    new Notification(title, { body, icon: "/icon.svg" });
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
  }
}
