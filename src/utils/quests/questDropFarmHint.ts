import type { Quest } from "../../data/quests";

export type QuestDropRow = NonNullable<Quest["questDrops"]>[number];

/** Короткий підпис «де фармити» для рядка questDrops (текст з даних або авто від префікса зони). */
export function questDropFarmZoneCaption(row: QuestDropRow, quest: Quest): string | null {
  const hint = row.farmHint?.trim();
  if (hint) return hint;
  if (row.location?.trim()) return `Зони (id): ${row.location.trim()}.`;
  const pref = row.dropZoneIdPrefix;
  if (pref === "floran_village") {
    return "Телепорт Floran Village → зони 03 «Дикий сад» та 04 «Старый каменный круг» (і суміжні за рівнем). У списку мобів шукайте підпис «квест · добыча».";
  }
  if (pref === "gludin_village") {
    return "Телепорт Gludin Village → будь-яка зона gludin_village у вашому рівні (15–22). У списку мобів — «квест · добыча».";
  }
  if (quest.location?.trim()) return `Регіон квесту: ${quest.location.trim()}.`;
  return null;
}

/** Унікальні підказки для всіх рядків одного itemId у квесті. */
export function collectFarmCaptionsForItemId(
  quest: Quest,
  itemId: string
): string[] {
  const rows = quest.questDrops?.filter((r) => r.itemId === itemId) ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const c = questDropFarmZoneCaption(r, quest);
    if (c && !seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}
