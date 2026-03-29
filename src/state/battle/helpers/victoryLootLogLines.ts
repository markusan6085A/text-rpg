/** Числа в лозі нагороди — як у L2-клієнті (ru-RU, з розділювачем тисяч). */
export function formatLootInt(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(Number(n) || 0));
}

/** Для картки перемоги — розділювач тисяч комою (як на референсі L2). */
export function formatLootIntEn(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(Number(n) || 0));
}

/**
 * Рядок нагороди для бортового логу (лише «Выпало: …», без «получил …»).
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
  return [`Выпало: ${a} аден, ${e} EXP и ${s} SP`];
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
