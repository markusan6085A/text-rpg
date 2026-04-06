/**
 * Пасивний реген MP/CP між PvE-мутаціями (паритет з client getHeroRegenPerSecond / regenTick ~1 с).
 * Без цього клієнт показує відновлену ману, а pve-battle-attack читає застарілий hj.mp з БД → not_enough_mp.
 */

import { clampPveResource } from "./pveHeroResourceSync";

const MAX_CATCHUP_SEC = 10;

function regenPerSecFromHero(hj: any): { mp: number; cp: number } {
  const lvl = Math.max(1, Math.floor(Number(hj.level ?? 1)));
  const baseMp = Math.max(1, Math.round(12 + (lvl - 1) * 0.1));
  const baseCp = Math.max(1, Math.round(7 + (lvl - 1) * 0.06));
  const bs = hj.battleStats && typeof hj.battleStats === "object" ? hj.battleStats : {};
  return {
    mp: Math.max(0, Number(bs.mpRegen ?? baseMp)),
    cp: Math.max(0, Number(bs.cpRegen ?? baseCp)),
  };
}

/**
 * Оновлює hj.mp / hj.cp і sess.lastPassiveRegenAt. Викликати після applyServerToggleResourceTicks.
 */
export function applyPvePassiveMpCpRegen(hj: any, now: number): void {
  const sess = hj?.battleSession;
  if (!sess || Number(sess.v) !== 1) return;

  const maxMp = Math.max(1, Math.floor(Number(hj.maxMp ?? 1)));
  const maxCp = Math.max(1, Math.floor(Number(hj.maxCp ?? 1)));

  const lastAtRaw = Number(sess.lastPassiveRegenAt);
  const startedAt = Number(sess.startedAt) || 0;
  const base =
    Number.isFinite(lastAtRaw) && lastAtRaw > 0
      ? lastAtRaw
      : Number.isFinite(startedAt) && startedAt > 0
        ? startedAt
        : now;
  const elapsedSec = Math.min(MAX_CATCHUP_SEC, Math.max(0, (now - base) / 1000));
  if (elapsedSec <= 0) {
    sess.lastPassiveRegenAt = now;
    return;
  }

  const { mp: mpPerSec, cp: cpPerSec } = regenPerSecFromHero(hj);
  let mp = clampPveResource(Math.floor(Number(hj.mp ?? 0)), 0, maxMp);
  let cp = clampPveResource(Math.floor(Number(hj.cp ?? 0)), 0, maxCp);

  mp = clampPveResource(Math.floor(mp + mpPerSec * elapsedSec), 0, maxMp);
  cp = clampPveResource(Math.floor(cp + cpPerSec * elapsedSec), 0, maxCp);

  hj.mp = mp;
  hj.cp = cp;
  sess.lastPassiveRegenAt = now;
}
