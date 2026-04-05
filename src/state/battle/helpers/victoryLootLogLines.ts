/** Числа в лозі нагороди — як у L2-клієнті (ru-RU, з розділювачем тисяч). */
export function formatLootInt(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(Number(n) || 0));
}

/** Для картки перемоги — розділювач тисяч комою (як на референсі L2). */
export function formatLootIntEn(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(Number(n) || 0));
}

/**
 * Два рядки нагороди для бортового логу (адена жовта, EXP/SP помаранчеві через BattleLog.getColor).
 */
export function buildVictoryResourceLogLines(
  _heroName: string,
  displayExp: number,
  displaySp: number,
  displayAdena: number
): string[] {
  const e = formatLootInt(displayExp);
  const s = formatLootInt(displaySp);
  const a = formatLootInt(displayAdena);
  return [`Знайдено: ${a} аден.`, `Отримано: ${e} EXP та ${s} SP.`];
}

/** Рядки для союзників у пати (рівна частка EXP/адена/SP, як на сервері kill-share). */
export function buildPartyMemberVictoryLogLines(
  members: { characterId: string; name: string }[],
  killerCharacterId: string,
  eachExp: number,
  eachSp: number,
  eachAdena: number
): string[] {
  if (eachExp === 0 && eachSp === 0 && eachAdena === 0) return [];
  const e = formatLootInt(eachExp);
  const s = formatLootInt(eachSp);
  const a = formatLootInt(eachAdena);
  return members
    .filter((m) => m.characterId !== killerCharacterId)
    .map((m) => `${m.name} получил ${e} EXP, ${a} аден и ${s} SP.`);
}

/**
 * Лог бою зберігається як [найновіше … старіше]. Рядки battle-finish про дроп раніше prepend-ились і
 * опинялись над «ПЕРЕМОГА!». Вставляємо після того ж блоку, що й локальні dropMessages: після
 * «ПЕРЕМОГА!», Auto Spoil / Whirlwind, «Знайдено:» та «Отримано:».
 */
export function mergeServerDropLinesIntoVictoryBattleLog(
  filteredLog: string[],
  serverDropLines: string[],
): string[] {
  if (!serverDropLines.length) return filteredLog;
  const insertAt = victoryRewardBlockEndIndex(filteredLog);
  return [...filteredLog.slice(0, insertAt), ...serverDropLines, ...filteredLog.slice(insertAt)];
}

function victoryRewardBlockEndIndex(log: string[]): number {
  const permIdx = log.findIndex((l) => l === "ПЕРЕМОГА!");
  if (permIdx < 0) return 0;
  let i = permIdx + 1;
  while (i < log.length) {
    const line = log[i];
    if (
      line?.startsWith("Auto Spoil:") ||
      line?.startsWith("Whirlwind Attack:") ||
      line?.startsWith("Знайдено:") ||
      line?.startsWith("Отримано:")
    ) {
      i++;
      continue;
    }
    break;
  }
  return i;
}

const DROP_LINE_RE = /^(Дроп|Спойл|Квест):/;

/**
 * Екран перемоги: рядки дропу показуємо під кнопками «Продовжити», у лозі лишаємо решту (без дублю дропу).
 * Лог [найновіше … старіше]; блок після «ПЕРЕМОГА!» … «Отримано:» — поспіль Дроп/Спойл/Квест.
 */
export function extractVictoryLootLinesForPanel(log: string[] | undefined): {
  lootLines: string[];
  logWithoutLoot: string[];
} {
  if (!Array.isArray(log) || log.length === 0) {
    return { lootLines: [], logWithoutLoot: log ? [...log] : [] };
  }
  const permIdx = log.findIndex((l) => l === "ПЕРЕМОГА!");
  if (permIdx < 0) {
    return { lootLines: [], logWithoutLoot: [...log] };
  }
  const lootIndices = new Set<number>();
  let i = permIdx + 1;
  while (i < log.length) {
    const line = log[i];
    if (
      line?.startsWith("Auto Spoil:") ||
      line?.startsWith("Whirlwind Attack:") ||
      line?.startsWith("Знайдено:") ||
      line?.startsWith("Отримано:")
    ) {
      i++;
      continue;
    }
    if (DROP_LINE_RE.test(String(line ?? ""))) {
      lootIndices.add(i);
      i++;
      continue;
    }
    break;
  }
  if (lootIndices.size === 0) {
    return { lootLines: [], logWithoutLoot: [...log] };
  }
  const lootLines: string[] = [];
  const logWithoutLoot: string[] = [];
  log.forEach((line, idx) => {
    if (lootIndices.has(idx)) lootLines.push(line);
    else logWithoutLoot.push(line);
  });
  return { lootLines, logWithoutLoot };
}
