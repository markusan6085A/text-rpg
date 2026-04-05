import { describe, expect, it } from "vitest";
import { enforceCharacterMutationInvariants } from "./characterMutationInvariants";

describe("character mutation invariants", () => {
  it("buy -> sell -> F5: drops invalid inventory rows", () => {
    const res = enforceCharacterMutationInvariants({
      heroJson: {
        inventory: [
          { id: "sword_a", count: 1 },
          { id: "fish", count: 0 },
          { id: "", count: 2 },
          null,
        ],
        overflowChest: [{ id: "ore", count: 3 }],
      },
      adena: 1200,
      coinLuck: 4,
    });

    expect(res.ok).toBe(false);
    expect(res.heroJson.inventory).toEqual([{ id: "sword_a", count: 1 }]);
    expect(res.heroJson.overflowChest).toEqual([{ id: "ore", count: 3 }]);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it("equip + enchant -> F5 -> other device: syncs equipmentEnchantLevels with equipped item", () => {
    const res = enforceCharacterMutationInvariants({
      heroJson: {
        equipment: {
          weapon: { id: "draconic_bow", enchantLevel: 8 },
        },
        equipmentEnchantLevels: {
          weapon: 3,
        },
        inventory: [{ id: "soulshot_ng", count: 100 }],
      },
      adena: 1,
      aa: 0,
      coinLuck: 0,
      coinsSilver: 0,
    });

    expect(res.ok).toBe(true);
    expect(res.heroJson.equipmentEnchantLevels.weapon).toBe(8);
  });

  it("fails on negative currency values", () => {
    const res = enforceCharacterMutationInvariants({
      heroJson: { inventory: [{ id: "ore", count: 1 }] },
      adena: -1,
    });
    expect(res.ok).toBe(false);
    expect(res.errors).toContain("adena invalid");
  });
});

