import fishingEquipPools from "./data/fishingEquipPools.json";
import fishingDropItemMeta from "./data/fishingDropItemMeta.json";

type GradeKey = "D" | "C" | "B" | "A" | "S";
type EquipCategory = "weapon" | "armor" | "jewelry";

export interface FishingExtraDropRow {
  id: string;
  name: string;
  slot: string;
  icon?: string;
  count: number;
  kind?: string;
}

const META = fishingDropItemMeta as Record<string, { name: string; icon?: string; slot: string; kind?: string }>;
const POOLS = fishingEquipPools as Record<GradeKey, Record<EquipCategory, string[]>>;

/** Базові крафт-ресурси (лют з екрана): 3% за кожні 15 риб. */
const SIMPLE_RESOURCE_IDS: string[] = [
  "charcoal",
  "cokes",
  "cord",
  "leather",
  "suede",
  "thread",
  "varnish",
  "high_grade_suede",
];

/** Цінніші ресурси / матеріали: 1% за кожні 10 риб. */
const VALUABLE_RESOURCE_IDS: string[] = [
  "steel",
  "steel_mold",
  "silver_mold",
  "compound_braid",
  "mithril_alloy",
  "crafted_leather",
  "blacksmith_frame",
  "artisans_frame",
  "oriharukon",
  "metal_hardener",
  "metallic_fiber",
  "durable_metal_plate",
  "metallic_thread",
  "mold_glue",
  "mold_lubricant",
  "mold_hardener",
  "enria",
  "asofe",
  "maestro_mold",
  "craftsman_mold",
  "maestro_holder",
  "maestro_anvil_lock",
  "synthetic_cokes",
  "varnish_of_purity",
];

/** Шанс за кожні 10 риб для D/C/B: зброя / броня / біжутерія (окремий кидок на кожну пару грейд×категорія). */
const EQUIP_CHANCE_BY_GRADE_LOWER: Record<"D" | "C" | "B", number> = {
  D: 0.02,
  C: 0.019,
  B: 0.018,
};

/** A/S: тільки зброя та броня (без біжутерії). Один кидок 1% за кожні 10 риб; при успіху — випадково A чи S і зброя чи броня. */
const HIGH_GRADE_WEAPON_ARMOR_CHANCE = 0.01;

const STACKABLE_SLOTS = new Set(["consumable", "resource", "quest"]);

function pickRandomId(ids: string[]): string | null {
  const valid = ids.filter((id) => META[id]);
  if (!valid.length) return null;
  return valid[Math.floor(Math.random() * valid.length)]!;
}

function rowFromResourceId(id: string, count: number): FishingExtraDropRow | null {
  const m = META[id];
  if (!m) return null;
  return {
    id,
    name: m.name,
    slot: m.slot || "resource",
    icon: m.icon,
    count,
    kind: m.kind,
  };
}

function rowFromEquipId(id: string): FishingExtraDropRow | null {
  const m = META[id];
  if (!m) return null;
  return {
    id,
    name: m.name,
    slot: m.slot,
    icon: m.icon,
    count: 1,
    kind: m.kind,
  };
}

/**
 * Додатковий лут при зборі рибалки (сервер). Шанси — за «пакетами» риб: N риб → floor(N/k) незалежних кидків.
 */
export function rollFishingExtraDrops(fishCount: number): FishingExtraDropRow[] {
  const n = Math.max(0, Math.floor(fishCount));
  if (n <= 0) return [];

  const out: FishingExtraDropRow[] = [];

  const batches15 = Math.floor(n / 15);
  for (let i = 0; i < batches15; i++) {
    if (Math.random() >= 0.03) continue;
    const id = pickRandomId(SIMPLE_RESOURCE_IDS);
    if (!id) continue;
    const row = rowFromResourceId(id, 1);
    if (row) out.push(row);
  }

  const batches10 = Math.floor(n / 10);
  for (let i = 0; i < batches10; i++) {
    if (Math.random() < 0.01) {
      const id = pickRandomId(VALUABLE_RESOURCE_IDS);
      if (id) {
        const row = rowFromResourceId(id, 1);
        if (row) out.push(row);
      }
    }

    const lowerGrades: Array<"D" | "C" | "B"> = ["D", "C", "B"];
    const allCats: EquipCategory[] = ["weapon", "armor", "jewelry"];
    for (const g of lowerGrades) {
      const p = EQUIP_CHANCE_BY_GRADE_LOWER[g];
      for (const c of allCats) {
        if (Math.random() >= p) continue;
        const pool = POOLS[g]?.[c] ?? [];
        const id = pickRandomId(pool);
        if (!id) continue;
        const row = rowFromEquipId(id);
        if (row) out.push(row);
      }
    }

    if (Math.random() < HIGH_GRADE_WEAPON_ARMOR_CHANCE) {
      const g: "A" | "S" = Math.random() < 0.5 ? "A" : "S";
      const c: "weapon" | "armor" = Math.random() < 0.5 ? "weapon" : "armor";
      const pool = POOLS[g]?.[c] ?? [];
      const id = pickRandomId(pool);
      if (id) {
        const row = rowFromEquipId(id);
        if (row) out.push(row);
      }
    }
  }

  return out;
}

export function mergeFishingExtraIntoInventory(
  inv: any[],
  overflowChest: any[],
  drops: FishingExtraDropRow[]
): { inventory: any[]; overflowChest: any[] } {
  const maxNormal = 99;
  let invOut = [...inv];
  let chest = [...overflowChest];

  for (const toAdd of drops) {
    const count = Math.max(1, toAdd.count);
    const slot = toAdd.slot || "resource";
    const stackable = STACKABLE_SLOTS.has(slot);
    const itemObj: any = {
      id: toAdd.id,
      name: toAdd.name,
      slot,
      icon: toAdd.icon,
      count,
      type: toAdd.kind,
    };

    if (stackable) {
      const idx = invOut.findIndex((i: any) => (i?.id ?? i?.itemId) === toAdd.id);
      if (idx >= 0) {
        invOut[idx] = { ...invOut[idx], count: (Number(invOut[idx].count) ?? 1) + count };
      } else if (invOut.length < maxNormal) {
        invOut.push({ ...itemObj });
      } else {
        chest.push({ ...itemObj });
      }
    } else {
      for (let i = 0; i < count; i++) {
        if (invOut.length < maxNormal) {
          invOut.push({ ...itemObj, count: 1 });
        } else {
          chest.push({ ...itemObj, count: 1 });
        }
      }
    }
  }

  return { inventory: invOut, overflowChest: chest };
}
