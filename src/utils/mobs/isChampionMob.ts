/** Чемпіон: префікс імені (l2dop — [Чемпіон]). РБ не вважаємо чемпіонами для цих правил. */
export function isChampionMob(mob: { name?: string; isRaidBoss?: boolean } | null | undefined): boolean {
  if (!mob || mob.isRaidBoss === true) return false;
  const n = mob.name ?? "";
  return (
    n.startsWith("[Champion]") ||
    n.startsWith("[Чемпион]") ||
    n.startsWith("[Чемпіон]")
  );
}
