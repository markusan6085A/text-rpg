/**
 * Грейд з суфікса id (напр. quest_cloak_s → S).
 * Не використовувати id.includes("_c_") — у imperial_crusader є підрядок "_c_" і показувало б хибне C.
 */
export function inferGradeFromItemId(idRaw: string | undefined | null): string | undefined {
  if (idRaw == null || typeof idRaw !== "string") return undefined;
  const id = idRaw.toLowerCase().trim();
  const m = id.match(/_(ng|[cbdas])$/i);
  if (m) {
    const g = m[1].toLowerCase();
    return g === "ng" ? "NG" : g.toUpperCase();
  }
  if (id.includes("_ng_")) return "NG";
  if (id.startsWith("ng_")) return "NG";
  if (id.startsWith("d_")) return "D";
  if (id.startsWith("c_")) return "C";
  if (id.startsWith("b_")) return "B";
  if (id.startsWith("a_")) return "A";
  if (id.startsWith("s_")) return "S";
  return undefined;
}

export function resolveDisplayGrade(item: any, itemDef: any): string | undefined {
  if (itemDef?.grade) return itemDef.grade;
  if (item?.grade) return item.grade;
  const id = String(item?.id ?? item?.itemId ?? "");
  return inferGradeFromItemId(id);
}
