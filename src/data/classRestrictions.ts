export const raceClassMap: Record<string, string[]> = {
  "Человек": ["Воин", "Маг"],
  "Эльф": ["Воин", "Маг"],
  "Тёмный эльф": ["Воин", "Маг"],
  "Орк": ["Воин", "Маг"],
  "Гном": ["Воин"], // гном маг — нельзя
};

export function getAvailableClasses(race: string): string[] {
  return raceClassMap[race] ?? [];
}
