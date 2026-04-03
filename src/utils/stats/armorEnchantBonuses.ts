/**
 * Заточка броні / щита / біжутерії: плоскі бонуси (узгоджено з calcCombatStats та прев’ю).
 * — Звичайна броня (не з квест-шопу): +2 P.Def / рівень; HP від рівня після +3 (без щита).
 * — Цілісна (предмети сетів з квест-шопу): +2 P.Def / рівень; HP після +4.
 * — Щит: +2 P.Def / рівень; HP від заточки не дає.
 * — Біжутерія: +1 M.Def / рівень; епіка: +3 M.Def / рівень.
 */
import { QUEST_SHOP_SETS } from "../../data/shop/questShop";

const PDEF_FLAT_PER_ENCHANT = 2;
/** HP за кожен рівень заточки понад поріг (тільки шолом/нагрудник/штани/рукавиці/чоботи; щит виключено). */
const MAX_HP_PER_ENCHANT_OVER_THRESHOLD = 22;

export const QUEST_SHOP_ARMOR_ITEM_IDS: ReadonlySet<string> = new Set(
  QUEST_SHOP_SETS.filter((row) => row.type === "armor").map((row) => row.id)
);

export const EPIC_JEWELRY_ITEM_IDS: ReadonlySet<string> = new Set([
  "ring_of_queen_ant",
  "ring_of_core",
  "ring_of_baium",
  "earring_of_orfen",
  "earring_of_zaken",
  "earring_of_antharas",
  "necklace_of_valakas",
  "necklace_of_frintezza",
]);

const JEWELRY_KINDS = new Set(["ring", "necklace", "earring"]);

export function isIntegralQuestArmorItemId(itemId: string): boolean {
  return QUEST_SHOP_ARMOR_ITEM_IDS.has(itemId);
}

export function isEpicJewelryItemId(itemId: string): boolean {
  return EPIC_JEWELRY_ITEM_IDS.has(itemId);
}

export function isJewelryKind(kind: string | undefined): boolean {
  return !!kind && JEWELRY_KINDS.has(kind);
}

/** Шолом / нагрудник / штани / рукавиці / чоботи / щит — для P.Def від заточки. */
export function isArmorOrShieldKind(kind: string | undefined): boolean {
  return ["armor", "helmet", "boots", "gloves", "shield"].includes(kind || "");
}

/** Чи дає шматок бронї бонус HP від заточки (щит — ні). */
export function isArmorPieceEligibleForEnchantHp(itemDef: { kind?: string } | null | undefined): boolean {
  const k = itemDef?.kind || "";
  if (k === "shield") return false;
  return ["helmet", "armor", "boots", "gloves"].includes(k);
}

export function getArmorShieldPDefEnchantBonus(enchantLevel: number): number {
  const e = Math.max(0, Math.floor(Number(enchantLevel) || 0));
  return e * PDEF_FLAT_PER_ENCHANT;
}

const JEWELRY_MDEF_NORMAL = 1;
const JEWELRY_MDEF_EPIC = 3;

export function getJewelryMDefEnchantBonus(itemId: string, enchantLevel: number): number {
  const e = Math.max(0, Math.floor(Number(enchantLevel) || 0));
  if (e === 0) return 0;
  const per = isEpicJewelryItemId(itemId) ? JEWELRY_MDEF_EPIC : JEWELRY_MDEF_NORMAL;
  return e * per;
}

/**
 * Додатковий Max HP від заточки одного предмета (тільки відповідні слоти; щит 0).
 * Поріг: звичайна броня — після +3; з квест-шопу — після +4.
 */
export function getArmorEnchantHpFlatFromPiece(
  itemId: string,
  itemDef: { kind?: string } | null | undefined,
  enchantLevel: number
): number {
  if (!itemDef || !isArmorPieceEligibleForEnchantHp(itemDef)) return 0;
  const e = Math.max(0, Math.floor(Number(enchantLevel) || 0));
  const threshold = isIntegralQuestArmorItemId(itemId) ? 4 : 3;
  const over = Math.max(0, e - threshold);
  return over * MAX_HP_PER_ENCHANT_OVER_THRESHOLD;
}
