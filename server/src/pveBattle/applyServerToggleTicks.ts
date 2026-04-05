/**
 * Авторитетний drain toggle (mpPerTick / hpPerTick) у базовому просторі heroJson, як у client processToggleTicks.
 */

import { clampPveResource } from "./pveHeroResourceSync";

const MAX_CATCHUP_DEFAULT = 10;

/**
 * На старті PvE в БД часто лежить застарілий lastTickAt (клієнт у місті вже крутив toggle локально).
 * Інакше перший pve-battle-tick злітає в catch-up (до 10 інтервалів), зносить MP і знімає аури —
 * гравець бачить «перший удар забрав пів HP/CP», хоча в логу лише десятки урону.
 */
export function resyncPveToggleClocksForSessionStart(heroJson: any, now: number): void {
  const hj = heroJson;
  if (!hj || typeof hj !== "object") return;
  const raw = Array.isArray(hj.heroBuffs) ? hj.heroBuffs : [];
  hj.heroBuffs = raw.map((buff: any) => {
    if (!buff || typeof buff !== "object") return buff;
    const exp = Number(buff.expiresAt);
    if (exp !== Number.MAX_SAFE_INTEGER) return buff;
    const mpPerTick = buff.mpPerTick != null ? Number(buff.mpPerTick) : 0;
    const hpPerTick = buff.hpPerTick != null ? Number(buff.hpPerTick) : 0;
    if (!mpPerTick && !hpPerTick) return buff;
    const st = Number(buff.startedAt);
    return {
      ...buff,
      lastTickAt: now,
      startedAt: Number.isFinite(st) && st > 0 ? st : now,
    };
  });
}

export function applyServerToggleResourceTicks(
  heroJson: any,
  now: number,
  opts?: { maxTickCatchup?: number }
): string[] {
  const logLines: string[] = [];
  const hj = heroJson;
  if (!hj || typeof hj !== "object") return logLines;

  const maxCatchup = Math.max(
    1,
    Math.min(20, Math.floor(opts?.maxTickCatchup ?? MAX_CATCHUP_DEFAULT))
  );

  const maxHp = Math.max(1, Math.floor(Number(hj.maxHp ?? 1)));
  const maxMp = Math.max(1, Math.floor(Number(hj.maxMp ?? 1)));
  let hp = clampPveResource(Math.floor(Number(hj.hp ?? 0)), 0, maxHp);
  let mp = clampPveResource(Math.floor(Number(hj.mp ?? 0)), 0, maxMp);

  const raw = Array.isArray(hj.heroBuffs) ? hj.heroBuffs : [];
  const out: any[] = [];

  for (const buff of raw) {
    if (!buff || typeof buff !== "object") continue;
    const exp = Number(buff.expiresAt);
    if (exp !== Number.MAX_SAFE_INTEGER) {
      out.push(buff);
      continue;
    }
    const mpPerTick = buff.mpPerTick != null ? Number(buff.mpPerTick) : 0;
    const hpPerTick = buff.hpPerTick != null ? Number(buff.hpPerTick) : 0;
    if (!mpPerTick && !hpPerTick) {
      out.push(buff);
      continue;
    }

    const tickIntervalMs = Math.max(1000, Math.floor(Number(buff.tickInterval ?? 5) * 1000));
    const lastTickAt = Number(buff.lastTickAt ?? buff.startedAt ?? now);
    let elapsed = now - (Number.isFinite(lastTickAt) ? lastTickAt : now);
    if (!Number.isFinite(elapsed) || elapsed < 0) elapsed = 0;

    let ticks = Math.floor(elapsed / tickIntervalMs);
    ticks = Math.min(Math.max(0, ticks), maxCatchup);

    if (ticks === 0) {
      out.push(buff);
      continue;
    }

    const totalHp = hpPerTick ? -Math.abs(hpPerTick) * ticks : 0;
    const totalMp = mpPerTick ? -Math.abs(mpPerTick) * ticks : 0;
    const tryHp = hp + totalHp;
    const tryMp = mp + totalMp;

    if (tryHp <= 0 || tryMp < 0) {
      const name = String(buff.name ?? "").trim() || "Невідомо";
      logLines.push(`Ваша аура [${name}] закінчилася.`);
      continue;
    }

    hp = clampPveResource(Math.floor(tryHp), 0, maxHp);
    mp = clampPveResource(Math.floor(tryMp), 0, maxMp);
    out.push({
      ...buff,
      lastTickAt: lastTickAt + tickIntervalMs * ticks,
    });
  }

  hj.hp = hp;
  hj.mp = mp;
  hj.heroBuffs = out;
  return logLines;
}
