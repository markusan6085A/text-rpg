// Збереження останніх 10 логів бою протягом 5 хвилин
import { getJSON, setJSON } from "../persistence";

const BATTLE_LOGS_KEY = "l2_battle_logs";
const BATTLE_LOGS_MAX_COUNT = 10;
const BATTLE_LOGS_TTL_MS = 5 * 60 * 1000; // 5 хвилин

type BattleLogEntry = {
  timestamp: number;
  logs: string[];
};

type BattleLogsStorage = {
  heroName: string;
  entries: BattleLogEntry[];
};

export function saveBattleLogs(logs: string[], heroName?: string | null): void {
  if (!heroName || !logs || logs.length === 0) return;

  try {
    const storageKey = `${BATTLE_LOGS_KEY}_${heroName}`;
    const existing: BattleLogsStorage | null = getJSON<BattleLogsStorage | null>(storageKey, null);

    const now = Date.now();
    const newEntry: BattleLogEntry = {
      timestamp: now,
      logs: logs.slice(0, BATTLE_LOGS_MAX_COUNT), // Обмежуємо до 10 логів
    };

    let entries: BattleLogEntry[] = [];
    if (existing && existing.heroName === heroName && existing.entries) {
      // Фільтруємо застарілі записи (старші за 5 хвилин)
      entries = existing.entries.filter(
        (entry) => now - entry.timestamp < BATTLE_LOGS_TTL_MS
      );
    }

    // Додаємо новий запис в початок
    entries = [newEntry, ...entries].slice(0, BATTLE_LOGS_MAX_COUNT);

    const storage: BattleLogsStorage = {
      heroName,
      entries,
    };

    setJSON(storageKey, storage);
  } catch (err) {
    console.error("[battleLogs] Failed to save battle logs:", err);
  }
}

export function loadBattleLogs(heroName?: string | null): string[] {
  if (!heroName) return [];

  try {
    const storageKey = `${BATTLE_LOGS_KEY}_${heroName}`;
    const existing: BattleLogsStorage | null = getJSON<BattleLogsStorage | null>(storageKey, null);

    if (!existing || existing.heroName !== heroName || !existing.entries) {
      return [];
    }

    const now = Date.now();
    // Фільтруємо застарілі записи (старші за 5 хвилин)
    const validEntries = existing.entries.filter(
      (entry) => now - entry.timestamp < BATTLE_LOGS_TTL_MS
    );

    // Повертаємо лог з найновішого запиту (останні 10 логів)
    if (validEntries.length > 0) {
      return validEntries[0].logs;
    }

    return [];
  } catch (err) {
    console.error("[battleLogs] Failed to load battle logs:", err);
    return [];
  }
}

export function clearBattleLogs(heroName?: string | null): void {
  if (!heroName) return;

  try {
    const storageKey = `${BATTLE_LOGS_KEY}_${heroName}`;
    const { removeItem } = require("../persistence");
    removeItem(storageKey);
  } catch (err) {
    console.error("[battleLogs] Failed to clear battle logs:", err);
  }
}
