// Інформація про улов: заточка удочки → діапазон риб
export const FISH_BY_ROD_ENCHANT: Array<{ enchant: number; min: number; max: number }> = [
  { enchant: 0, min: 100, max: 300 },
  { enchant: 100, min: 110, max: 300 },
  { enchant: 200, min: 120, max: 300 },
  { enchant: 300, min: 130, max: 310 },
  { enchant: 400, min: 130, max: 320 },
  { enchant: 500, min: 130, max: 330 },
  { enchant: 600, min: 140, max: 350 },
  { enchant: 700, min: 140, max: 360 },
  { enchant: 800, min: 150, max: 370 },
  { enchant: 900, min: 150, max: 380 },
  { enchant: 1000, min: 160, max: 400 },
];

export function getFishRangeByRodEnchant(enchant: number): { min: number; max: number } {
  const idx = Math.min(10, Math.floor(Math.max(0, enchant) / 100));
  return { min: FISH_BY_ROD_ENCHANT[idx].min, max: FISH_BY_ROD_ENCHANT[idx].max };
}
