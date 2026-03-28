/** Числа в лозі нагороди — як у L2-клієнті (ru-RU, з розділювачем тисяч). */
export function formatLootInt(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(Number(n) || 0));
}

/** Для картки перемоги — розділювач тисяч комою (як на референсі L2). */
export function formatLootIntEn(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(Number(n) || 0));
}

/**
 * Два рядки для бортового логу після вбивства моба (референс: «получил … EXP и … SP», «Выпало: …»).
 */
export function buildVictoryResourceLogLines(
  heroName: string,
  displayExp: number,
  displaySp: number,
  displayAdena: number
): [string, string] {
  const name = String(heroName ?? "").trim() || "Герой";
  const e = formatLootInt(displayExp);
  const s = formatLootInt(displaySp);
  const a = formatLootInt(displayAdena);
  return [
    `${name} получил ${e} EXP и ${s} SP`,
    `Выпало: ${a} аден, ${e} EXP и ${s} SP`,
  ];
}
