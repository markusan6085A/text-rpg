/**
 * Server-side quest drop helpers — mirrors src/utils/quests/questDropMobMatch.ts
 * and src/utils/quests/questDropEffectiveNeed.ts (no client dependencies).
 */

const CHAMP_PREFIXES = ["[Champion] ", "[Чемпион] ", "[Чемпіон] "] as const;

function stripChampionPrefix(name: string): string {
  let s = String(name ?? "").trim();
  for (const p of CHAMP_PREFIXES) {
    if (s.startsWith(p)) { s = s.slice(p.length).trimStart(); break; }
  }
  return s.replace(/\s+/g, " ").trim();
}

function normalizeToken(name: string): string {
  return stripChampionPrefix(name)
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function serverMobMatchesQuestDropName(mobName: string, questDropMobName: string): boolean {
  const left = normalizeToken(mobName);
  const right = normalizeToken(questDropMobName);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.localeCompare(right, "en", { sensitivity: "base" }) === 0;
}

export function serverGetEffectiveQuestDropNeed(
  requiredCount: number,
  itemId: string,
  activeEntry: { rolledQuestDropNeeds?: Record<string, number> } | undefined
): number {
  const rolled = activeEntry?.rolledQuestDropNeeds?.[itemId];
  if (typeof rolled === "number" && rolled > 0) return rolled;
  return requiredCount;
}
