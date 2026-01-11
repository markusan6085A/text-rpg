/**
 * Маппінг рас до числових ID для папок екіпірування
 * Відповідає структурі: equipment/{view}/{raceId}-{gender}/
 */
export const RACE_TO_ID: Record<string, number> = {
  human: 0,
  elf: 10,
  darkelf: 18,
  orc: 25,
  dwarf: 31,
  kamael: 38,
  // Додаткові раси (якщо потрібно)
  // 44, 49, 53 - інші раси
};

/**
 * Конвертує назву раси в числовий ID для папки екіпірування
 */
export function getRaceId(race: string): number {
  // Нормалізуємо: "Human" -> "human", "Dark Elf" -> "darkelf"
  const normalized = race.toLowerCase().replace(/\s+/g, "");
  return RACE_TO_ID[normalized] ?? 0; // За замовчуванням Human (0)
}

/**
 * Конвертує стать в формат для папки екіпірування
 */
export function getGenderSuffix(gender: string): "male" | "female" {
  const normalized = gender.toLowerCase();
  return normalized === "female" ? "female" : "male";
}

