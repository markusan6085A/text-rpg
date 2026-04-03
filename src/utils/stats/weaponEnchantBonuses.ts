/**
 * Плоскі бонуси заточки зброї (узгоджено з боєм у calcCombatStats та прев’ю в інвентарі).
 */
import { getWeaponTypeFromItemId, isTwoHandedWeapon } from "../../state/heroStore/weaponUtils";

const M_ATK_PER_ENCHANT_LEVEL = 4;
const P_ATK_AFTER_PLUS3_ONE_HAND = 6;
const P_ATK_AFTER_PLUS3_TWO_HAND = 7;
const P_ATK_AFTER_PLUS3_BOW = 10;

export type WeaponEnchantItemDef = {
  kind?: string;
  name?: string;
  stats?: { pAtk?: number; mAtk?: number };
} | null | undefined;

/** Посохи, spellbook, явний перевага mAtk у статах. */
export function isMagicWeaponForEnchant(itemId: string, itemDef: WeaponEnchantItemDef): boolean {
  if (!itemDef || itemDef.kind !== "weapon") return false;
  const id = (itemId || "").toLowerCase();
  if (getWeaponTypeFromItemId(itemId, itemDef) === "staff") return true;
  if (id.includes("spellbook")) return true;
  const p = Number(itemDef.stats?.pAtk ?? 0);
  const m = Number(itemDef.stats?.mAtk ?? 0);
  return m > p;
}

/** +4 M.Atk за кожен рівень заточки (включно з +1…+3). */
export function getMagicWeaponEnchantFlatMAtk(enchantLevel: number): number {
  const e = Math.max(0, Math.floor(Number(enchantLevel) || 0));
  return e * M_ATK_PER_ENCHANT_LEVEL;
}

/**
 * Плоский бонус P.Atk після +3: рівні 1–3 не дають бонусу заточки.
 * Луки: +10/рівень; дворучна фіз.: +7; одноручна: +6.
 */
export function getPhysicalWeaponEnchantFlatPAtk(
  itemId: string,
  itemDef: WeaponEnchantItemDef,
  enchantLevel: number
): number {
  if (!itemDef || itemDef.kind !== "weapon") return 0;
  if (isMagicWeaponForEnchant(itemId, itemDef)) return 0;
  const e = Math.max(0, Math.floor(Number(enchantLevel) || 0));
  const over = Math.max(0, e - 3);
  if (over === 0) return 0;
  const wt = getWeaponTypeFromItemId(itemId, itemDef);
  let per = P_ATK_AFTER_PLUS3_ONE_HAND;
  if (wt === "bow") per = P_ATK_AFTER_PLUS3_BOW;
  else if (isTwoHandedWeapon(itemId)) per = P_ATK_AFTER_PLUS3_TWO_HAND;
  return over * per;
}
