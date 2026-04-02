/**
 * Серверний union інвентаря при PUT: зберегти предмети з БД і з вхідного snapshot,
 * без залежності від клієнтського itemsDB (гебристика як у loadHeroFromAPI fallback).
 */

function isStackableItem(it: any): boolean {
  if (it?.meta?.hasLSPassive) return false;
  const typeId = String(it?.id ?? it?.itemId ?? "");
  const slot = String(it?.slot ?? "");
  const stackableSlots = ["consumable", "resource", "quest"];
  return (
    stackableSlots.includes(slot) ||
    typeId.includes("shot") ||
    typeId.includes("potion") ||
    it?.type === "consumable" ||
    it?.type === "resource" ||
    it?.type === "quest"
  );
}

function itemKey(i: any): string {
  return `${i?.id ?? i?.itemId ?? ""}_${i?.enchantLevel ?? 0}_${
    (i as any).meta?.hasLSPassive ? "ls" : ""
  }`;
}

function countByKey(arr: any[] | undefined | null): Map<string, number> {
  const m = new Map<string, number>();
  (arr || []).forEach((it: any) => {
    if (!it || (!it.id && !it.itemId)) return;
    const key = itemKey(it);
    const cnt = Math.max(1, Number(it.count) ?? 1);
    m.set(key, (m.get(key) ?? 0) + cnt);
  });
  return m;
}

function getBestItem(arr: any[] | undefined | null, key: string): any | undefined {
  return (arr || []).find((it: any) => it && itemKey(it) === key);
}

/**
 * Об'єднує два списки предметів — не губити рядки з жодного джерела (max count по ключу).
 */
export function mergeInventoriesUnionForPut(a: any[] | undefined | null, b: any[] | undefined | null): any[] {
  const localCounts = countByKey(a);
  const serverCounts = countByKey(b);
  const allKeys = new Set([...localCounts.keys(), ...serverCounts.keys()]);
  const result: any[] = [];
  allKeys.forEach((key) => {
    const total = Math.max(localCounts.get(key) ?? 0, serverCounts.get(key) ?? 0);
    const bestItem = getBestItem(a, key) ?? getBestItem(b, key);
    if (!bestItem || total <= 0) return;
    const normalized = { ...bestItem, id: bestItem.id ?? bestItem.itemId };
    if (isStackableItem(bestItem)) {
      result.push({ ...normalized, count: total });
    } else {
      for (let i = 0; i < total; i++) {
        result.push({ ...normalized, count: 1, enchantLevel: normalized.enchantLevel ?? 0 });
      }
    }
  });
  return result;
}
