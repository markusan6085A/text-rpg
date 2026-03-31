import type { Quest } from "../../data/quests";
import { ZONE_LABELS } from "../../data/world/locale/worldLabels";
import { getGameSettings } from "../../state/gameSettings";

export type QuestDropRow = NonNullable<Quest["questDrops"]>[number];

function uiLang(): "ru" | "uk" {
  return getGameSettings().language === "uk" ? "uk" : "ru";
}

/**
 * Розбиває `floran_village_03 / floran_village_04` на один рядок без дубля «Floran» і без сирих id у тексті для гравця.
 */
function formatSlashSeparatedZoneIds(locationRaw: string): string | null {
  const ids = locationRaw
    .split(/\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) return null;
  const lang = uiLang();
  const subs: string[] = [];
  for (const id of ids) {
    if (!/^[a-z0-9_]+$/i.test(id)) return null;
    const row = ZONE_LABELS[id];
    if (!row) return null;
    const full = lang === "uk" ? row.uk : row.ru;
    const dash = full.indexOf("—");
    const sub = dash >= 0 ? full.slice(dash + 1).trim() : full;
    subs.push(sub);
  }
  const city =
    lang === "uk"
      ? "Один телепорт Floran Village (Флоран у списку міст)"
      : "Один телепорт Floran Village (в списке городов — Флоран)";
  if (subs.length === 1) {
    return lang === "uk"
      ? `${city}. Локація: «${subs[0]}». У списку мобів шукайте «квест · добыча».`
      : `${city}. Локация: «${subs[0]}». В списке мобов ищите «квест · добыча».`;
  }
  const pair =
    lang === "uk"
      ? `«${subs[0]}» або «${subs[1]}»`
      : `«${subs[0]}» или «${subs[1]}»`;
  return lang === "uk"
    ? `${city}. Потрібні зони: ${pair} (обидві біля Флорану). У списку мобів — «квест · добыча».`
    : `${city}. Нужны зоны: ${pair} (обе у Флорана). В списке мобов — «квест · добыча».`;
}

/** Короткий підпис «де фармити» для рядка questDrops (текст з даних або авто від префікса зони). */
export function questDropFarmZoneCaption(row: QuestDropRow, quest: Quest): string | null {
  const hint = row.farmHint?.trim();
  if (hint) return hint;
  const loc = row.location?.trim();
  if (loc) {
    const pretty = formatSlashSeparatedZoneIds(loc);
    if (pretty) return pretty;
    return loc.endsWith(".") ? loc : `${loc}.`;
  }
  const pref = row.dropZoneIdPrefix;
  if (pref === "floran_village") {
    const lang = uiLang();
    return lang === "uk"
      ? "Один телепорт Floran Village. Фарм у зонах «Дикий сад» (03) та «Старе кам'яне коло» (04), як у рівні. У списку мобів — «квест · добыча»."
      : "Один телепорт Floran Village. Фарм в зонах «Дикий сад» и «Старый каменный круг», по уровню. В списке мобов — «квест · добыча».";
  }
  if (pref === "gludin_village") {
    const lang = uiLang();
    return lang === "uk"
      ? "Телепорт Gludin Village — зони селища за вашим рівнем. У списку мобів — «квест · добыча»."
      : "Телепорт Gludin Village — зоны деревни по вашему уровню. В списке мобов — «квест · добыча».";
  }
  if (quest.location?.trim()) {
    const lang = uiLang();
    return lang === "uk" ? `Регіон: ${quest.location.trim()}.` : `Регион: ${quest.location.trim()}.`;
  }
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
