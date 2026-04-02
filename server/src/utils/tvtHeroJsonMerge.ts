/**
 * При PUT /characters/:id клієнт може надіслати застарілий heroJson (автозбереження до GET після TvT).
 * Coin of Luck у колонці coinLuck не затирається; tvt_coin / tvtCoins лише в heroJson — їх не можна
 * перезаписувати меншим значенням з клієнта, інакше нагорода зникає з інвентаря.
 *
 * Не-TvT інвентар мерджимо union з БД + вхідний snapshot: інакше порожній / undefined inventory
 * з другого пристрою затирав би весь інвентар у БД.
 */
import { mergeInventoriesUnionForPut } from "./inventoryMergeUnion";

const TVT_ITEM_ID = "tvt_coin";

function sumTvtCoinInList(list: unknown): number {
  if (!Array.isArray(list)) return 0;
  return list.reduce((s: number, x: any) => {
    if (!x || (x.id !== TVT_ITEM_ID && x.itemId !== TVT_ITEM_ID)) return s;
    return s + Math.max(1, Number(x.count) || 1);
  }, 0);
}

function listWithoutTvt(list: unknown): any[] {
  if (!Array.isArray(list)) return [];
  return list.filter((x: any) => x && x.id !== TVT_ITEM_ID && x.itemId !== TVT_ITEM_ID);
}

function mergeTvtCoinList(existingList: unknown, incomingList: unknown): any[] {
  const sumOld = sumTvtCoinInList(existingList);
  const sumNew = sumTvtCoinInList(incomingList);
  const total = Math.max(sumOld, sumNew);
  const base = mergeInventoriesUnionForPut(listWithoutTvt(existingList), listWithoutTvt(incomingList));
  if (total <= 0) return base;
  const tpl =
    (Array.isArray(incomingList) &&
      (incomingList as any[]).find((x: any) => x && (x.id === TVT_ITEM_ID || x.itemId === TVT_ITEM_ID))) ||
    (Array.isArray(existingList) &&
      (existingList as any[]).find((x: any) => x && (x.id === TVT_ITEM_ID || x.itemId === TVT_ITEM_ID))) ||
    ({ id: TVT_ITEM_ID, name: "TvT Coin" } as any);
  base.push({ ...tpl, id: TVT_ITEM_ID, name: tpl.name || "TvT Coin", count: total });
  return base;
}

/**
 * Перед збереженням heroJson з PUT: не дозволяти клієнту зменшити tvtCoins / стак tvt_coin відносно поточної БД.
 */
export function mergeTvtRewardsIntoIncomingHeroJson(existingHeroJson: any, incomingHeroJson: any): any {
  if (!incomingHeroJson || typeof incomingHeroJson !== "object") return incomingHeroJson;
  const oldHj = existingHeroJson && typeof existingHeroJson === "object" ? existingHeroJson : {};
  const oldTvt = Math.max(Number(oldHj.tvtCoins ?? oldHj.tvt_coins ?? 0), 0);
  const newTvt = Math.max(Number(incomingHeroJson.tvtCoins ?? incomingHeroJson.tvt_coins ?? 0), 0);
  const mergedCounter = Math.max(oldTvt, newTvt);

  const out = {
    ...incomingHeroJson,
    tvtCoins: mergedCounter,
    tvt_coins: mergedCounter,
    inventory: mergeTvtCoinList(oldHj.inventory, incomingHeroJson.inventory),
    overflowChest: mergeTvtCoinList(oldHj.overflowChest, incomingHeroJson.overflowChest),
  };
  return out;
}

/**
 * 7 Печатей: після POST /seven-seals/claim у БД є sevenSealsBonus.claimedWeekStart.
 * Клієнтський PUT часто перезаписує heroJson без цього поля → приз знову «доступний» на кожному F5.
 */
function mergeSevenSealsBonusPreserve(existingHeroJson: any, incomingHeroJson: any): any {
  const out = { ...incomingHeroJson };
  const ex = existingHeroJson?.sevenSealsBonus;
  const inc = incomingHeroJson?.sevenSealsBonus;
  if (ex && typeof ex === "object" && typeof (ex as any).claimedWeekStart === "string" && (ex as any).claimedWeekStart.length > 0) {
    const incClaimed =
      inc && typeof inc === "object" && typeof (inc as any).claimedWeekStart === "string"
        ? String((inc as any).claimedWeekStart)
        : "";
    if (!incClaimed) {
      out.sevenSealsBonus = ex;
    }
  }
  return out;
}

/**
 * Рибалка: сесія лише в heroJson; POST /fishing/start пише в БД, а PUT героя з клієнта часто
 * не містить fishingSession → без цього мерджу активний заброс затирався.
 */
function mergeFishingSessionPreserve(existingHeroJson: any, incomingHeroJson: any): any {
  const out = { ...incomingHeroJson };
  const ex = existingHeroJson?.fishingSession;
  const inc = incomingHeroJson?.fishingSession;
  const exValid = ex && typeof ex.startedAt === "number";
  const incValid = inc && typeof inc.startedAt === "number";
  if (exValid && !incValid) {
    out.fishingSession = ex;
  }
  return out;
}

/** TvT + 7 Печатей + рибалка — поля, які сервер не повинен втрачати через застарілий клієнтський snapshot. */
export function mergeHeroJsonForClientPut(existingHeroJson: any, incomingHeroJson: any): any {
  const t = mergeTvtRewardsIntoIncomingHeroJson(existingHeroJson, incomingHeroJson);
  const s = mergeSevenSealsBonusPreserve(existingHeroJson, t);
  return mergeFishingSessionPreserve(existingHeroJson, s);
}
