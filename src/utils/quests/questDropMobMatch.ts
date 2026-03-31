/**
 * Зіставлення імені моба з questDrops.mobName: trim, префікси чемпіона, без урахування регістру ASCII.
 * Канонічні імена в даних залишаються англійськими; порівняння стійке до зайвих пробілів.
 */
const CHAMP_PREFIXES = ["[Champion] ", "[Чемпион] ", "[Чемпіон] "] as const;

function stripChampionPrefix(mobName: string): string {
  let s = String(mobName ?? "").trim();
  for (const p of CHAMP_PREFIXES) {
    if (s.startsWith(p)) {
      s = s.slice(p.length).trimStart();
      break;
    }
  }
  return s.replace(/\s+/g, " ").trim();
}

export function normalizeQuestMobNameToken(name: string): string {
  return stripChampionPrefix(name)
    .replace(/\u2010|\u2011|\u2012|\u2013|\u2014|\u2212/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** true, якщо моб відповідає квестовому рядку дропу за ім'ям */
export function mobMatchesQuestDropName(mobName: string, questDropMobName: string): boolean {
  const left = normalizeQuestMobNameToken(mobName);
  const right = normalizeQuestMobNameToken(questDropMobName);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.localeCompare(right, "en", { sensitivity: "base" }) === 0;
}
