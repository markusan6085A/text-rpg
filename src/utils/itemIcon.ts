/**
 * Утиліти для іконок предметів.
 * Fallback: якщо іконка в /items/drops/resources/ не завантажується — пробуємо /items/drops/resourcesss/
 */

/** Аліаси id -> filename для ресурсів без запису в itemsDB */
const RESOURCE_ID_TO_FILENAME: Record<string, string> = {
  synkopurs: "Synthetic_Cokes",
  synth_cokes: "Synthetic_Cokes",
  synthetic_cokes: "Synthetic_Cokes",
};

/** Конвертує id ресурсу в ім'я файлу (Title_Case) */
export function resourceIdToFilename(id: string): string {
  return RESOURCE_ID_TO_FILENAME[id] ?? id.split("_").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("_");
}

/** Замінює resources на resourcesss у шляху (fallback при 404) */
export function getResourceIconFallbackPath(path: string): string {
  if (path.includes("/drops/resources/")) {
    return path.replace("/drops/resources/", "/drops/resourcesss/");
  }
  return path;
}

/** Повертає шлях до іконки з коректним префіксом /items */
export function normalizeIconPath(icon: string | undefined): string {
  if (!icon) return "";
  return icon.startsWith("/") ? icon : `/items/${icon}`;
}

const FALLBACK_ICON = "/items/drops/Weapon_squires_sword_i00_0.jpg";

/** Обробник onError для img: пробує resourcesss якщо resources не завантажився; інакше — fallback */
export function handleResourceIconError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.target as HTMLImageElement;
  if (img.src.includes("/drops/resourcesss/") || img.src === FALLBACK_ICON) {
    img.src = FALLBACK_ICON;
    return;
  }
  const fallback = getResourceIconFallbackPath(img.src);
  if (fallback !== img.src) {
    img.src = fallback;
  } else {
    img.src = FALLBACK_ICON;
  }
}
