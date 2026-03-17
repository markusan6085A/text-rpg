/**
 * Утиліти для іконок предметів.
 * Ресурси: /items/drops/resources/; fallback на resourcesss при 404.
 */

/** Аліаси id -> filename для ресурсів без запису в itemsDB. Synthetic_Cokes видалено — fallback на Etc_bead */
const RESOURCE_ID_TO_FILENAME: Record<string, string> = {
  synkopurs: "Etc_bead_green_i00_0",
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

/** Якщо шлях з resources і не завантажився — повертає той самий шлях з resourcesss */
function getResourceFallbackPath(path: string): string {
  if (path.includes("/drops/resources/")) {
    return path.replace("/drops/resources/", "/drops/resourcesss/");
  }
  return path;
}

/** Обробник onError: спочатку пробує resourcesss (якщо шлях з resources), інакше fallback-іконка */
export function handleResourceIconError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.target as HTMLImageElement;
  if (img.src.includes("/drops/resourcesss/") || img.src.includes(FALLBACK_ICON)) {
    img.src = FALLBACK_ICON;
    return;
  }
  const fallback = getResourceFallbackPath(img.src);
  if (fallback !== img.src) {
    img.src = fallback;
  } else {
    img.src = FALLBACK_ICON;
  }
}
