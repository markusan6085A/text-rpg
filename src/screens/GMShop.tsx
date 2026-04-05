// src/screens/GMShop.tsx
import React, { useState } from "react";
import { useHeroStore, applyCharacterSnapshotFromApi } from "../state/heroStore";
import { showToast } from "../state/toastStore";
import { itemsDB } from "../data/items/itemsDB";
import { itemsDBCrystals } from "../data/items/itemsDB_crystals";
import { shopBuyAPI } from "../utils/api/shopAPI";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import {
  type DyeItem,
  GM_SHOP_ITEMS,
  GM_RASODNIKI_ITEM_IDS,
  GM_GIANT_ENCHANT_SCROLL_IDS,
  GM_GIANT_SCROLL_ADENA_PRICE,
  GM_BLESSED_CHARGE_IDS,
  GM_BLESSED_CHARGE_ADENA_PRICE,
  GM_BLESS_SOUL_SCROLL_IDS,
  GM_BLESS_SOUL_SCROLL_ADENA_PRICE,
  CRYSTAL_PRICE_ADENA,
  RASODNIKI_REQUIRED_LEVEL,
  RASODNIKI_STONES_INFO,
} from "./gmShop/gmShopCatalog";

export type { DyeItem } from "./gmShop/gmShopCatalog";
export { GM_SHOP_ITEMS } from "./gmShop/gmShopCatalog";

type Navigate = (path: string) => void;

interface GMShopProps {
  navigate: Navigate;
}

export default function GMShop({ navigate }: GMShopProps) {
  const hero = useHeroStore((s) => s.hero);
  const [selectedShopSubcategory, setSelectedShopSubcategory] = useState<"dyes" | "rasodniki" | "consumables">("dyes");
  const [selectedItem, setSelectedItem] = useState<DyeItem | null>(null);
  const [selectedAdenaPurchase, setSelectedAdenaPurchase] = useState<{
    itemId: string;
    unitPrice: number;
    minLevel: number | null;
  } | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [generateStoneModal, setGenerateStoneModal] = useState(false);
  const [generateStoneSelectedId, setGenerateStoneSelectedId] = useState<string | null>(null);
  const [consumablesSub, setConsumablesSub] = useState<"giant" | "charges" | "bless_scrolls">("giant");
  const buildGmBuyItemIdCandidates = (rawId: string): string[] => {
    const base = String(rawId || "").trim().toLowerCase();
    const stripped = base.replace(/^shop_/i, "").replace(/^quest_/i, "");
    const out = [base, stripped, stripped ? `shop_${stripped}` : "", stripped ? `quest_${stripped}` : ""];
    return Array.from(new Set(out.filter(Boolean)));
  };

  if (!hero) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
        <div className="w-5 h-5 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin" />
      </div>
    );
  }

  // Отримання AA з інвентаря
  const ancientAdenaItem = hero.inventory?.find(item => item.id === "ancient_adena");
  const aaCount = ancientAdenaItem?.count || 0;

  // Обробка покупки за AA — через сервер (Phase 3)
  const handleBuy = async (item: DyeItem, quantity: number = 1) => {
    if (!hero) return;

    const totalPrice = item.price * quantity;
    if (aaCount < totalPrice) {
      showToast("Недостатньо Ancient Adena (AA)!", "error");
      return;
    }

    const itemDef = itemsDB[item.itemId];
    const itemMeta = itemDef
      ? { id: itemDef.id, name: itemDef.name, slot: itemDef.slot, kind: itemDef.kind, icon: itemDef.icon, description: itemDef.description, stats: itemDef.stats, grade: itemDef.grade || item.grade }
      : { id: item.itemId, name: item.name, slot: "consumable", kind: "consumable", icon: item.icon, description: item.description, grade: item.grade };

    const expectedRevisionRaw =
      typeof (hero as any)?.heroJson?.heroRevision === "number"
        ? Number((hero as any).heroJson.heroRevision)
        : Number(useHeroStore.getState().serverState?.heroRevision ?? 0);
    const expectedRevision =
      Number.isFinite(expectedRevisionRaw) && expectedRevisionRaw >= 0 ? expectedRevisionRaw : 0;
    try {
      const result = await shopBuyAPI({
        itemId: item.itemId,
        quantity,
        shopType: "gm",
        itemMeta,
        expectedRevision,
      });
      if (!result?.ok || !result.character) {
        showToast(`Помилка покупки: сервер відхилив запит`, "error");
        return;
      }
      applyCharacterSnapshotFromApi(result.character);
      setSelectedItem(null);
      setBuyQuantity(1);
      showToast(`Придбано: ${itemMeta.name} x${quantity}`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err ?? "");
      showToast(`Помилка синхронізації: ${msg || "сервер недоступний"}`, "error");
    }
  };

  // Генерація каменя: кристал + ЛС + камінь → 5% шанс отримати камінь з пасивним ефектом
  const STONE_IDS_FOR_GENERATE = ["stone_crit", "stone_mcrit", "stone_maxhp", "stone_focus", "stone_lifesteal", "stone_guidance", "stone_empower", "stone_acumen", "stone_anger", "stone_atkspd"];
  const crystalCount = hero?.inventory?.find((i: any) => i.id === "crystal_d")?.count ?? 0;
  const lsCount = hero?.inventory?.find((i: any) => i.id === "crystal_ls_d")?.count ?? 0;
  const getStoneCount = (stoneId: string) => {
    const items = hero?.inventory?.filter((i: any) => i.id === stoneId && !(i as any).meta?.hasLSPassive) ?? [];
    return items.reduce((sum: number, i: any) => sum + (i.count ?? 1), 0);
  };
  const hasPassiveForStone = (stoneId: string) =>
    (hero?.inventory ?? []).some((i: any) => i.id === stoneId && (i as any).meta?.hasLSPassive);

  const handleGenerateStone = () => {
    if (!hero || !generateStoneSelectedId) return;
    showToast("Генерація каменя переведена в онлайн-режим і тимчасово недоступна до серверного endpoint.", "error");
  };

  // Покупка за Adena (розсодники, свитки Giant тощо) — через сервер (Phase 3)
  const handleBuyAdena = async (
    itemId: string,
    quantity: number = 1,
    unitPrice: number = CRYSTAL_PRICE_ADENA,
    minLevel: number | null = RASODNIKI_REQUIRED_LEVEL
  ) => {
    if (!hero) return;

    const heroLevel = hero.level ?? 1;
    if (minLevel != null && heroLevel < minLevel) {
      showToast(`Доступно з ${minLevel} рівня!`, "error");
      return;
    }

    const totalPrice = unitPrice * quantity;
    const liveHero = useHeroStore.getState().hero;
    if (!liveHero) return;

    const currentAdena = liveHero.adena ?? 0;
    if (currentAdena < totalPrice) {
      showToast("Недостатньо Adena!", "error");
      return;
    }

    const itemDef = itemsDB[itemId] ?? itemsDBCrystals[itemId];
    if (!itemDef) {
      showToast(`Предмет ${itemId} не знайдено`, "error");
      return;
    }

    const itemMeta = {
      id: itemDef.id,
      name: itemDef.name,
      slot: itemDef.slot,
      kind: itemDef.kind,
      icon: itemDef.icon,
      description: itemDef.description,
      grade: itemDef.grade,
    };
    const expectedRevisionRaw =
      typeof (hero as any)?.heroJson?.heroRevision === "number"
        ? Number((hero as any).heroJson.heroRevision)
        : Number(useHeroStore.getState().serverState?.heroRevision ?? 0);
    const expectedRevision =
      Number.isFinite(expectedRevisionRaw) && expectedRevisionRaw >= 0 ? expectedRevisionRaw : 0;
    try {
      const candidates = buildGmBuyItemIdCandidates(itemId);
      let result: Awaited<ReturnType<typeof shopBuyAPI>> | null = null;
      let lastAvailabilityError: any = null;
      for (const candidateId of candidates) {
        try {
          result = await shopBuyAPI({
            itemId: candidateId,
            quantity,
            shopType: "gm",
            itemMeta: { ...itemMeta, id: candidateId },
            expectedRevision,
          });
          break;
        } catch (e: any) {
          const isNotAvailable =
            e?.status === 400 &&
            (String(e?.body?.error ?? "").toLowerCase().includes("item not available in shop") ||
             String(e?.message ?? "").toLowerCase().includes("item not available in shop"));
          if (isNotAvailable) {
            lastAvailabilityError = e;
            continue;
          }
          throw e;
        }
      }
      if (!result) {
        throw lastAvailabilityError || new Error("item not available in shop");
      }
      if (!result?.ok || !result.character) {
        showToast(`Помилка покупки: сервер відхилив запит`, "error");
        return;
      }
      applyCharacterSnapshotFromApi(result.character);
      setSelectedAdenaPurchase(null);
      setBuyQuantity(1);
      showToast(`Придбано: ${itemDef.name} x${quantity}`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err ?? "");
      showToast(`Помилка синхронізації: ${msg || "сервер недоступний"}`, "error");
    }
  };

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const rowL2 =
    "flex items-center gap-2 py-2 px-2 mb-1.5 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 transition-[border-color] duration-150 cursor-pointer";
  const borderB = isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-black/70";
  const tabOn = isL2 ? "text-[#e8c56e] font-semibold border-b border-[#c9a44c]" : "text-gray-200 font-semibold border-b border-white/60";
  const tabOff = isL2 ? "text-[#a89878] hover:text-[#d4c4a8]" : "hover:text-gray-200";
  const modalPanel = isL2
    ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-[#14110c] border border-white/40 rounded-lg p-4 w-full";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full max-w-[360px] mx-auto px-3 py-2"
      }
    >
      <div className={isL2 ? "max-w-[420px] mx-auto w-full" : ""}>
      {/* Заголовок — як у магазині вещей */}
      <div
        className={`${borderB} px-4 py-2 text-center text-[11px] tracking-[0.12em] uppercase ${
          isL2 ? "text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" : "text-[#f4e2b8]"
        }`}
      >
        GM-Шоп
      </div>

      {/* Баланс Adena */}
      <div className={`px-4 py-2 ${borderB} text-[12px] flex items-center gap-1 ${isL2 ? "text-[#d4c4a8]" : "text-[#cfcfcc]"}`}>
        У вас{" "}
        <img 
          src="/items/drops/resources/aden.png" 
          alt="Adena" 
          className="w-4 h-4 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-yellow-400 font-semibold">
          {(hero?.adena || 0).toLocaleString()}
        </span>{" "}
        Adena
      </div>

      {/* Баланс AA */}
      <div className={`px-4 py-2 ${borderB} text-[12px] flex items-center gap-1 ${isL2 ? "text-[#d4c4a8]" : "text-[#cfcfcc]"}`}>
        У вас{" "}
        <img 
          src="/items/drops/resources/etc_ancient_adena_i00.png" 
          alt="Ancient Adena" 
          className="w-4 h-4 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-yellow-400 font-semibold">
          {aaCount.toLocaleString()}
        </span>{" "}
        Ancient Adena (AA)
      </div>

      {/* Магазин (краски / розсодники) */}
      <div className={`px-4 py-2 ${borderB}`}>
          {/* Підкатегорії магазину — як у магазині вещей */}
          <div className={`text-[11px] flex gap-1.5 mb-2 flex-nowrap items-center ${isL2 ? "text-[#c9b896]" : "text-gray-300"}`}>
            <button
              onClick={() => setSelectedShopSubcategory("dyes")}
              className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${
                selectedShopSubcategory === "dyes" ? tabOn : tabOff
              }`}
            >
              Краски
            </button>
            <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
            <button
              onClick={() => setSelectedShopSubcategory("rasodniki")}
              className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${
                selectedShopSubcategory === "rasodniki" ? tabOn : tabOff
              }`}
            >
              Розсодники
            </button>
            <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
            <button
              onClick={() => setSelectedShopSubcategory("consumables")}
              className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${
                selectedShopSubcategory === "consumables" ? tabOn : tabOff
              }`}
            >
              Розхідники
            </button>
          </div>

          {/* Краски — формули статів + список */}
          {selectedShopSubcategory === "dyes" && (
          <div className="space-y-2">
            <details className="text-[11px]">
              <summary className="text-[#cfcfcc] cursor-pointer hover:text-[#e0c68a]">
                Що дають стати (+1)
              </summary>
              <div className="text-[10px] text-[#cfcfcc] mt-1.5 space-y-0.5 pl-1">
                <div>STR: ~+3% P.Atk</div>
                <div>DEX: ~+1% швидкість атаки, +0.8 шанс криту</div>
                <div>CON: ~+3% Max HP/CP</div>
                <div>INT: ~+4% M.Atk</div>
                <div>WIT: ~+5% Casting Spd., +шанс маг. криту</div>
                <div>MEN: ~+1% M.Def та Max MP</div>
              </div>
            </details>
            <div className="space-y-1">
            {GM_SHOP_ITEMS.map((item) => (
              <div
                key={item.id}
                className={
                  isL2
                    ? rowL2
                    : "flex items-center gap-2 py-1.5 border-b border-solid border-white/30 hover:bg-black/20 cursor-pointer"
                }
                onClick={() => {
                  setSelectedItem(item);
                  setBuyQuantity(1);
                }}
              >
                {/* Іконка */}
                <img
                  src={item.icon}
                  alt={item.name}
                  className="w-8 h-8 object-contain flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                  }}
                />
                {/* Назва */}
                <div className="flex-1 text-[12px] text-[#e0c68a]">
                  {item.name}
                </div>
                {/* Ціна — як у магазині вещей */}
                <div className="text-[12px] text-[#f4e2b8] font-semibold">
                  {item.price.toLocaleString()} AA
                </div>
              </div>
            ))}
            </div>
          </div>
          )}

          {/* Розсодники — кристал, ЛС, камні. Доступні з 20 рівня. */}
          {selectedShopSubcategory === "rasodniki" && (
          <div className="space-y-2">
            <details className="text-[11px]">
              <summary className="text-[#cfcfcc] cursor-pointer hover:text-[#e0c68a]">
                Що дають камні
              </summary>
              <div className="mt-1.5 space-y-1 pl-1">
                {RASODNIKI_STONES_INFO.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-[10px] text-[#cfcfcc]">
                    <img src={s.icon} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png"; }} />
                    <span>{s.effect}</span>
                  </div>
                ))}
              </div>
            </details>
            {(hero?.level ?? 1) < RASODNIKI_REQUIRED_LEVEL ? (
              <div className="text-[12px] text-gray-400 py-4 text-center">
                Доступно з {RASODNIKI_REQUIRED_LEVEL} рівня
              </div>
            ) : (
            <>
            <button
              onClick={() => setGenerateStoneModal(true)}
              className="w-full py-2 px-3 bg-[#5c4a32] hover:bg-[#6d5a42] text-[#e0c68a] text-[12px] font-semibold rounded border border-white/30"
            >
              Сгенерировать камень
            </button>
            <div className="text-[10px] text-gray-400 py-1">
              Кристал + ЛС + камінь = 5% шанс пасивки (статы в інвентарі, не передається)
            </div>
            {GM_RASODNIKI_ITEM_IDS.map((itemId) => {
              const def = itemsDBCrystals[itemId] ?? itemsDB[itemId];
              if (!def) return null;
              return (
                <div
                  key={itemId}
                  className={
                    isL2
                      ? rowL2
                      : "flex items-center gap-2 py-1.5 border-b border-solid border-white/30 hover:bg-black/20 cursor-pointer"
                  }
                  onClick={() => {
                    setSelectedAdenaPurchase({
                      itemId,
                      unitPrice: CRYSTAL_PRICE_ADENA,
                      minLevel: RASODNIKI_REQUIRED_LEVEL,
                    });
                    setBuyQuantity(1);
                  }}
                >
                  <img
                    src={def.icon}
                    alt={def.name}
                    className="w-8 h-8 object-contain flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                    }}
                  />
                  <div className="flex-1 text-[12px] text-[#e0c68a]">{def.name}</div>
                  <div className="text-[12px] text-[#f4e2b8] font-semibold">
                    {CRYSTAL_PRICE_ADENA} Adena
                  </div>
                </div>
              );
            })}
            </>
            )}
          </div>
          )}

          {/* Розхідники: Giant scroll + повні заряди */}
          {selectedShopSubcategory === "consumables" && (
            <div className="space-y-2">
              <div className={`text-[11px] flex gap-1.5 mb-1 flex-wrap items-center ${isL2 ? "text-[#c9b896]" : "text-gray-300"}`}>
                <button
                  type="button"
                  onClick={() => setConsumablesSub("giant")}
                  className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${consumablesSub === "giant" ? tabOn : tabOff}`}
                >
                  Свитки Giant
                </button>
                <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
                <button
                  type="button"
                  onClick={() => setConsumablesSub("charges")}
                  className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${consumablesSub === "charges" ? tabOn : tabOff}`}
                >
                  Заряди (100%)
                </button>
                <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
                <button
                  type="button"
                  onClick={() => setConsumablesSub("bless_scrolls")}
                  className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${consumablesSub === "bless_scrolls" ? tabOn : tabOff}`}
                >
                  Скроли Bless
                </button>
              </div>
              {consumablesSub === "giant" && (
                <>
                  <div className={`text-[10px] ${isL2 ? "text-[#a89878]" : "text-gray-400"} mb-1`}>
                    Свитки з 100% шансом заточки (та сама логіка макс. рівня, що у звичайних скролів).
                  </div>
                  {GM_GIANT_ENCHANT_SCROLL_IDS.map((itemId) => {
                    const def = itemsDB[itemId];
                    if (!def) return null;
                    return (
                      <div
                        key={itemId}
                        className={
                          isL2
                            ? rowL2
                            : "flex items-center gap-2 py-1.5 border-b border-solid border-white/30 hover:bg-black/20 cursor-pointer"
                        }
                        onClick={() => {
                          setSelectedAdenaPurchase({
                            itemId,
                            unitPrice: GM_GIANT_SCROLL_ADENA_PRICE,
                            minLevel: null,
                          });
                          setBuyQuantity(1);
                        }}
                      >
                        <img
                          src={def.icon}
                          alt={def.name}
                          className="w-8 h-8 object-contain flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                          }}
                        />
                        <div className="flex-1 text-[12px] text-[#e0c68a]">{def.name}</div>
                        <div className="text-[12px] text-[#f4e2b8] font-semibold">
                          {GM_GIANT_SCROLL_ADENA_PRICE} Adena
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              {consumablesSub === "charges" && (
                <>
                  <div className={`text-[10px] ${isL2 ? "text-[#a89878]" : "text-gray-400"} mb-1`}>
                    Повні заряди: +100% до урону автоатаки та ударних скілів (для воїнів і магів). Грейд заряду =
                    грейд зброї. Поставте на панель зарядів і увімкніть слот.
                  </div>
                  {GM_BLESSED_CHARGE_IDS.map((itemId) => {
                    const def = itemsDB[itemId];
                    if (!def) return null;
                    return (
                      <div
                        key={itemId}
                        className={
                          isL2
                            ? rowL2
                            : "flex items-center gap-2 py-1.5 border-b border-solid border-white/30 hover:bg-black/20 cursor-pointer"
                        }
                        onClick={() => {
                          setSelectedAdenaPurchase({
                            itemId,
                            unitPrice: GM_BLESSED_CHARGE_ADENA_PRICE,
                            minLevel: null,
                          });
                          setBuyQuantity(1);
                        }}
                      >
                        <img
                          src={def.icon}
                          alt={def.name}
                          className="w-8 h-8 object-contain flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                          }}
                        />
                        <div className="flex-1 text-[12px] text-[#e0c68a]">{def.name}</div>
                        <div className="text-[12px] text-[#f4e2b8] font-semibold">
                          {GM_BLESSED_CHARGE_ADENA_PRICE} Adena
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              {consumablesSub === "bless_scrolls" && (
                <>
                  <div className={`text-[10px] ${isL2 ? "text-[#a89878]" : "text-gray-400"} mb-1`}>
                    Тимчасові бафи в бою (20 хв). Одна іконка — різні ефекти; використайте з панелі під час бою.
                  </div>
                  {GM_BLESS_SOUL_SCROLL_IDS.map((itemId) => {
                    const def = itemsDB[itemId];
                    if (!def) return null;
                    return (
                      <div
                        key={itemId}
                        className={
                          isL2
                            ? rowL2
                            : "flex items-center gap-2 py-1.5 border-b border-solid border-white/30 hover:bg-black/20 cursor-pointer"
                        }
                        onClick={() => {
                          setSelectedAdenaPurchase({
                            itemId,
                            unitPrice: GM_BLESS_SOUL_SCROLL_ADENA_PRICE,
                            minLevel: null,
                          });
                          setBuyQuantity(1);
                        }}
                      >
                        <img
                          src={def.icon}
                          alt={def.name}
                          className="w-8 h-8 object-contain flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                          }}
                        />
                        <div className="flex-1 text-[12px] text-[#e0c68a]">{def.name}</div>
                        <div className="text-[12px] text-[#f4e2b8] font-semibold">
                          {GM_BLESS_SOUL_SCROLL_ADENA_PRICE} Adena
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
      </div>

      {/* Модальне вікно покупки */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className={`${modalPanel} max-w-[400px]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div
              className={`text-center text-lg font-bold mb-4 pb-2 border-b ${
                isL2 ? "text-[#e8c56e] border-[#5c4a32]/55" : "text-white border-white/50"
              }`}
            >
              Інформація про предмет
            </div>

            {/* Іконка та назва */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={selectedItem.icon}
                alt={selectedItem.name}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                }}
              />
              <div className="flex-1">
                <div className="text-white text-base font-semibold">
                  {selectedItem.name}
                </div>
              </div>
            </div>

            {/* Опис предмета */}
            {selectedItem.description && (
              <div className="text-gray-300 text-[12px] mb-4 italic">
                {selectedItem.description}
              </div>
            )}

            {/* Ціни */}
            <div className="text-yellow-400 text-[12px] mb-4 flex items-center gap-1">
              Ціна: {selectedItem.price} AA (Ancient Adena)
            </div>

            {/* Вибір кількості */}
            <div className="mb-4 border-t border-white/50 pt-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white text-[12px]">Кількість:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-[12px] hover:bg-[#2a1a10]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={buyQuantity}
                    onChange={(e) => {
                      let val = e.target.value;
                      // Видаляємо початковий "0" якщо вводиться число
                      if (val.startsWith("0") && val.length > 1) {
                        val = val.replace(/^0+/, "") || "1";
                      }
                      const numVal = parseInt(val) || 1;
                      setBuyQuantity(Math.max(1, numVal));
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-16 px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-center text-[12px]"
                  />
                  <button
                    onClick={() => setBuyQuantity(buyQuantity + 1)}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-[12px] hover:bg-[#2a1a10]"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-yellow-400 text-[12px] mb-2 flex items-center gap-1">
                Разом: {selectedItem.price * buyQuantity} AA (Ancient Adena)
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleBuy(selectedItem, buyQuantity)}
                className="text-green-400 text-[12px] py-2 hover:text-green-300 cursor-pointer px-4 bg-[#1a1208] border border-white/50 rounded"
              >
                Купити
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 text-[12px] py-2 hover:text-gray-300 cursor-pointer px-4 bg-[#1a1208] border border-white/50 rounded"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно покупки за Adena (кристали / свитки Giant) */}
      {selectedAdenaPurchase && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAdenaPurchase(null)}
        >
          <div className={`${modalPanel} max-w-[400px]`} onClick={(e) => e.stopPropagation()}>
            {(() => {
              const { itemId, unitPrice, minLevel } = selectedAdenaPurchase;
              const def = itemsDB[itemId] ?? itemsDBCrystals[itemId];
              if (!def) return null;
              const totalPrice = unitPrice * buyQuantity;
              return (
                <>
                  <div
                    className={`text-center text-lg font-bold mb-4 pb-2 border-b ${
                      isL2 ? "text-[#e8c56e] border-[#5c4a32]/55" : "text-white border-white/50"
                    }`}
                  >
                    Інформація про предмет
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={def.icon}
                      alt={def.name}
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-white text-base font-semibold">{def.name}</div>
                    </div>
                  </div>
                  {def.description && (
                    <div className="text-gray-300 text-[12px] mb-4 italic">{def.description}</div>
                  )}
                  <div className="text-yellow-400 text-[12px] mb-4 flex items-center gap-1">
                    Ціна: {unitPrice} Adena
                  </div>
                  <div className="mb-4 border-t border-white/50 pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white text-[12px]">Кількість:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                          className="px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-[12px] hover:bg-[#2a1a10]"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={buyQuantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setBuyQuantity(Math.max(1, val));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-16 px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-center text-[12px]"
                        />
                        <button
                          onClick={() => setBuyQuantity(buyQuantity + 1)}
                          className="px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-[12px] hover:bg-[#2a1a10]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-yellow-400 text-[12px] mb-2">Разом: {totalPrice} Adena</div>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleBuyAdena(itemId, buyQuantity, unitPrice, minLevel)}
                      className="text-green-400 text-[12px] py-2 hover:text-green-300 cursor-pointer px-4 bg-[#1a1208] border border-white/50 rounded"
                    >
                      Купити
                    </button>
                    <button
                      onClick={() => setSelectedAdenaPurchase(null)}
                      className="text-gray-400 text-[12px] py-2 hover:text-gray-300 cursor-pointer px-4 bg-[#1a1208] border border-white/50 rounded"
                    >
                      Скасувати
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Модалка генерації каменя: кристал + ЛС + камінь */}
      {generateStoneModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setGenerateStoneModal(false)}>
          <div
            className={
              isL2
                ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 max-w-[320px] w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                : "bg-[#1a1208] border border-white/50 rounded-lg p-4 max-w-[320px] w-full"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[#e0c68a] font-bold text-[14px] mb-3 text-center">Сгенерировать камень</div>
            <div className="text-[11px] text-gray-400 mb-3">Вставьте: Кристал (D), ЛС (D), Камінь. 5% шанс пассивки.</div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#cfcfcc]">Кристал (D):</span>
                <span className={crystalCount >= 1 ? "text-green-400" : "text-red-400"}>{crystalCount} шт.</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#cfcfcc]">ЛС (D):</span>
                <span className={lsCount >= 1 ? "text-green-400" : "text-red-400"}>{lsCount} шт.</span>
              </div>
              <div className="text-[12px] text-[#cfcfcc] mt-2">Выберите камень:</div>
              <div className="grid grid-cols-2 gap-1 max-h-[180px] overflow-y-auto">
                {STONE_IDS_FOR_GENERATE.map((sid) => {
                  const def = itemsDBCrystals[sid] ?? itemsDB[sid];
                  const cnt = getStoneCount(sid);
                  const sel = generateStoneSelectedId === sid;
                  const alreadyHasPassive = hasPassiveForStone(sid);
                  const disabled = cnt < 1 || alreadyHasPassive;
                  return (
                    <button
                      key={sid}
                      onClick={() => !disabled && setGenerateStoneSelectedId(sid)}
                      disabled={disabled}
                      title={alreadyHasPassive ? "Пассивка этого типа уже есть" : ""}
                      className={`flex items-center gap-1.5 py-1.5 px-2 rounded border text-left text-[11px] ${
                        disabled
                          ? "opacity-50 cursor-not-allowed border-gray-600"
                          : sel
                            ? "border-[#e0c68a] bg-[#2a2015]"
                            : isL2
                              ? "border-[#5c4a32]/70 hover:bg-black/20 hover:border-[#c7ad80]/35"
                              : "border-white/30 hover:bg-black/20"
                      }`}
                    >
                      {def?.icon && <img src={def.icon} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png"; }} />}
                      <span className="truncate text-[#e0c68a]">{def?.name ?? sid}</span>
                      <span className="text-gray-400 ml-auto">{alreadyHasPassive ? "✓" : `x${cnt}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleGenerateStone}
                disabled={!generateStoneSelectedId || crystalCount < 1 || lsCount < 1 || (generateStoneSelectedId ? getStoneCount(generateStoneSelectedId) < 1 || hasPassiveForStone(generateStoneSelectedId) : true)}
                className="px-4 py-2 bg-[#5c4a32] hover:bg-[#6d5a42] disabled:opacity-50 disabled:cursor-not-allowed text-[#e0c68a] text-[12px] rounded border border-white/30"
              >
                Сгенерировать
              </button>
              <button
                onClick={() => { setGenerateStoneModal(false); setGenerateStoneSelectedId(null); }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-[12px] rounded"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}