/**
 * При PUT /characters/:id клієнт може надіслати застарілий heroJson (автозбереження до GET після TvT).
 * Coin of Luck у колонці coinLuck не затирається; tvt_coin / tvtCoins лише в heroJson — їх не можна
 * перезаписувати меншим значенням з клієнта, інакше нагорода зникає з інвентаря.
 */
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
  const base = listWithoutTvt(incomingList);
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
