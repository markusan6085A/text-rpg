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
 * Інвентар / місто: атомарний сервер-ендпоінт → applyServerSync.
 * Повністю сервер-авторитетно: немає race condition між пристроями.
 */
export async function applyGmBlessSoulScrollFromInventory(itemId: string): Promise<{ ok: boolean; message?: string }> {
  const store = useHeroStore.getState();
  const hero = store.hero;
  if (!hero?.name) {
    return { ok: false, message: "Немає героя" };
  }

  // Оптимістична перевірка: є скрол в інвентарі?
  const inv = hero.inventory || [];
  const invItem = inv.find((i) => i.id === itemId);
  if (!invItem || (invItem.count ?? 0) <= 0) {
    return { ok: false, message: "Немає предмета в інвентарі" };
  }
  if (!isGmBlessSoulScrollItem(itemId)) {
    return { ok: false, message: "Невідомий скрол" };
  }

  try {
    const { useBuffScrollAPI } = await import("./api/useBuffScrollAPI");
    const result = await useBuffScrollAPI(itemId);
    if (!result.ok) return { ok: false, message: "Сервер відхилив використання скрола" };

    // Застосовуємо стан з сервера (inventory + heroBuffs) — без PUT
    const serverHeroJson = result.heroJson;
    store.applyServerSync(
      {
        inventory: serverHeroJson.inventory,
        heroJson: {
          ...((hero as any).heroJson || {}),
          heroBuffs: serverHeroJson.heroBuffs,
        },
      },
      { heroRevision: serverHeroJson.heroRevision, updatedAt: Date.now() }
    );

    // Синхронізуємо battle store / persist щоб бафи відображались у бою
    const now = Date.now();
    const cleanedBuffs = cleanupBuffs(
      Array.isArray(serverHeroJson.heroBuffs) ? serverHeroJson.heroBuffs : [],
      now
    );
    const saved = loadBattle(hero.name) || {};
    persistBattle({ ...saved, heroBuffs: cleanedBuffs }, hero.name);
    useBattleStore.setState({ heroBuffs: cleanedBuffs });

    // HP/MP/CP з бафами
    const currentHero = store.hero ?? hero;
    const baseMax = getMaxResources(currentHero as any);
    const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, cleanedBuffs);
    const nextHp = Math.min(maxHp, currentHero.hp ?? maxHp);
    const nextMp = Math.min(maxMp, currentHero.mp ?? maxMp);
    const nextCp = Math.min(maxCp, currentHero.cp ?? maxCp);
    if (nextHp !== currentHero.hp || nextMp !== currentHero.mp || nextCp !== currentHero.cp) {
      store.updateHero({ hp: nextHp, mp: nextMp, cp: nextCp }, { skipServer: true });
    }

    return { ok: true };
  } catch (err: any) {
    const msg = err?.body?.error || err?.message || "Помилка сервера";
    return { ok: false, message: msg };
  }
}
