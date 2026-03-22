/**
 * Утиліти для іконок предметів.
 * Ресурси: /items/drops/resources/; fallback на resourcesss при 404.
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

/** Якщо шлях з resources і не завантажився — повертає той самий шлях з resourcesss */
function getResourceFallbackPath(path: string): string {
  if (path.includes("/drops/resources/")) {
    return path.replace("/drops/resources/", "/drops/resourcesss/");
  }
  return path;
}

/**
 * Обробник onError для іконок ресурсів:
 * 1) Artisan_Frame.jpg → Artisans_Frame.jpg (ім’я файлу в public)
 * 2) l2dop-by-itemid ↔ l2drop-by-itemid (одна спроба альтернативної папки)
 * 3) resources → resourcesss
 * 4) заглушка
 */
export function handleResourceIconError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.target as HTMLImageElement;
  const raw = (img.getAttribute("src") || "").split("?")[0];

  if (raw.includes("Artisan_Frame.jpg") && img.dataset.artisanFilenameAlt !== "1") {
    img.dataset.artisanFilenameAlt = "1";
    img.src = raw.replace("Artisan_Frame.jpg", "Artisans_Frame.jpg");
    return;
  }
  if (img.dataset.l2ItemIdFolderTried !== "1") {
    if (raw.includes("/l2dop-by-itemid/")) {
      img.dataset.l2ItemIdFolderTried = "1";
      img.src = raw.replace("/l2dop-by-itemid/", "/l2drop-by-itemid/");
      return;
    }
    if (raw.includes("/l2drop-by-itemid/")) {
      img.dataset.l2ItemIdFolderTried = "1";
      img.src = raw.replace("/l2drop-by-itemid/", "/l2dop-by-itemid/");
      return;
    }
  }

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
