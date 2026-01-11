import { useHeroStore } from "../../heroStore";
import { computeBuffedMaxResources } from "../helpers";
import { getMaxResources } from "../helpers/getMaxResources";
import type { BattleBuff, BattleState } from "../types";

/**
 * Обробляє tick ефекти для активних toggle скілів
 * Віднімає HP/MP кожні tickInterval секунд
 * Автоматично вимикає toggle, якщо ресурсів недостатньо
 */
export function processToggleTicks(
  state: BattleState,
  now: number,
  updateHero: (partial: { hp?: number; mp?: number }) => void,
  updateBuffs: (buffs: BattleBuff[]) => void
): { updatedBuffs: BattleBuff[]; logMessages: string[] } {
  const hero = useHeroStore.getState().hero;
  if (!hero) {
    return { updatedBuffs: state.heroBuffs || [], logMessages: [] };
  }

  const baseMax = getMaxResources(hero);
  const { maxHp, maxMp } = computeBuffedMaxResources(baseMax, state.heroBuffs || []);
  const curHP = Math.min(maxHp, hero.hp ?? maxHp);
  const curMP = Math.min(maxMp, hero.mp ?? maxMp);

  const updatedBuffs: BattleBuff[] = [];
  const logMessages: string[] = [];
  let hpChange = 0;
  let mpChange = 0;

  // Перевіряємо всі активні toggle бафи
  for (const buff of state.heroBuffs || []) {
    // Toggle бафи мають expiresAt === Number.MAX_SAFE_INTEGER
    const isToggle = buff.expiresAt === Number.MAX_SAFE_INTEGER;
    
    if (!isToggle || (!buff.hpPerTick && !buff.mpPerTick)) {
      // Не toggle або немає tick ефектів - просто додаємо без змін
      updatedBuffs.push(buff);
      continue;
    }

    const tickInterval = (buff.tickInterval ?? 5) * 1000; // Конвертуємо в мілісекунди
    const lastTickAt = buff.lastTickAt ?? buff.startedAt ?? now;
    const timeSinceLastTick = now - lastTickAt;

    // Якщо минуло достатньо часу для наступного tick
    if (timeSinceLastTick >= tickInterval) {
      const ticksToProcess = Math.floor(timeSinceLastTick / tickInterval);
      
      // Обчислюємо зміни ресурсів
      let totalHpChange = 0;
      let totalMpChange = 0;

      if (buff.hpPerTick) {
        // hpPerTick завжди позитивне, але воно означає споживання (віднімання)
        totalHpChange = -Math.abs(buff.hpPerTick) * ticksToProcess;
      }
      if (buff.mpPerTick) {
        // mpPerTick завжди позитивне, але воно означає споживання (віднімання)
        totalMpChange = -Math.abs(buff.mpPerTick) * ticksToProcess;
      }

      // Перевіряємо, чи достатньо ресурсів
      const newHP = curHP + hpChange + totalHpChange;
      const newMP = curMP + mpChange + totalMpChange;

      // Якщо ресурсів недостатньо - вимикаємо toggle (тихо, без повідомлення в лог)
      if (newHP <= 0 || newMP < 0) {
        // Не додаємо цей баф до updatedBuffs (вимикаємо)
        continue;
      }

      // Оновлюємо зміни ресурсів
      hpChange += totalHpChange;
      mpChange += totalMpChange;

      // Оновлюємо lastTickAt
      const newLastTickAt = lastTickAt + tickInterval * ticksToProcess;
      updatedBuffs.push({
        ...buff,
        lastTickAt: newLastTickAt,
      });

      // Не додаємо повідомлення про tick ефекти в лог (тихо споживаємо ресурси)
    } else {
      // Ще не час для tick - додаємо без змін
      updatedBuffs.push(buff);
    }
  }

  // Застосовуємо зміни до ресурсів
  if (hpChange !== 0 || mpChange !== 0) {
    const newHP = Math.max(0, Math.min(maxHp, curHP + hpChange));
    const newMP = Math.max(0, Math.min(maxMp, curMP + mpChange));
    updateHero({ hp: newHP, mp: newMP });
  }

  return { updatedBuffs, logMessages };
}

