/**
 * Soulshot / spiritshot / стріли на сервері (узгоджено з client shotHelpers / arrowHelpers).
 */

export const SHOT_DAMAGE_MULTIPLIER = 1.6;
export const BLESSED_SHOT_DAMAGE_MULTIPLIER = 2.0;

type Grade = "NG" | "D" | "C" | "B" | "A" | "S";

const ARROW_BY_GRADE: Record<Grade, string> = {
  NG: "wooden_arrow",
  D: "bone_arrow",
  C: "fine_steel_arrow",
  B: "silver_arrow",
  A: "mithril_arrow",
  S: "shining_arrow",
};

function normId(id: string): string {
  return String(id || "")
    .toLowerCase()
    .replace(/^shop_/, "");
}

export function getWeaponTypeFromEquipment(equipment: any): "bow" | "other" {
  const w = normId(equipment?.weapon ?? equipment?.lrhand ?? "");
  if (!w) return "other";
  if (w.includes("bow") || w.includes("лук")) return "bow";
  return "other";
}

export function weaponGradeFromId(itemId: string | null | undefined): Grade | null {
  if (!itemId) return null;
  const id = normId(itemId);
  // S-grade у itemsDB: quest_weapon_s_*, shop_weapon_s_* (не закінчується на _s — інакше null і «грейд лука»)
  if (id.includes("weapon_s_")) return "S";
  if (id.endsWith("_ng")) return "NG";
  if (id.endsWith("_d") && !id.endsWith("_rod")) return "D";
  if (id.endsWith("_c")) return "C";
  if (id.endsWith("_b")) return "B";
  if (id.endsWith("_a")) return "A";
  if (id.endsWith("_s") && !id.includes("spirit")) return "S";
  return null;
}

export function canAttackWithBowServer(heroJson: any): { ok: boolean; message?: string; grade?: Grade | null } {
  const eq = heroJson?.equipment;
  if (getWeaponTypeFromEquipment(eq) !== "bow") return { ok: true, grade: null };
  const bowItemId = eq?.weapon ?? eq?.lrhand;
  const g = weaponGradeFromId(bowItemId);
  if (!g) return { ok: false, message: "Не удалось определить грейд лука." };
  const arrowId = ARROW_BY_GRADE[g];
  const inv = Array.isArray(heroJson?.inventory) ? heroJson.inventory : [];
  const stack = inv.find((i: any) => normId(i?.id) === normId(arrowId) && Number(i?.count) > 0);
  if (!stack) {
    return { ok: false, message: "У вас нет стрел для лука!", grade: g };
  }
  return { ok: true, grade: g };
}

export function consumeOneArrow(inventory: any[], grade: Grade): { ok: boolean; inventory: any[] } {
  const arrowId = ARROW_BY_GRADE[grade];
  const inv = Array.isArray(inventory) ? [...inventory] : [];
  const idx = inv.findIndex((i: any) => normId(i?.id) === normId(arrowId) && Number(i?.count) > 0);
  if (idx < 0) return { ok: false, inventory: inv };
  const it = inv[idx];
  const c = Math.max(0, Number(it.count) || 0);
  if (c <= 0) return { ok: false, inventory: inv };
  const next = c - 1;
  if (next <= 0) inv.splice(idx, 1);
  else inv[idx] = { ...it, count: next };
  return { ok: true, inventory: inv };
}

function isShotConsumable(itemId: string, shotType: "soulshot" | "spiritshot"): boolean {
  const id = normId(itemId);
  if (id.startsWith(shotType)) return true;
  const parts = id.split("_").filter(Boolean);
  return parts.includes(shotType);
}

function isUniversalBlessedCharge(itemId: string): boolean {
  const id = normId(itemId);
  return id.startsWith("gm_blessed_charge_");
}

function shotGradeFromItemId(itemId: string): Grade | null {
  const id = normId(itemId);
  if (id.endsWith("_ng_silver")) return "NG";
  if (id.endsWith("_ng")) return "NG";
  const parts = id.split("_").filter(Boolean);
  const gradeMap: Record<string, Grade> = {
    ng: "NG",
    d: "D",
    c: "C",
    b: "B",
    a: "A",
    s: "S",
  };
  const last = parts[parts.length - 1] ?? "";
  if (gradeMap[last]) return gradeMap[last];
  if (last === "spiritshot" || last === "soulshot") {
    const prev = parts[parts.length - 2];
    if (prev && gradeMap[prev]) return gradeMap[prev];
  }
  if (parts.length >= 2 && (parts[1] === "spiritshot" || parts[1] === "soulshot")) {
    const first = parts[0];
    if (first && gradeMap[first]) return gradeMap[first];
  }
  return null;
}

function canonicalShotId(panelItemId: string, expectedShotType: "soulshot" | "spiritshot"): string | null {
  const id = normId(panelItemId);
  if (!isShotConsumable(id, expectedShotType)) return null;
  const g = shotGradeFromItemId(panelItemId);
  if (!g) return null;
  const gk = g === "NG" ? "ng" : g.toLowerCase();
  return expectedShotType === "spiritshot" ? `spiritshot_${gk}` : `soulshot_${gk}`;
}

function inventoryHasShotStack(
  inventory: any[],
  panelItemId: string,
  expectedShotType: "soulshot" | "spiritshot",
  minCount: number
): { id: string } | null {
  const canonical = canonicalShotId(panelItemId, expectedShotType);
  const want = normId(panelItemId);
  for (const i of inventory || []) {
    if (Number(i?.count) < minCount) continue;
    const iid = normId(i?.id);
    if (canonical && (iid === normId(canonical) || iid === canonical)) return { id: i.id };
    if (iid === want) return { id: i.id };
  }
  return null;
}

function inventoryHasExactStack(inventory: any[], panelItemId: string, minCount: number): { id: string } | null {
  const want = normId(panelItemId);
  for (const i of inventory || []) {
    if (Number(i?.count) < minCount) continue;
    if (normId(i?.id) === want) return { id: i.id };
  }
  return null;
}

function applyShotConsumptionToInventory(inventory: any[], actualItemId: string, toConsume: number): any[] {
  return (inventory || [])
    .map((inv: any) => {
      if (inv.id !== actualItemId) return inv;
      const newCount = (inv.count ?? 1) - toConsume;
      return newCount > 0 ? { ...inv, count: newCount } : null;
    })
    .filter(Boolean) as any[];
}

function buildShotSlotOrder(loadoutSlots: any[], activeChargeSlots: any[]): number[] {
  const len = Array.isArray(loadoutSlots) ? loadoutSlots.length : 0;
  const seen = new Set<number>();
  const out: number[] = [];
  for (const x of activeChargeSlots || []) {
    const n = typeof x === "string" ? parseInt(x, 10) : Number(x);
    if (!Number.isFinite(n) || n < 0 || n >= len) continue;
    const i = Math.floor(n);
    if (seen.has(i)) continue;
    seen.add(i);
    out.push(i);
  }
  return out;
}

export type ShotConsumeResult = { inventory: any[]; used: boolean; multiplier: number; shotType: string | null };

export function tryConsumeShotFromInventory(args: {
  inventory: any[];
  loadoutSlots: any[];
  activeChargeSlots: any[];
  isPhysical: boolean;
  isMagic: boolean;
  weaponItemId: string | undefined;
  consumeCount: number;
}): ShotConsumeResult {
  const inv = Array.isArray(args.inventory) ? [...args.inventory] : [];
  const shotType = args.isMagic ? "spiritshot" : args.isPhysical ? "soulshot" : null;
  const out: ShotConsumeResult = { inventory: inv, used: false, multiplier: 1.0, shotType: null };
  if (!shotType) return out;

  const toConsume = Math.max(1, Math.min(10, Math.floor(args.consumeCount) || 1));
  const weaponGrade = weaponGradeFromId(args.weaponItemId);
  const order = buildShotSlotOrder(args.loadoutSlots, args.activeChargeSlots);

  for (const slotIndex of order) {
    const slotId = args.loadoutSlots[slotIndex];
    if (typeof slotId !== "string" || !slotId.startsWith("consumable:")) continue;
    const rawItemId = slotId.replace("consumable:", "");
    const itemId = rawItemId.replace(/^shop_/, "") || rawItemId;
    const blessed = isUniversalBlessedCharge(itemId);
    if (!blessed && !isShotConsumable(itemId, shotType)) continue;
    const shotGrade = shotGradeFromItemId(itemId);
    if (weaponGrade != null && shotGrade != null && shotGrade !== weaponGrade) continue;
    const stack = blessed
      ? inventoryHasExactStack(inv, itemId, toConsume)
      : inventoryHasShotStack(inv, itemId, shotType, toConsume);
    if (!stack?.id) continue;
    out.inventory = applyShotConsumptionToInventory(inv, stack.id, toConsume);
    out.used = true;
    out.multiplier = blessed ? BLESSED_SHOT_DAMAGE_MULTIPLIER : SHOT_DAMAGE_MULTIPLIER;
    out.shotType = blessed ? "blessed_charge" : shotType;
    return out;
  }
  return out;
}
