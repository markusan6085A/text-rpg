import { describe, it, expect } from "vitest";
import { NG_GRADE_SHOP_ITEMS } from "../ngGradeShop";
import { D_GRADE_SHOP_ITEMS } from "../dGradeShop";
import { C_GRADE_SHOP_ITEMS } from "../cGradeShop";
import { B_GRADE_SHOP_ITEMS } from "../bGradeShop";
import { A_GRADE_SHOP_ITEMS } from "../aGradeShop";
import { S_GRADE_SHOP_ITEMS } from "../sGradeShop";
import { CONSUMABLES_SHOP_ITEMS } from "../consumablesShop";
import { resolveRegularShopItemsDBId } from "../shopItemResolve";
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

describe("regular Shop (NG–S + consumables) vs itemsDB", () => {
  it("кожен item.id — канонічний ключ itemsDB", () => {
    const missing: string[] = [];
    for (const item of REGULAR_SHOP_ITEMS) {
      if (!item.id) {
        missing.push("(empty id)");
        continue;
      }
      if (!itemsDB[item.id]) missing.push(item.id);
    }
    expect(
      missing,
      `Відсутні в itemsDB (${missing.length}): ${missing.slice(0, 40).join(", ")}${missing.length > 40 ? "…" : ""}`
    ).toEqual([]);
  });

  it("resolveRegularShopItemsDBId збігається з item.id", () => {
    for (const item of REGULAR_SHOP_ITEMS) {
      expect(resolveRegularShopItemsDBId(item)).toBe(item.id);
    }
  });
});
