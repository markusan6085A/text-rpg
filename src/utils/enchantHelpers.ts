// src/utils/enchantHelpers.ts
// Допоміжні функції для роботи з заточками

import { inferGradeFromItemId } from "./itemGrade";

export type ItemGrade = "NG" | "D" | "C" | "B" | "A" | "S" | null;

/**
 * Витягує грейд з ID заточки
 */
export function getGradeFromScrollId(scrollId: string): ItemGrade {
  const id = scrollId.toLowerCase();
  const giant = id.match(/^gm_giant_enchant_(weapon|armor)_(d|c|b|a|s)$/);
  if (giant) return giant[2].toUpperCase() as ItemGrade;
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
  const g = inferGradeFromItemId(itemId);
  return (g as ItemGrade) ?? null;
}

