import type { BattleState } from "../types";
import { saveBattleLogs } from "../battleLogs";

// Не імпортуємо heroStore — уникнення циклу: heroStore → heroLoadAPI → battle/helpers → heroStore

// Minimal cleanup: drop only the Unicode replacement char; otherwise keep the log as-is.
export const sanitizeLine = (line: string) =>
  typeof line === "string" ? line.replace(/\uFFFD/g, "") : "";

export const sanitizeLog = (lines: unknown): string[] => {
  if (!Array.isArray(lines)) return [];
  return (lines as unknown[])
    .filter((l) => typeof l === "string")
    .map((l) => sanitizeLine(l as string))
    .slice(0, 10) as string[]; // 🔥 Обмежуємо до 10 логів
};

export const persistSnapshot = (
  get: () => BattleState,
  persist: (data: Partial<BattleState>, heroName?: string | null) => void,
  partial?: Partial<BattleState>
) => {
  const merged = { ...get(), ...(partial || {}) };
  // heroName зі стану бою (встановлюється при startBattle / restore), щоб не імпортувати heroStore
  const heroName = merged.heroName ?? null;

  if (!heroName) {
    if (import.meta.env.DEV) {
      console.warn("[battleStore] Cannot persist: heroName is not available");
    }
    return;
  }
  
  const sanitizedLog = sanitizeLog(merged.log);
  
  // 🔥 Зберігаємо логи бою в окреме місце для відновлення після виходу з бою (10 логів протягом 5 хвилин)
  if (sanitizedLog.length > 0) {
    saveBattleLogs(sanitizedLog, heroName);
  }
  
  persist({
    heroName, // Зберігаємо heroName для перевірки при завантаженні
    zoneId: merged.zoneId,
    mob: merged.mob,
    mobIndex: merged.mobIndex,
    mobHP: merged.mobHP,
    mobNextAttackAt: merged.mobNextAttackAt,
    status: merged.status,
    log: sanitizedLog,
    cooldowns: merged.cooldowns,
    loadoutSlots: merged.loadoutSlots,
    activeChargeSlots: merged.activeChargeSlots,
    lastReward: merged.lastReward,
    heroBuffs: merged.heroBuffs,
    summon: merged.summon,
    summonBuffs: merged.summonBuffs,
    baseSummonStats: merged.baseSummonStats,
    summonLastAttackAt: merged.summonLastAttackAt,
    resurrection: merged.resurrection,
  }, heroName);
};

