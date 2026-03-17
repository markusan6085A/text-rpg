/**
 * Утиліти для іконок предметів.
 * Єдина папка для іконок ресурсів: /items/drops/resourcesss/ (не resources).
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

/** Повертає шлях до іконки (префікс /items якщо потрібно). */
export function normalizeIconPath(icon: string | undefined): string {
  if (!icon) return "";
  return icon.startsWith("/") ? icon : `/items/${icon}`;
}

export const FALLBACK_ICON = "/items/drops/Weapon_squires_sword_i00_0.jpg";

/** Обробник onError для img: показує fallback при помилці завантаження */
export function handleResourceIconError(e: React.SyntheticEvent<HTMLImageElement>): void {
  (e.target as HTMLImageElement).src = FALLBACK_ICON;
}
