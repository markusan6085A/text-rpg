// src/state/battle/actions/useSkill/shotHelpers.ts
import { useHeroStore } from "../../../heroStore";
import type { Hero } from "../../../../types/Hero";
import { getWeaponGrade as getWeaponGradeFromArrowHelpers } from "./arrowHelpers";

export interface ShotResult {
  used: boolean;
  multiplier: number; // Множник урону (1.0 = без зміни, >1.0 = збільшений)
  shotType: "soulshot" | "spiritshot" | null;
}

/**
 * Визначає грейд зброї з екіпіровки
 */
function getWeaponGrade(hero: Hero): "NG" | "D" | "C" | "B" | "A" | "S" | null {
  if (!hero?.equipment?.weapon) return null;
  
  const weaponId = hero.equipment.weapon;
  
  // Використовуємо функцію з arrowHelpers для кращого визначення грейду
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

/** Спочатку слоти з activeChargeSlots (увімкнені кліком), потім усі інші — як у L2 достатньо мати заряд на панелі */
function buildShotSlotScanOrder(
  loadoutSlots: (number | string | null)[],
  activeChargeSlots: number[] | readonly number[] | unknown[]
): number[] {
  const len = loadoutSlots.length;
  const seen = new Set<number>();
  const out: number[] = [];
  const add = (raw: unknown) => {
    const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
    if (!Number.isFinite(n) || n < 0 || n >= len) return;
    const i = Math.floor(n);
    if (seen.has(i)) return;
    seen.add(i);
    out.push(i);
  };
  for (const x of activeChargeSlots ?? []) add(x);
  for (let i = 0; i < len; i++) add(i);
  return out;
}

/**
 * Використовує soulshot/spiritshot тільки якщо гравець увімкнув заряд на панелі (клік по слоту).
 * Удар: 1 заряд. Ударний скіл: 2 заряди.
 * @param hero - герой
 * @param isPhysical - чи це фізична атака
 * @param isMagic - чи це магічна атака
 * @param loadoutSlots - слоти панелі
 * @param activeChargeSlots - індекси слотів, де заряд увімкнено
 * @param consumeCount - скільки зарядів витратити (1 = удар, 2 = ударний скіл)
 */
export function useAutoShot(
  hero: Hero,
  isPhysical: boolean,
  isMagic: boolean,
  loadoutSlots: (number | string | null)[] = [],
  activeChargeSlots: number[] = [],
  consumeCount: number = 1
): ShotResult {
  if (!hero?.inventory) {
    return { used: false, multiplier: 1.0, shotType: null };
  }

  const shotType = isMagic ? "spiritshot" : isPhysical ? "soulshot" : null;
  if (!shotType) {
    return { used: false, multiplier: 1.0, shotType: null };
  }

  const weaponGrade = getWeaponGrade(hero);
  // 🔥 Якщо грейд зброї не визначено — приймаємо будь-який shot (fallback для нестандартної зброї)

  const toConsume = Math.max(1, Math.min(10, consumeCount));

  const heroStore = useHeroStore.getState();
  // 🔥 Беремо свіжий hero зі store — інакше inventory може бути застарілим і споживання не зберігається
  const currentHero = heroStore.hero;
  const currentInventory = currentHero?.inventory ?? hero?.inventory;
  if (!currentInventory?.length) {
    return { used: false, multiplier: 1.0, shotType: null };
  }

  const slotOrder = buildShotSlotScanOrder(loadoutSlots, activeChargeSlots);

  // Шукаємо слот: спочатку увімкнені (activeChargeSlots), далі будь-який слот панелі з відповідним зарядом
  for (const slotIndex of slotOrder) {
    const slotId = loadoutSlots[slotIndex];
    if (typeof slotId !== "string" || !slotId.startsWith("consumable:")) continue;
    // 🔥 Нормалізуємо: магазин може додати shop_soulshot_d — шукаємо canonical id
    const rawItemId = slotId.replace("consumable:", "");
    const itemId = rawItemId.replace(/^shop_/, "") || rawItemId;
    if (!isShotConsumable(itemId, shotType)) continue;
    // Грейд shot має збігатися з грейдом зброї; якщо грейд заряду не розпарсився — не відсіюємо (було: null !== C і заряд ніколи не ївся)
    const shotGrade = getShotGrade(itemId);
    if (weaponGrade != null && shotGrade != null && shotGrade !== weaponGrade) continue;
    const invStack = inventoryHasShotStack(currentInventory, itemId, shotType, toConsume);
    if (!invStack?.item) continue;
    const invItem = invStack.item as any;

    // Витрачаємо заряди (1 за удар, 2 за ударний скіл)
    const actualItemId = invItem.id;
    const updatedInventory = currentInventory.map((inv: any) => {
      if (inv.id !== actualItemId) return inv;
      const newCount = (inv.count ?? 1) - toConsume;
      return newCount > 0 ? { ...inv, count: newCount } : null;
    }).filter(Boolean) as any[];
    heroStore.updateHero({ inventory: updatedInventory }, { persist: true });

    return {
      used: true,
      multiplier: 1.4,
      shotType,
    };
  }

  if (import.meta.env.DEV && shotType) {
    console.log("[useAutoShot] No shot consumed:", {
      shotType,
      weaponGrade,
      activeChargeSlots,
      slotOrderSample: slotOrder.slice(0, 12),
      loadoutAtSlots: activeChargeSlots.map((i) => loadoutSlots[typeof i === "string" ? parseInt(i, 10) : Number(i)]),
      invShotCount: currentInventory.filter((i: any) =>
        (i.id || "").toLowerCase().includes(shotType)
      ).map((i: any) => ({ id: i.id, count: i.count })),
    });
  }
  return { used: false, multiplier: 1.0, shotType: null };
}

/**
 * Перевіряє чи spiritshot увімкнений на панелі і є в інвентарі (для магів, хіл x2).
 */
export function hasSpiritshotActive(
  hero: Hero,
  loadoutSlots: (number | string | null)[] = [],
  activeChargeSlots: number[] = []
): boolean {
  if (!hero?.inventory) return false;
  for (const slotIndex of buildShotSlotScanOrder(loadoutSlots, activeChargeSlots)) {
    const slotId = loadoutSlots[slotIndex];
    if (typeof slotId !== "string" || !slotId.startsWith("consumable:")) continue;
    const itemId = (slotId.replace("consumable:", "") || "").replace(/^shop_/, "");
    if (!isShotConsumable(itemId, "spiritshot")) continue;
    if (inventoryHasShotStack(hero.inventory, itemId, "spiritshot", 1)) return true;
  }
  return false;
}

