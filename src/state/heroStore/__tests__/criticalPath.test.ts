/**
 * Міні-тести критичного шляху: одне джерело правди для HP, регену, смерті/reload.
 * Не змінюють виробничий код — лише перевіряють контракт функцій.
 */
import { describe, it, expect } from "vitest";
import { isHeroDead } from "../isHeroDead";
import { restoreFromPercentOrFallback } from "../restoreResourceFromPercent";
import { getHeroRegenPerSecond } from "../heroRegen";

describe("isHeroDead", () => {
  it("hero.hp > 0 → завжди живий", () => {
    expect(isHeroDead({ hp: 1, heroJson: { isDead: true } })).toBe(false);
    expect(isHeroDead({ hp: 100 })).toBe(false);
  });

  it("hp <= 0 і heroJson.isDead/deadAt → мертвий", () => {
    expect(isHeroDead({ hp: 0, heroJson: { isDead: true } })).toBe(true);
    expect(isHeroDead({ hp: 0, heroJson: { deadAt: Date.now() } })).toBe(true);
  });

  it("hp відсутній, isDead true → мертвий", () => {
    expect(isHeroDead({ heroJson: { isDead: true } })).toBe(true);
  });
});

describe("restoreFromPercentOrFallback", () => {
  it("isDead → 0", () => {
    expect(
      restoreFromPercentOrFallback({
        percentRaw: 0.7,
        fullFlag: false,
        savedValueRaw: 100,
        savedMaxRaw: 200,
        finalMax: 200,
        isDead: true,
      })
    ).toBe(0);
  });

  it("живий, percent 0.7 → 70% finalMax", () => {
    expect(
      restoreFromPercentOrFallback({
        percentRaw: 0.7,
        fullFlag: false,
        savedValueRaw: null,
        savedMaxRaw: 200,
        finalMax: 200,
        isDead: false,
      })
    ).toBe(140);
  });

  it("живий, fullFlag → finalMax", () => {
    expect(
      restoreFromPercentOrFallback({
        percentRaw: null,
        fullFlag: true,
        savedValueRaw: null,
        savedMaxRaw: 200,
        finalMax: 200,
        isDead: false,
      })
    ).toBe(200);
  });
});

describe("getHeroRegenPerSecond", () => {
  it("null hero → 0", () => {
    expect(getHeroRegenPerSecond(null, [])).toEqual({
      hpRegen: 0,
      mpRegen: 0,
      cpRegen: 0,
    });
  });

  it("hero без battleStats → базова формула за рівнем", () => {
    const r = getHeroRegenPerSecond({ level: 1 }, []);
    expect(r.hpRegen).toBeGreaterThanOrEqual(1);
    expect(r.mpRegen).toBeGreaterThanOrEqual(1);
    expect(r.cpRegen).toBeGreaterThanOrEqual(1);
    expect(r.hpRegen).toBe(8); // 8 + (1-1)*0.1
    expect(r.mpRegen).toBe(12);
    expect(r.cpRegen).toBe(7);
  });

  it("hero з battleStats.hpRegen → використовує стати", () => {
    const r = getHeroRegenPerSecond(
      { level: 10, battleStats: { hpRegen: 20, mpRegen: 25, cpRegen: 10 } },
      []
    );
    expect(r.hpRegen).toBe(20);
    expect(r.mpRegen).toBe(25);
    expect(r.cpRegen).toBe(10);
  });
});
