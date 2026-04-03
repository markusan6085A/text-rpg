/**
 * Застосування GM скролів «Bless the Soul» з інвентаря (місто чи бій).
 * Повтор по тому ж id — лише оновлює тривалість (без подвійного ефекту).
 */
import type { Hero, HeroInventoryItem } from "../types/Hero";
import type { BattleBuff } from "../state/battle/types";
import { useHeroStore } from "../state/heroStore";
import { loadBattle, persistBattle } from "../state/battle/persist";
import { useBattleStore } from "../state/battle/store";
import { cleanupBuffs, computeBuffedMaxResources } from "../state/battle/helpers";
import { getMaxResources } from "../state/battle/helpers/getMaxResources";
import {
  createGmBlessSoulScrollBuff,
  isGmBlessSoulScrollItem,
  GM_BLESS_SOUL_SCROLL_DURATION_MS,
} from "../data/items/gmBlessSoulScrollBuffs";
import { itemsDB } from "../data/items/itemsDB";

function dedupeBuffsPreferLatestExpires(buffs: BattleBuff[], now: number): BattleBuff[] {
  const cleaned = cleanupBuffs(buffs, now);
  const map = new Map<string, BattleBuff>();
  for (const b of cleaned) {
    const key =
      typeof b.id === "number" && Number.isFinite(b.id)
        ? `id:${b.id}`
        : b.name
          ? `name:${b.name}`
          : `x:${JSON.stringify(b.effects)}`;
    const prev = map.get(key);
    if (!prev || (Number(b.expiresAt) || 0) > (Number(prev.expiresAt) || 0)) {
      map.set(key, b);
    }
  }
  return [...map.values()];
}

export function isGmBlessScrollBuff(b: unknown): boolean {
  return !!(b && typeof b === "object" && (b as any).source === "gm_bless_scroll");
}

export function mergeGmBlessSoulScrollBuffs(
  hero: Hero,
  itemId: string,
  now: number,
  currentBuffs: BattleBuff[] | null | undefined
):
  | {
      ok: true;
      nextBuffs: BattleBuff[];
      updatedInventory: HeroInventoryItem[];
      itemName: string;
      buffName: string;
      maxHp: number;
      maxMp: number;
      maxCp: number;
      nextHp: number;
      nextMp: number;
      nextCp: number;
    }
  | { ok: false; message: string } {
  if (!isGmBlessSoulScrollItem(itemId)) {
    return { ok: false, message: "Невідомий скрол" };
  }
  const itemDef = itemsDB[itemId];
  const inv = hero.inventory || [];
  const invItem = inv.find((i) => i.id === itemId);
  if (!invItem || (invItem.count ?? 0) <= 0) {
    return { ok: false, message: "Немає предмета в інвентарі" };
  }

  const newBuff = createGmBlessSoulScrollBuff(itemId, now);
  if (!newBuff) {
    return { ok: false, message: "Помилка скролу" };
  }

  const baseBuffs = dedupeBuffsPreferLatestExpires(currentBuffs || [], now);
  const withoutSame = baseBuffs.filter(
    (b) => !(typeof b?.id === "number" && typeof newBuff.id === "number" && b.id === newBuff.id)
  );
  const nextBuffs = cleanupBuffs([newBuff, ...withoutSame], now);

  const updatedInventory = inv
    .map((i) => {
      if (i.id !== itemId) return i;
      const c = (i.count ?? 1) - 1;
      return c > 0 ? { ...i, count: c } : null;
    })
    .filter(Boolean) as HeroInventoryItem[];

  const heroForMax = { ...hero, inventory: updatedInventory };
  const baseMax = getMaxResources(heroForMax as Hero);
  const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, nextBuffs);
  const curHp = Math.min(maxHp, hero.hp ?? maxHp);
  const curMp = Math.min(maxMp, hero.mp ?? maxMp);
  const curCp = Math.min(maxCp, hero.cp ?? maxCp);

  return {
    ok: true,
    nextBuffs,
    updatedInventory,
    itemName: itemDef?.name ?? itemId,
    buffName: newBuff.name ?? itemId,
    maxHp,
    maxMp,
    maxCp,
    nextHp: curHp,
    nextMp: curMp,
    nextCp: curCp,
  };
}

/**
 * Інвентар / місто: злити бафи з battle save + heroJson.heroBuffs, записати скрол, персист.
 */
export function applyGmBlessSoulScrollFromInventory(itemId: string): { ok: boolean; message?: string } {
  const store = useHeroStore.getState();
  const hero = store.hero;
  if (!hero?.name) {
    return { ok: false, message: "Немає героя" };
  }
  const now = Date.now();
  const saved = loadBattle(hero.name) || {};
  const hj = ((hero as any).heroJson || {}) as { heroBuffs?: BattleBuff[] };
  const fromSaved = Array.isArray(saved.heroBuffs) ? saved.heroBuffs : [];
  const fromJson = Array.isArray(hj.heroBuffs) ? hj.heroBuffs : [];
  const combined = dedupeBuffsPreferLatestExpires([...fromSaved, ...fromJson], now);

  const r = mergeGmBlessSoulScrollBuffs(hero, itemId, now, combined);
  if (r.ok === false) {
    return { ok: false, message: r.message };
  }

  persistBattle({ ...saved, heroBuffs: r.nextBuffs }, hero.name);
  useBattleStore.setState({ heroBuffs: r.nextBuffs });

  const existingJson = ((hero as any).heroJson || {}) as Record<string, unknown>;
  store.updateHero(
    {
      inventory: r.updatedInventory,
      hp: r.nextHp,
      mp: r.nextMp,
      cp: r.nextCp,
      heroJson: {
        ...existingJson,
        heroBuffs: r.nextBuffs,
      } as any,
    },
    { persist: true }
  );
  return { ok: true };
}
