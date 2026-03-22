/**
 * Утиліти для іконок предметів.
 * Ресурси: /items/drops/resources/ (у т.ч. l2dop-by-itemid для L2 id).
 */

/** Аліаси id -> filename для ресурсів без запису в itemsDB. Synthetic_Cokes видалено — fallback на Etc_bead */
const RESOURCE_ID_TO_FILENAME: Record<string, string> = {
  synkopurs: "Etc_bead_green_i00_0",
  syncopure: "Etc_bead_green_i00_0",
  synth_cokes: "Etc_bead_green_i00_0",
  synthetic_cokes: "Etc_bead_green_i00_0",
};

/** Конвертує id ресурсу в ім'я файлу (Title_Case) */
export function resourceIdToFilename(id: string): string {
  return RESOURCE_ID_TO_FILENAME[id] ?? id.split("_").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("_");
}

/** Повертає шлях до іконки (префікс /items якщо потрібно). */
export function normalizeIconPath(icon: string | undefined): string {
  if (!icon) return "";
  return icon.startsWith("/") ? icon : `/items/${icon}`;
}

export const FALLBACK_ICON = "/items/drops/Weapon_squires_sword_i00_0.jpg";

/**
 * Після невдалого завантаження — одна спроба fallback.
 * Без захисту: якщо і fallback 404 (або приходить HTML), onError викликається знову → безкінечні запити в мережі.
 */
export function handleResourceIconError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const el = e.currentTarget as HTMLImageElement;
  if (el.dataset.resourceIconFallback === "1") {
    el.onerror = null;
    return;
  }
  el.dataset.resourceIconFallback = "1";
  el.src = FALLBACK_ICON;
}
