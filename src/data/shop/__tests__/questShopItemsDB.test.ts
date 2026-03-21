import { describe, it, expect } from "vitest";
import { QUEST_SHOP_ITEMS } from "../questShop";
import { itemsDB } from "../../items/itemsDB";

describe("QUEST_SHOP_ITEMS vs itemsDB", () => {
  it("кожен item.id існує в itemsDB", () => {
    const missing: string[] = [];
    for (const item of QUEST_SHOP_ITEMS) {
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
});
