// src/utils/enchantHelpers.ts
// Допоміжні функції для роботи з заточками

export type ItemGrade = "NG" | "D" | "C" | "B" | "A" | "S" | null;

/**
 * Витягує грейд з ID заточки
 */
export function getGradeFromScrollId(scrollId: string): ItemGrade {
  const id = scrollId.toLowerCase();
  if (id.includes("_s_") || id.startsWith("s_")) return "S";
  if (id.includes("_a_") || id.startsWith("a_")) return "A";
  if (id.includes("_b_") || id.startsWith("b_")) return "B";
  if (id.includes("_c_") || id.startsWith("c_")) return "C";
  if (id.includes("_d_") || id.startsWith("d_")) return "D";
  if (id.includes("_ng_") || id.startsWith("ng_")) return "NG";
  return null;
}

/**
 * Витягує грейд з ID предмета
 */
export function getGradeFromItemId(itemId: string): ItemGrade {
  const id = itemId.toLowerCase();
  if (id.startsWith("s_") || id.includes("_s_")) return "S";
  if (id.startsWith("a_") || id.includes("_a_")) return "A";
  if (id.startsWith("b_") || id.includes("_b_")) return "B";
  if (id.startsWith("c_") || id.includes("_c_")) return "C";
  if (id.startsWith("d_") || id.includes("_d_")) return "D";
  if (id.startsWith("ng_") || id.includes("_ng_")) return "NG";
  return null;
}

