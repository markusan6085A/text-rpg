import type { ItemDefinition } from "../data/items/itemsDB.types";
import { itemsDBCraftResources } from "../data/items/itemsDBCraftResources";
import { itemsDBCrystals } from "../data/items/itemsDB_crystals";
import { L2DOP_TIER_MATERIAL_IDS } from "../data/world/l2dop/tieredResourceLoot";

/** Івент, рибалка, скрині, ключі — не з папки l2dop-by-itemid, але потрібні в адмінці. */
const ADMIN_EXTRA_SHOWN_RESOURCE_IDS: ReadonlySet<string> = new Set([
  "adena",
  "coin_of_luck",
  "coins_silver",
  "ancient_adena",
  "tvt_coin",
  "coin_of_fair",
  "gludio_fish_lure",
  "fish_seawater",
  "treasure_box",
  "quest_gludio_charcoal",
  "thief_key",
]);

function buildAdminShownResourceIds(): ReadonlySet<string> {
  return new Set<string>([
    ...Object.keys(itemsDBCraftResources),
    ...L2DOP_TIER_MATERIAL_IDS,
    ...Object.keys(itemsDBCrystals),
    ...ADMIN_EXTRA_SHOWN_RESOURCE_IDS,
  ]);
}

const ADMIN_SHOWN_RESOURCE_IDS = buildAdminShownResourceIds();

function isStoneLikeResourceId(id: string): boolean {
  const x = id.toLowerCase();
  return x.startsWith("stone_") || x.startsWith("crystal_");
}

/**
 * Прибирає з адмін-вибору «зайві» resource/slot:resource (квестові трофеї професій, зламані іконки тощо).
 * У грі предмети лишаються в itemsDB — лише пікер чиститься.
 */
export function shouldOmitItemFromAdminPicker(id: string, def: ItemDefinition): boolean {
  const k = def.kind || "";
  const sl = def.slot || "";
  if (k !== "resource" || sl !== "resource") return false;
  if (isStoneLikeResourceId(id)) return false;
  return !ADMIN_SHOWN_RESOURCE_IDS.has(id);
}
