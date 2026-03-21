import { describe, it, expect } from "vitest";
import { NG_GRADE_SHOP_ITEMS } from "../ngGradeShop";
import { D_GRADE_SHOP_ITEMS } from "../dGradeShop";
import { C_GRADE_SHOP_ITEMS } from "../cGradeShop";
import { B_GRADE_SHOP_ITEMS } from "../bGradeShop";
import { A_GRADE_SHOP_ITEMS } from "../aGradeShop";
import { S_GRADE_SHOP_ITEMS } from "../sGradeShop";
import { CONSUMABLES_SHOP_ITEMS } from "../consumablesShop";
import { SHOP_ITEM_ID_MAPPING } from "../itemMappings";
import { itemsDB } from "../../items/itemsDB";
import type { ShopItem } from "../shopTypes";

const REGULAR_SHOP_ITEMS: ShopItem[] = [
  ...NG_GRADE_SHOP_ITEMS,
  ...D_GRADE_SHOP_ITEMS,
  ...C_GRADE_SHOP_ITEMS,
  ...B_GRADE_SHOP_ITEMS,
  ...A_GRADE_SHOP_ITEMS,
  ...S_GRADE_SHOP_ITEMS,
  ...CONSUMABLES_SHOP_ITEMS,
];

/** Як у Shop.tsx handleBuy: спочатку id у itemsDB, інакше числовий маппінг. */
function resolveShopItemsDBId(item: ShopItem): string | undefined {
  if (item.id && itemsDB[item.id]) return item.id;
  return SHOP_ITEM_ID_MAPPING[item.itemId as keyof typeof SHOP_ITEM_ID_MAPPING];
}

describe("regular Shop (NG–S + consumables) vs itemsDB", () => {
  it("кожен рядок резолвиться в itemsDB (id або SHOP_ITEM_ID_MAPPING)", () => {
    const unresolved: string[] = [];
    for (const item of REGULAR_SHOP_ITEMS) {
      const dbId = resolveShopItemsDBId(item);
      if (!dbId || !itemsDB[dbId]) {
        unresolved.push(
          `${item.name} (shop id=${item.id}, itemId=${item.itemId} → ${dbId ?? "no mapping"})`
        );
      }
    }
    expect(
      unresolved,
      `Не резолвиться (${unresolved.length}): ${unresolved.slice(0, 15).join("; ")}${unresolved.length > 15 ? "…" : ""}`
    ).toEqual([]);
  });
});
