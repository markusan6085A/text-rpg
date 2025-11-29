// ==========================
// FILE: src/state.ts
// (оновлена глобальна модель прогресу + авто-рефреш на КОЖЕН клік)
// ==========================
import { useSyncExternalStore } from "react";
import type { Mob } from "./data/world/types";

export type Progress = {
  level: number;   // поточний рівень
  exp: number;     // exp у поточному рівні
  sp: number;
  adena: number;
  totalKills: number;
  hp: number;
  mp: number;
};

const LS_PROGRESS = "l2_progress";

// Рейти сервера (з брифу)
export const RATE_EXP = 2000;
export const RATE_SP = 2000;
export const RATE_ADENA = 2000;

export function expToNext(level: number): number {
  return Math.max(50, Math.floor((level + 1) * (level + 1) * 100));
}

export function maxHP(level: number) {
  return 100 + level * 25; // проста формула
}
export function maxMP(level: number) {
  return 80 + level * 20;
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(LS_PROGRESS);
    if (raw) {
      const p = JSON.parse(raw) as Progress;
      // страховка для старих збережень (де не було hp/mp)
      if (typeof p.hp !== "number" || typeof p.mp !== "number") {
        const mh = maxHP(p.level || 0);
        const mm = maxMP(p.level || 0);
        p.hp = Math.min(p.hp ?? mh, mh);
        p.mp = Math.min(p.mp ?? mm, mm);
      }
      return p;
    }
  } catch {}
  const init = { level: 0, exp: 0, sp: 0, adena: 0, totalKills: 0, hp: maxHP(0), mp: maxMP(0) };
  localStorage.setItem(LS_PROGRESS, JSON.stringify(init));
  return init;
}

export function saveProgress(p: Progress) {
  localStorage.setItem(LS_PROGRESS, JSON.stringify(p));
}

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }

function regenTick(p: Progress) {
  // невелика регенерація на кожен клік (1.5% HP, 2% MP від максимуму)
  const mh = maxHP(p.level), mm = maxMP(p.level);
  p.hp = clamp(Math.round(p.hp + mh * 0.015), 0, mh);
  p.mp = clamp(Math.round(p.mp + mm * 0.02), 0, mm);
}

export function addFromMob(m: Mob) {
  const p = loadProgress();
  const gainExp = m.exp * RATE_EXP;
  const gainSp = Math.floor(m.exp * 0.2 * RATE_SP);
  const gainAdena = randInt(m.adenaMin, m.adenaMax) * RATE_ADENA;

  p.exp += gainExp;
  p.sp += gainSp;
  p.adena += gainAdena;
  p.totalKills += 1;

  while (p.exp >= expToNext(p.level)) {
    p.exp -= expToNext(p.level);
    p.level += 1;
    // при апі рівня поповнимо HP/MP до максимума
    p.hp = maxHP(p.level);
    p.mp = maxMP(p.level);
  }

  saveProgress(p);
  // після зміни прогресу — тик для live-підписників
  notify();
  return { gainExp, gainSp, gainAdena, level: p.level, exp: p.exp, toNext: expToNext(p.level) };
}

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/* ─────────── LIVE-СТОР ───────────
   Будь-який клік у документі викликає regen + notify,
   а компоненти, що користуються useLive(), автоматично перерендеряться.
*/
let tick = 0;
const listeners = new Set<() => void>();

function getSnapshot() { return tick; }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

export function notify() {
  // реген перед нотифікацією
  const p = loadProgress();
  regenTick(p);
  saveProgress(p);
  tick++;
  for (const l of listeners) l();
}

// Один раз підвісимо глобальний слухач кліків (capture, щоб ловити все)
if (typeof document !== "undefined" && !(window as any).__l2_click_hooked) {
  document.addEventListener("click", () => notify(), true);
  (window as any).__l2_click_hooked = true;
}

export function useLive() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
