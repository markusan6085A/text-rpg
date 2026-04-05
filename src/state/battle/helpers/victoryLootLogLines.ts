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

