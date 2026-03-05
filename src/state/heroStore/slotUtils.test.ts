/**
 * Unit tests for slotUtils — critical for equip/unequip logic.
 */
import { describe, it, expect } from "vitest";
import { autoSelectEarringOrRingSlot } from "./slotUtils";
import type { Hero } from "../../types/Hero";

function heroWithEquipment(equipment: Hero["equipment"]) {
  return { equipment: equipment ?? {}, heroJson: {} } as unknown as Hero;
}

describe("autoSelectEarringOrRingSlot", () => {
  it("earring: empty equipment → earring_left", () => {
    expect(autoSelectEarringOrRingSlot("earring", heroWithEquipment({}))).toBe("earring_left");
  });

  it("earring: only left taken → earring_right", () => {
    expect(autoSelectEarringOrRingSlot("earring", heroWithEquipment({ earring_left: "item1" }))).toBe("earring_right");
  });

  it("earring: both taken → replace earring_left", () => {
    expect(
      autoSelectEarringOrRingSlot("earring", heroWithEquipment({ earring_left: "a", earring_right: "b" }))
    ).toBe("earring_left");
  });

  it("ring: empty equipment → ring_left", () => {
    expect(autoSelectEarringOrRingSlot("ring", heroWithEquipment({}))).toBe("ring_left");
  });

  it("ring: only left taken → ring_right", () => {
    expect(autoSelectEarringOrRingSlot("ring", heroWithEquipment({ ring_left: "item1" }))).toBe("ring_right");
  });

  it("ring: both taken → replace ring_left", () => {
    expect(autoSelectEarringOrRingSlot("ring", heroWithEquipment({ ring_left: "a", ring_right: "b" }))).toBe(
      "ring_left"
    );
  });

  it("other slot → returns unchanged", () => {
    expect(autoSelectEarringOrRingSlot("weapon", heroWithEquipment({}))).toBe("weapon");
  });
});
