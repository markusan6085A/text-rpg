export const RACES = ["Людина", "Ельф", "Орк"] as const;
export const CLASSES = ["Воїн", "Розбійник", "Маг"] as const;

export type Race = typeof RACES[number];
export type Klass = typeof CLASSES[number];

export function makeAttrs(race: Race, klass: Klass) {
  const base: Record<Klass, any> = {
    "Воїн": { STR: 18, DEX: 12, CON: 16, INT: 8, WIT: 8, MEN: 10 },
    "Розбійник": { STR: 14, DEX: 18, CON: 12, INT: 8, WIT: 10, MEN: 10 },
    "Маг": { STR: 8, DEX: 10, CON: 10, INT: 18, WIT: 14, MEN: 14 },
  };
  const raceDelta: Record<Race, any> = {
    "Людина": { STR: 1, CON: 1 },
    "Ельф": { DEX: 2, INT: 1, WIT: 1 },
    "Орк": { STR: 3, CON: 2, DEX: -1 },
  };
  const b = base[klass], d = raceDelta[race];
  return {
    STR: b.STR + (d.STR || 0), DEX: b.DEX + (d.DEX || 0), CON: b.CON + (d.CON || 0),
    INT: b.INT + (d.INT || 0), WIT: b.WIT + (d.WIT || 0), MEN: b.MEN + (d.MEN || 0),
  };
}
