/**
 * Unit tests for slotUtils — critical for equip/unequip logic.
 */
import { describe, it, expect } from "vitest";
import { autoSelectEarringOrRingSlot } from "./slotUtils";
import type { Hero } from "../../types/Hero";

describe("autoSelectEarringOrRingSlot", () => {
  it("earring: empty equipment → earring_left", () => {
    const hero: Hero = { equipment: {}, heroJson: {} } as Hero;
    expect(autoSelectEarringOrRingSlot("earring", hero)).toBe("earring_left");
  });

  it("earring: only left taken → earring_right", () => {
    const hero: Hero = { equipment: { earring_left: "item1" }, heroJson: {} } as Hero;
    expect(autoSelectEarringOrRingSlot("earring", hero)).toBe("earring_right");
  });

  it("earring: both taken → replace earring_left", () => {
    const hero: Hero = {
      equipment: { earring_left: "a", earring_right: "b" },
      heroJson: {},
    } as Hero;
    expect(autoSelectEarringOrRingSlot("earring", hero)).toBe("earring_left");
  });

  it("ring: empty equipment → ring_left", () => {
    const hero: Hero = { equipment: {}, heroJson: {} } as Hero;
    expect(autoSelectEarringOrRingSlot("ring", hero)).toBe("ring_left");
  });

  it("ring: only left taken → ring_right", () => {
    const hero: Hero = { equipment: { ring_left: "item1" }, heroJson: {} } as Hero;
    expect(autoSelectEarringOrRingSlot("ring", hero)).toBe("ring_right");
  });

  it("ring: both taken → replace ring_left", () => {
    const hero: Hero = {
      equipment: { ring_left: "a", ring_right: "b" },
      heroJson: {},
    } as Hero;
    expect(autoSelectEarringOrRingSlot("ring", hero)).toBe("ring_left");
  });

  it("other slot → returns unchanged", () => {
    const hero: Hero = { equipment: {}, heroJson: {} } as Hero;
    expect(autoSelectEarringOrRingSlot("weapon", hero)).toBe("weapon");
  });
});
