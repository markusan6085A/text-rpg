// src/state/battle/actions/useSkill/shotHelpers.ts
import { useHeroStore } from "../../../heroStore";
import type { Hero } from "../../../../types/Hero";
import { getWeaponGrade as getWeaponGradeFromArrowHelpers } from "./arrowHelpers";

/** Soulshot / spiritshot damage bonus vs uncharged (+60% → ×1.6). */
export const SHOT_DAMAGE_MULTIPLIER = 1.6;

export interface ShotResult {
  used: boolean;
  multiplier: number; // Множник урону (1.0 = без зміни, >1.0 = збільшений)
  shotType: "soulshot" | "spiritshot" | null;
}

/**
 * Визначає грейд зброї з екіпіровки
 */
function getWeaponGrade(hero: Hero): "NG" | "D" | "C" | "B" | "A" | "S" | null {
  const weaponId = hero?.equipment?.weapon ?? hero?.equipment?.lrhand ?? null;
  if (!weaponId) return null;

  return getWeaponGradeFromArrowHelpers(weaponId);
}

/**
 * Знаходить відповідний shot в інвентарі за типом та грейдом
 */
function findShotInInventory(
  hero: Hero,
  shotType: "soulshot" | "spiritshot",
  weaponGrade: "NG" | "D" | "C" | "B" | "A" | "S" | null
): any | null {
  if (!hero?.inventory) return null;
  
  // Якщо грейд не визначено, спробуємо всі грейди по порядку (NG -> D -> C -> B -> A -> S)
  const gradesToTry = weaponGrade 
    ? [weaponGrade] 
    : ["NG", "D", "C", "B", "A", "S"];
  
  for (const grade of gradesToTry) {
    // Підтримуємо обидва формати: ng_soulshot та soulshot_ng для всіх грейдів
    let shotIds: string[] = [];
    
    // Формат: grade_shotType (ng_soulshot, d_soulshot, тощо)
    shotIds.push(`${grade.toLowerCase()}_${shotType}`);
    
    // Формат: shotType_grade (soulshot_ng, soulshot_d, тощо) - новий формат
    shotIds.push(`${shotType}_${grade.toLowerCase()}`);
    
    // Для NG-грейду також перевіряємо старі варіанти
    if (grade === "NG") {
      shotIds.push(`${shotType}_ng_silver`); // soulshot_ng_silver (тільки для soulshot)
      if (shotType === "soulshot") {
        shotIds.push("soulshot_ng_silver");
      }
    }
    
    // Шукаємо перший доступний shot зі списку
    for (const shotId of shotIds) {
      const shotItem = hero.inventory.find((item: any) => 
        item.id === shotId && (item.count ?? 0) > 0
      );
      
      if (shotItem) {
        return { item: shotItem, itemId: shotId };
      }
    }
  }
  
  return null;
}

/** Чи itemId є soulshot або spiritshot */
export function isShotConsumable(itemId: string, shotType: "soulshot" | "spiritshot"): boolean {
  const id = itemId.toLowerCase().replace(/^shop_/, "");
  if (id.startsWith(shotType)) return true;
  const parts = id.split("_").filter(Boolean);
  return parts.includes(shotType);
}

/** Грейд заряду з itemId: soulshot_ng, spiritshot_c, c_spiritshot, d_soulshot тощо */
function getShotGrade(itemId: string): "NG" | "D" | "C" | "B" | "A" | "S" | null {
  const id = itemId.toLowerCase().replace(/^shop_/, "");
  if (id.endsWith("_ng_silver")) return "NG";
  if (id.endsWith("_ng")) return "NG";
  const parts = id.split("_").filter(Boolean);
  const gradeMap: Record<string, "NG" | "D" | "C" | "B" | "A" | "S"> = {
    ng: "NG",
    d: "D",
    c: "C",
    b: "B",
    a: "A",
    s: "S",
  };
  const last = parts[parts.length - 1] ?? "";
  if (gradeMap[last]) return gradeMap[last];
  // spiritshot_c / soulshot_d — грейд після типу
  if (last === "spiritshot" || last === "soulshot") {
    const prev = parts[parts.length - 2];
    if (prev && gradeMap[prev]) return gradeMap[prev];
  }
  // c_spiritshot / d_soulshot — грейд префіксом
  if (parts.length >= 2 && (parts[1] === "spiritshot" || parts[1] === "soulshot")) {
    const first = parts[0];
    if (first && gradeMap[first]) return gradeMap[first];
  }
  return null;
}

/** Канонічний id як у itemsDB (spiritshot_c, soulshot_ng) для пошуку стаку в інвентарі */
function canonicalShotIdForInventory(panelItemId: string, expectedShotType: "soulshot" | "spiritshot"): string | null {
  const id = panelItemId.toLowerCase().replace(/^shop_/, "");
  if (!isShotConsumable(id, expectedShotType)) return null;
  const g = getShotGrade(id);
  if (!g) return null;
  const gk = g === "NG" ? "ng" : g.toLowerCase();
  return expectedShotType === "spiritshot" ? `spiritshot_${gk}` : `soulshot_${gk}`;
}

function inventoryHasShotStack(
  inventory: { id?: string; count?: number }[],
  panelItemId: string,
  expectedShotType: "soulshot" | "spiritshot",
  minCount: number
): { item: { id?: string; count?: number } } | null {
  const id = panelItemId.toLowerCase().replace(/^shop_/, "");
  const canonical = canonicalShotIdForInventory(id, expectedShotType);
  const found = inventory.find((i: any) => {
    if ((i.count ?? 0) < minCount) return false;
    const iid = (i.id || "").replace(/^shop_/, "");
    if (canonical && (iid === canonical || i.id === canonical || i.id === `shop_${canonical}`)) return true;
    return iid === id || i.id === panelItemId || i.id === id;
  });
  return found ? { item: found } : null;
}

/**
 * Лише індекси слотів, увімкнених кліком (activeChargeSlots).
 * Без увімкнення заряд на панелі не споживається і бонус до урону не дається.
 */
function buildShotSlotScanOrder(
  loadoutSlots: (number | string | null)[],
  activeChargeSlots: number[] | readonly number[] | unknown[]
): number[] {
  const len = loadoutSlots.length;
  const seen = new Set<number>();
  const out: number[] = [];
  for (const x of activeChargeSlots ?? []) {
    const n = typeof x === "string" ? parseInt(x, 10) : Number(x);
    if (!Number.isFinite(n) || n < 0 || n >= len) continue;
    const i = Math.floor(n);
    if (seen.has(i)) continue;
    seen.add(i);
    out.push(i);
  }
  return out;
}

function applyShotConsumptionToInventory(inventory: any[], actualItemId: string, toConsume: number): any[] {
  return inventory
    .map((inv: any) => {
      if (inv.id !== actualItemId) return inv;
      const newCount = (inv.count ?? 1) - toConsume;
      return newCount > 0 ? { ...inv, count: newCount } : null;
    })
    .filter(Boolean) as any[];
}

/**
 * Soulshot/spiritshot: тільки зі слотів панелі, увімкнених через toggleChargeSlot (activeChargeSlots).
 * Удар: 1 заряд. Ударний скіл: 2 заряди.
 */
export function useAutoShot(
  hero: Hero,
  isPhysical: boolean,
  isMagic: boolean,
  loadoutSlots: (number | string | null)[] = [],
  activeChargeSlots: number[] = [],
  consumeCount: number = 1
): ShotResult {
  const shotType = isMagic ? "spiritshot" : isPhysical ? "soulshot" : null;
  if (!shotType) {
    return { used: false, multiplier: 1.0, shotType: null };
  }

  const toConsume = Math.max(1, Math.min(10, consumeCount));
  const slotOrder = buildShotSlotScanOrder(loadoutSlots, activeChargeSlots);
  const out: ShotResult = { used: false, multiplier: 1.0, shotType: null };

  useHeroStore.getState().updateHero((prev) => {
    if (!prev?.inventory?.length) return {};
    const weaponGrade = getWeaponGrade(prev);
    const inv = prev.inventory;

    for (const slotIndex of slotOrder) {
      const slotId = loadoutSlots[slotIndex];
      if (typeof slotId !== "string" || !slotId.startsWith("consumable:")) continue;
      const rawItemId = slotId.replace("consumable:", "");
      const itemId = rawItemId.replace(/^shop_/, "") || rawItemId;
      if (!isShotConsumable(itemId, shotType)) continue;
      const shotGrade = getShotGrade(itemId);
      if (weaponGrade != null && shotGrade != null && shotGrade !== weaponGrade) continue;
      const invStack = inventoryHasShotStack(inv, itemId, shotType, toConsume);
      if (!invStack?.item?.id) continue;
      const updated = applyShotConsumptionToInventory(inv, invStack.item.id, toConsume);
      out.used = true;
      out.multiplier = SHOT_DAMAGE_MULTIPLIER;
      out.shotType = shotType;
      return { inventory: updated };
    }

    return {};
  }, { persist: true });

  if (import.meta.env.DEV && shotType && !out.used) {
    const prev = useHeroStore.getState().hero;
    const inv = prev?.inventory ?? hero?.inventory ?? [];
    console.log("[useAutoShot] No shot consumed:", {
      shotType,
      weaponGrade: prev ? getWeaponGrade(prev) : getWeaponGrade(hero),
      activeChargeSlots,
      slotOrderSample: slotOrder.slice(0, 12),
      loadoutShotSlots: slotOrder
        .map((i) => loadoutSlots[i])
        .filter((v) => typeof v === "string" && v.startsWith("consumable:")),
      invShotCount: inv
        .filter((i: any) => (i.id || "").toLowerCase().includes(shotType))
        .map((i: any) => ({ id: i.id, count: i.count })),
    });
  }

  return out;
}

/**
 * Spiritshot увімкнений кліком по слоту заряду (activeChargeSlots) і є стак у інвентарі (хіл x2 тощо).
 */
export function hasSpiritshotActive(
  hero: Hero,
  loadoutSlots: (number | string | null)[] = [],
  activeChargeSlots: number[] = []
): boolean {
  const h = useHeroStore.getState().hero ?? hero;
  const inv = h?.inventory;
  if (!inv?.length) return false;
  for (const slotIndex of buildShotSlotScanOrder(loadoutSlots, activeChargeSlots)) {
    const slotId = loadoutSlots[slotIndex];
    if (typeof slotId !== "string" || !slotId.startsWith("consumable:")) continue;
    const itemId = (slotId.replace("consumable:", "") || "").replace(/^shop_/, "");
    if (!isShotConsumable(itemId, "spiritshot")) continue;
    if (inventoryHasShotStack(inv, itemId, "spiritshot", 1)) return true;
  }
  return false;
}

