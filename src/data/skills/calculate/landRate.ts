export function computeLandRate(baseChance: number, resist: number): number {
  const chance = baseChance - resist;
  return Math.max(5, Math.min(95, chance));
}

