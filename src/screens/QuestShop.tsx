// src/screens/QuestShop.tsx
import React, { useState } from "react";
import { QUEST_SHOP_ITEMS } from "../data/shop/questShop";
import type { ShopItem } from "../data/shop/shopTypes";
import { useHeroStore, applyCharacterSnapshotFromApi } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { postQuestShopExchange } from "../utils/api/characters";
import { shopBuyAPI } from "../utils/api/shopAPI";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import { findSetForItem, ARMOR_SETS, formatSetStatsForDisplay } from "../data/sets/armorSets";
import { autoDetectArmorType, autoDetectGrade } from "../utils/items/autoDetectArmorType";
import { QUEST_SHOP_ITEM_MAPPING } from "../data/shop/questShopResolvedMapping";
import { showToast } from "../state/toastStore";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { SetBonusDisplay } from "./character/SetBonusDisplay";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import { isMagicWeaponForEnchant } from "../utils/stats/weaponEnchantBonuses";
import { getWeaponAccuracyBonusByGrade } from "../utils/stats/weaponGradeAccuracy";

type Navigate = (path: string) => void;

type QuestExchangeType = "adena" | "exp" | "sp" | "coinOfLuck";

const QUEST_EXCHANGE_SILVER_PER_UNIT = 10;
const QUEST_EXCHANGE_REWARD_PER_UNIT: Record<QuestExchangeType, number> = {
  adena: 50_000,
  exp: 100_000,
  sp: 50_000,
  coinOfLuck: 1,
};

interface QuestShopProps {
  navigate: Navigate;
}

export default function QuestShop({ navigate }: QuestShopProps) {
  const hero = useHeroStore((s) => s.hero);
  const characterId = useCharacterStore((s) => s.characterId);
  const [exchangeBusy, setExchangeBusy] = useState(false);
  const [buyBusy, setBuyBusy] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("weapons");
  const [selectedGrade, setSelectedGrade] = useState<string>("D");
  const [selectedArmorSubcategory, setSelectedArmorSubcategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  /** Кількість «пакетів» обміну (1 пакет = 10 срібла за курс рядка). */
  const [exchangeQuantity, setExchangeQuantity] = useState<number>(1);
  const [confirmExchange, setConfirmExchange] = useState<{ type: QuestExchangeType; name: string } | null>(null);
  const [weaponKindFilter, setWeaponKindFilter] = useState<"all" | "phys" | "magic">("all");
  const buildQuestBuyItemIdCandidates = (rawId: string, mappedId?: string | null): string[] => {
    const base = String(rawId || "").trim().toLowerCase();
    const mapped = String(mappedId || "").trim().toLowerCase();
    const stripped = base.replace(/^shop_/i, "").replace(/^quest_/i, "");
    const out = [base, mapped, stripped, stripped ? `quest_${stripped}` : ""];
    return Array.from(new Set(out.filter(Boolean)));
  };

  // Фільтрація предметів
  const filteredItems = QUEST_SHOP_ITEMS.filter((item) => {
    if (selectedCategory === "weapons") {
      if (item.type !== "weapon") return false;
      if (item.grade !== selectedGrade) return false;
      if (weaponKindFilter !== "all") {
        let itemsDBId: string | undefined = item.id && itemsDB[item.id] ? item.id : QUEST_SHOP_ITEM_MAPPING[item.itemId];
        let itemDef = itemsDBId ? itemsDB[itemsDBId] : undefined;
        if (!itemDef && item.name) {
          const itemNameLower = item.name.toLowerCase().replace(/\[.*?\]/g, "").trim();
          itemsDBId = Object.keys(itemsDB).find((key) => {
            const dbItem = itemsDB[key];
            return dbItem?.name?.toLowerCase().replace(/\[.*?\]/g, "").trim() === itemNameLower;
          });
          if (itemsDBId) itemDef = itemsDB[itemsDBId];
        }
        if (itemDef && itemsDBId) {
          const isMag = isMagicWeaponForEnchant(itemsDBId, itemDef);
          if (weaponKindFilter === "phys" && isMag) return false;
          if (weaponKindFilter === "magic" && !isMag) return false;
        }
      }
      return true;
    }
    if (selectedCategory === "sets") {
      if (item.type !== "armor") return false;
      if (item.grade !== selectedGrade) return false;
      if (selectedArmorSubcategory) {
        if (item.category !== selectedArmorSubcategory) return false;
      }
      return true;
    }
    if (selectedCategory === "items") {
      const isQuestItem =
        item.type === "tattoo" ||
        (item.type === "armor" && (item.category === "belt" || item.category === "cloak"));
      if (!isQuestItem) return false;
      return item.grade === selectedGrade;
    }
    if (selectedCategory === "enchant_scrolls") {
      if (item.category !== "enchant_scroll") return false;
      if (item.grade !== selectedGrade) return false;
      return true;
    }
    if (selectedCategory === "exchange") {
      return false; // Обмінник показує свої елементи окремо
    }
    return false;
  });

  const handleBuy = async (item: ShopItem, quantity: number = 1) => {
    if (!hero) return;
    if (buyBusy) return;

    const totalPrice = item.price * quantity;

    // Перевіряємо наявність Серебряных Монет (валюта hero.coins_silver)
    const coinCount = hero.coins_silver ?? 0;
    if (coinCount < totalPrice) {
      showToast("Недостаточно Серебряных Монет!", "error");
      return;
    }

    // Спочатку item.id (є в itemsDB) — джерело правди для квест-шопу; itemId + мапа — лише fallback (D/kv_shop тощо).
    let itemsDBId: string | undefined = item.id && itemsDB[item.id] ? item.id : QUEST_SHOP_ITEM_MAPPING[item.itemId];
    let itemDef = itemsDBId ? itemsDB[itemsDBId] : undefined;

    // Якщо не знайшли через id/маппінг, спробуємо знайти за назвою (fallback)
    if (!itemDef && item.name) {
      const itemNameLower = item.name.toLowerCase().replace(/\[.*?\]/g, '').trim();
      itemsDBId = Object.keys(itemsDB).find(key => {
        const dbItem = itemsDB[key];
        return dbItem?.name?.toLowerCase().replace(/\[.*?\]/g, '').trim() === itemNameLower;
      });
      if (itemsDBId) {
        itemDef = itemsDB[itemsDBId];
      }
    }

    if (!itemDef || !itemsDBId) {
      console.error(`[QuestShop] Item not found in itemsDB: itemId=${item.itemId}, name=${item.name}`);
      console.error(`[QuestShop] Available mapping keys:`, Object.keys(QUEST_SHOP_ITEM_MAPPING).slice(0, 10));
      showToast(`Помилка: предмет "${item.name}" не знайдено в itemsDB`, "error");
      return;
    }

    const finalStats = item.stats || itemDef.stats;
    if (item.stats && itemDef.stats && JSON.stringify(item.stats) !== JSON.stringify(itemDef.stats)) {
      console.warn(
        `[QuestShop] Stats mismatch for ${itemsDBId}: ShopItem has ${JSON.stringify(item.stats)}, itemsDB has ${JSON.stringify(itemDef.stats)}. Using ShopItem stats.`
      );
    }
    const grade = itemDef.grade || autoDetectGrade(itemsDBId);
    const armorType =
      itemDef.armorType ||
      (itemDef.kind === "armor" ||
      itemDef.kind === "helmet" ||
      itemDef.kind === "boots" ||
      itemDef.kind === "gloves"
        ? autoDetectArmorType(itemsDBId)
        : undefined);
    const expectedRevisionRaw =
      typeof (hero as any)?.heroJson?.heroRevision === "number"
        ? Number((hero as any).heroJson.heroRevision)
        : Number(useHeroStore.getState().serverState?.heroRevision ?? 0);
    const expectedRevision =
      Number.isFinite(expectedRevisionRaw) && expectedRevisionRaw >= 0 ? expectedRevisionRaw : 0;
    setBuyBusy(true);
    try {
      const baseMeta = {
        id: itemDef.id,
        name: itemDef.name,
        slot: itemDef.slot,
        kind: itemDef.kind,
        icon: itemDef.icon,
        description: itemDef.description,
        stats: finalStats,
        grade,
        armorType,
      };
      const mappedId = QUEST_SHOP_ITEM_MAPPING[item.itemId];
      const candidates = buildQuestBuyItemIdCandidates(itemDef.id, mappedId);
      let result: Awaited<ReturnType<typeof shopBuyAPI>> | null = null;
      let lastAvailabilityError: any = null;
      for (const candidateId of candidates) {
        try {
          result = await shopBuyAPI({
            itemId: candidateId,
            quantity,
            shopType: "quest",
            itemMeta: { ...baseMeta, id: candidateId },
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
        showToast("Сервер відхилив покупку.", "error");
        return;
      }
      applyCharacterSnapshotFromApi(result.character);
      setSelectedItem(null);
      setBuyQuantity(1);
    } catch (e: any) {
      if (e?.status === 409) {
        showToast("Дані персонажа застаріли. Оновіть стан.", "error");
      } else if (e?.status === 400) {
        showToast("Покупку відхилено сервером.", "error");
      } else {
        showToast(e?.message || "Не вдалося виконати покупку.", "error");
      }
    } finally {
      setBuyBusy(false);
    }
  };

  // Отримання itemsDB ID з ShopItem — спочатку item.id (унікальний), потім маппінг
  const getItemsDBId = (item: ShopItem): string | null => {
    if (item.id && itemsDB[item.id]) return item.id;
    return QUEST_SHOP_ITEM_MAPPING[item.itemId] || null;
  };

  // Отримання інформації про сет для предмета
  const getSetInfo = (item: ShopItem): string | null => {
    const itemsDBId = getItemsDBId(item);
    if (!itemsDBId) return null;

    const set = findSetForItem(itemsDBId);
    if (!set) return null;

    // Формуємо список частин сету
    const piecesList = set.pieces.map((piece) => {
      const pieceItem = itemsDB[piece.itemId];
      return pieceItem ? pieceItem.name : piece.itemId;
    }).join(", ");

    // Формуємо список бонусів повного сету
    const bonusesList: string[] = [];
    bonusesList.push(...formatSetStatsForDisplay(set.bonuses.setStats));
    if (set.bonuses.fullSet) {
      const bonuses = set.bonuses.fullSet;
      if (bonuses.pDef) bonusesList.push(`+${bonuses.pDef} Физ. защ`);
      if (bonuses.mDef) bonusesList.push(`+${bonuses.mDef} Маг. защ`);
      if (bonuses.maxHp) bonusesList.push(`+${bonuses.maxHp} Max HP`);
      if (bonuses.maxMp) bonusesList.push(`+${bonuses.maxMp} Max MP`);
      if (bonuses.maxCp) bonusesList.push(`+${bonuses.maxCp} Max CP`);
      if (bonuses.hpRegen) bonusesList.push(`+${bonuses.hpRegen} Реген HP`);
      if (bonuses.mpRegen) bonusesList.push(`+${bonuses.mpRegen} Реген MP`);
      if (bonuses.attackSpeed) bonusesList.push(`+${bonuses.attackSpeed} Скорость атаки`);
      if (bonuses.castSpeed) bonusesList.push(`+${bonuses.castSpeed} Скорость каста`);
      if (bonuses.pAtk) bonusesList.push(`+${bonuses.pAtk} Физ. атака`);
      if (bonuses.mAtk) bonusesList.push(`+${bonuses.mAtk} Маг. атака`);
      if (bonuses.crit) bonusesList.push(`+${bonuses.crit}% Крит`);
      if (bonuses.critRate) bonusesList.push(`+${bonuses.critRate}% Крит`);
      if (bonuses.critPower) bonusesList.push(`+${bonuses.critPower} Сила крита`);
      if (bonuses.critDamage) bonusesList.push(`+${bonuses.critDamage} Сила крита`);
      if (bonuses.skillCritRate) bonusesList.push(`+${bonuses.skillCritRate}% Шанс маг крита`);
      if (bonuses.skillCritPower) bonusesList.push(`+${bonuses.skillCritPower} Сила маг крита`);
      if (bonuses.pDefPercent) bonusesList.push(`+${bonuses.pDefPercent}% Физ. защ`);
      if (bonuses.mDefPercent) bonusesList.push(`+${bonuses.mDefPercent}% Маг. защ`);
      if (bonuses.maxHpPercent) bonusesList.push(`+${bonuses.maxHpPercent}% Max HP`);
      if (bonuses.accuracy) bonusesList.push(`+${bonuses.accuracy} Точність`);
    }

    // Нічого не показуємо, якщо немає бонусів
    if (bonusesList.length === 0) return null;

    let result = `\n\n[Сет: ${set.name}]\n`;
    result += `Повний сет: ${bonusesList.join(", ")}\n`;
    return result;
  };

  // Отримання іконки предмета
  const getItemIcon = (item: ShopItem): string => {
    // Спочатку перевіряємо чи є іконка безпосередньо в ShopItem
    if (item.icon) {
      return item.icon.startsWith("/") ? item.icon : `/items/${item.icon}`;
    }
    // 🔥 КРИТИЧНО: Використовуємо getItemsDBId (item.id спочатку) — itemId 2500 давав однакові іконки
    const itemsDBId = getItemsDBId(item);
    if (itemsDBId && itemsDB[itemsDBId]?.icon) {
      const icon = itemsDB[itemsDBId].icon;
      return icon.startsWith("/") ? icon : `/items/${icon}`;
    }
    if (item.itemId) {
      return `/items/drops/items/${item.itemId}.jpg`;
    }
    return "/items/drops/Weapon_squires_sword_i00_0.jpg"; // дефолтна іконка
  };

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const rowL2 =
    "flex items-center gap-2 py-2 px-2 mb-1.5 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 transition-[border-color] duration-150";
  const borderB = isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-black/70";
  const tabOn = isL2 ? "text-[#e8c56e] font-semibold border-b border-[#c9a44c]" : "text-gray-200 font-semibold border-b border-white/60";
  const tabOff = isL2 ? "text-[#a89878] hover:text-[#d4c4a8]" : "hover:text-gray-200";
  const subTabOn = isL2 ? "text-[#e8c56e] font-bold" : "text-gray-400 font-bold";
  const subTabOff = isL2 ? "text-[#8a7a60] font-semibold hover:text-[#c9a44c]" : "text-gray-500 font-semibold hover:text-gray-400";
  const exchangeRow = isL2
    ? "w-full flex items-center justify-between py-2 px-3 rounded-md bg-gradient-to-b from-[#2e2619]/90 to-[#14110c] border border-[#5c4a32]/60 hover:border-[#c7ad80]/40 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]"
    : "w-full flex items-center justify-between py-2 px-3 hover:bg-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]";
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
      {/* Заголовок */}
      <div
        className={`${borderB} px-4 py-2 text-center text-[11px] tracking-[0.12em] uppercase font-semibold ${
          isL2 ? "text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" : "text-[#ff8c00]"
        }`}
      >
        Квест-Шоп
      </div>

      {/* Баланс Серебряных Монет */}
      <div className={`px-4 py-2 ${borderB} text-[12px] flex items-center gap-1 ${isL2 ? "text-[#d4c4a8]" : "text-[#cfcfcc]"}`}>
        У вас с собой{" "}
        <img 
          src="/items/drops/resources/etc_coins_silver_i00.png" 
          alt="Серебряные Монеты" 
          className="w-4 h-4 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-yellow-400 font-semibold">
          {(hero?.coins_silver ?? 0).toLocaleString()}
        </span>{" "}
        Серебряные Монеты
      </div>

      {/* Категорії */}
      <div className={`px-4 py-2 ${borderB}`}>
        <div className={`text-[11px] flex gap-1.5 mb-2 flex-nowrap items-center ${isL2 ? "text-[#c9b896]" : "text-gray-300"}`}>
          <button
            onClick={() => {
              setSelectedCategory("weapons");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
              setWeaponKindFilter("all");
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "weapons" ? tabOn : tabOff}`}
          >
            Оружие
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("sets");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "sets" ? tabOn : tabOff}`}
          >
            Сеты
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("items");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "items" ? tabOn : tabOff}`}
          >
            Итемы
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("enchant_scrolls");
              setSelectedGrade("D");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "enchant_scrolls" ? tabOn : tabOff}`}
          >
            Заточки
          </button>
          <span className={isL2 ? "text-[#6b5c42] text-[10px]" : "text-gray-500 text-[10px]"}>|</span>
          <button
            onClick={() => {
              setSelectedCategory("exchange");
              setSelectedArmorSubcategory(null);
            }}
            className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap ${selectedCategory === "exchange" ? tabOn : tabOff}`}
          >
            Обменник
          </button>
        </div>

        {selectedCategory === "weapons" && (
          <div className="flex gap-1 mt-2 flex-nowrap overflow-x-auto">
            {[
              { id: "all" as const, name: "Все" },
              { id: "phys" as const, name: "Физ. оружие" },
              { id: "magic" as const, name: "Маг. оружие" },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setWeaponKindFilter(sub.id)}
                className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap flex-shrink-0 ${
                  weaponKindFilter === sub.id ? subTabOn : subTabOff
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Фільтри по грейдах (включно з тату/пояс/плащ у «Ітеми») */}
        {(selectedCategory === "weapons" || selectedCategory === "sets" || selectedCategory === "items" || selectedCategory === "enchant_scrolls") && (
          <div className="flex gap-2 mt-2">
            {["D", "C", "B", "A", "S"].map((grade) => {
              // Кольори для кожного грейду
              const getGradeColor = (g: string, isSelected: boolean) => {
                if (!isSelected) {
                  switch (g) {
                    case "D": return "text-white";
                    case "C": return "text-green-400";
                    case "B": return "text-blue-400";
                    case "A": return "text-purple-400";
                    case "S": return "text-orange-400";
                    default: return "text-gray-400";
                  }
                } else {
                  switch (g) {
                    case "D": return "text-white font-semibold";
                    case "C": return "text-green-300 font-semibold";
                    case "B": return "text-blue-300 font-semibold";
                    case "A": return "text-purple-300 font-semibold";
                    case "S": return "text-orange-300 font-semibold";
                    default: return "text-gray-300 font-semibold";
                  }
                }
              };

              return (
                <button
                  key={grade}
                  onClick={() => {
                    setSelectedGrade(grade);
                  }}
                  className={`px-2 py-0.5 text-[11px] transition-colors ${getGradeColor(grade, selectedGrade === grade)} ${
                    selectedGrade === grade ? "underline" : "hover:underline"
                  }`}
                >
                  {grade}
                </button>
              );
            })}
          </div>
        )}

        {/* Підкатегорії для броні */}
        {selectedCategory === "sets" && (
          <div className="flex gap-1 mt-2 flex-nowrap overflow-x-auto">
            {[
              { id: "helmet", name: "Шлем" },
              { id: "chest", name: "Торс" },
              { id: "legs", name: "Штани" },
              { id: "gloves", name: "Перчатки" },
              { id: "boots", name: "Сапоги" },
              { id: "shield", name: "Щити" },
            ].map((subcat) => (
              <button
                key={subcat.id}
                onClick={() => {
                  setSelectedArmorSubcategory(subcat.id);
                }}
                className={`px-1.5 py-0.5 text-[11px] whitespace-nowrap flex-shrink-0 ${
                  selectedArmorSubcategory === subcat.id ? subTabOn : subTabOff
                }`}
              >
                {subcat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Список предметів */}
      <div className={`px-4 py-2 ${borderB}`}>
        {selectedCategory === "exchange" ? (
          <div className="space-y-0">
            {/* Обмін на Адену */}
            <button
              onClick={() => {
                if (!hero) return;
                const coinCount = hero.coins_silver ?? 0;
                if (coinCount < QUEST_EXCHANGE_SILVER_PER_UNIT) {
                  showToast("Недостаточно Серебряных Монет!", "error");
                  return;
                }
                setExchangeQuantity(1);
                setConfirmExchange({ type: "adena", name: "Адена" });
              }}
              className={exchangeRow}
            >
              <div className="flex items-center gap-2">
                <img src="/items/drops/resources/aden.png" alt="Адена" className="w-5 h-5 object-contain" />
                <span className="text-[12px] text-[#e0c68a]">Адена</span>
                <span className="text-[12px] text-yellow-400 font-semibold">50,000</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-4 h-4 object-contain" />
                <span className="text-[12px] text-gray-400">10 Серебряных Монет</span>
              </div>
            </button>

            {/* Риска */}
            <div className={`text-center text-[12px] py-1 ${isL2 ? "text-[#6b5c42]" : "text-gray-500"}`}>─ ─ ─</div>

            {/* Обмін на EXP */}
            <button
              onClick={() => {
                if (!hero) return;
                const coinCount = hero.coins_silver ?? 0;
                if (coinCount < QUEST_EXCHANGE_SILVER_PER_UNIT) {
                  showToast("Недостаточно Серебряных Монет!", "error");
                  return;
                }
                setExchangeQuantity(1);
                setConfirmExchange({ type: "exp", name: "Опыт" });
              }}
              className={exchangeRow}
            >
              <div className="flex items-center gap-2">
                <img src="/items/drops/resources/exp_.png" alt="Опыт" className="w-5 h-5 object-contain" />
                <span className="text-[12px] text-[#e0c68a]">Опыт</span>
                <span className="text-[12px] text-green-400 font-semibold">100,000</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-4 h-4 object-contain" />
                <span className="text-[12px] text-gray-400">10 Серебряных Монет</span>
              </div>
            </button>

            {/* Риска */}
            <div className={`text-center text-[12px] py-1 ${isL2 ? "text-[#6b5c42]" : "text-gray-500"}`}>─ ─ ─</div>

            {/* Обмін на SP */}
            <button
              onClick={() => {
                if (!hero) return;
                const coinCount = hero.coins_silver ?? 0;
                if (coinCount < QUEST_EXCHANGE_SILVER_PER_UNIT) {
                  showToast("Недостаточно Серебряных Монет!", "error");
                  return;
                }
                setExchangeQuantity(1);
                setConfirmExchange({ type: "sp", name: "SP" });
              }}
              className={exchangeRow}
            >
              <div className="flex items-center gap-2">
                <img src="/items/drops/resources/sp_SP.png" alt="SP" className="w-5 h-5 object-contain" />
                <span className="text-[12px] text-[#e0c68a]">SP</span>
                <span className="text-[12px] text-blue-400 font-semibold">50,000</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-4 h-4 object-contain" />
                <span className="text-[12px] text-gray-400">10 Серебряных Монет</span>
              </div>
            </button>

            {/* Риска */}
            <div className={`text-center text-[12px] py-1 ${isL2 ? "text-[#6b5c42]" : "text-gray-500"}`}>─ ─ ─</div>

            {/* Обмін на Coin of Luck */}
            <button
              onClick={() => {
                if (!hero) return;
                const coinCount = hero.coins_silver ?? 0;
                if (coinCount < QUEST_EXCHANGE_SILVER_PER_UNIT) {
                  showToast("Недостаточно Серебряных Монет!", "error");
                  return;
                }
                setExchangeQuantity(1);
                setConfirmExchange({ type: "coinOfLuck", name: "Coin of Luck" });
              }}
              className={exchangeRow}
            >
              <div className="flex items-center gap-2">
                <img src="/items/drops/resources/monets.png" alt="Coin of Luck" className="w-5 h-5 object-contain" />
                <span className="text-[12px] text-[#e0c68a]">Coin of Luck</span>
                <span className="text-[12px] text-[#ffd700] font-semibold">1</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-4 h-4 object-contain" />
                <span className="text-[12px] text-gray-400">10 Серебряных Монет</span>
              </div>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-[#9f8d73] text-[12px] py-4">
            Предметы не найдены
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={
                  isL2
                    ? rowL2
                    : "flex items-center gap-2 py-1.5 border-b border-solid border-white/30 hover:bg-black/20"
                }
              >
                {/* Іконка */}
                <img
                  src={getItemIcon(item)}
                  alt={item.name}
                  className="w-8 h-8 object-contain flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                  }}
                />
                {/* Назва - клікабельна */}
                <div 
                  className="flex-1 text-[12px] text-[#e0c68a] cursor-pointer hover:text-[#f4e2b8]"
                  onClick={() => {
                    setSelectedItem(item);
                    setBuyQuantity(1);
                  }}
                >
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальне вікно з детальною інформацією */}
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
              Информация о предмете
            </div>

            {/* Іконка та назва */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={getItemIcon(selectedItem)}
                alt={selectedItem.name}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                }}
              />
              <div className="flex-1">
                <div className="text-white text-base font-semibold">
                  {selectedItem.name} [{selectedItem.grade}]
                </div>
              </div>
            </div>

            {/* Стати — з ShopItem або itemsDB */}
            {(() => {
              const itemsDBId = getItemsDBId(selectedItem);
              const itemDef = itemsDBId ? (itemsDB[itemsDBId] || itemsDBWithStarter[itemsDBId]) : null;
              const displayStats = selectedItem.stats ?? itemDef?.stats;
              const isWeapon = itemDef?.kind === "weapon" || selectedItem.type === "weapon";
              const gradeForAcc = itemDef?.grade ?? selectedItem.grade ?? (itemsDBId ? autoDetectGrade(itemsDBId) : null);
              const weaponAccBonus = isWeapon ? getWeaponAccuracyBonusByGrade(gradeForAcc) : 0;
              if (!displayStats && weaponAccBonus <= 0) return null;
              return (
                <div className="space-y-1 mb-4 text-[12px]">
                  {displayStats?.pAtk !== undefined && (
                    <div className="text-orange-400">Физ. атк: {displayStats.pAtk}</div>
                  )}
                  {displayStats?.mAtk !== undefined && (
                    <div className="text-green-400">Маг. атк: {displayStats.mAtk}</div>
                  )}
                  {displayStats?.pDef !== undefined && (
                    <div className="text-yellow-400">Физ. защ: {displayStats.pDef}</div>
                  )}
                  {displayStats?.mDef !== undefined && (
                    <div className="text-purple-400">Маг. защ: {displayStats.mDef}</div>
                  )}
                  {displayStats?.rCrit !== undefined && (
                    <div className="text-purple-400">Крит: {displayStats.rCrit}</div>
                  )}
                  {displayStats && typeof (displayStats as { critPower?: number }).critPower === "number" && (
                    <div className="text-rose-300">Сила крита: {(displayStats as { critPower: number }).critPower}</div>
                  )}
                  {displayStats?.pAtkSpd !== undefined && (
                    <div className="text-yellow-400">Скорость боя: {displayStats.pAtkSpd}</div>
                  )}
                  {displayStats?.castSpeed !== undefined && (
                    <div className="text-cyan-400">Скорость каста: {displayStats.castSpeed}</div>
                  )}
                  {displayStats?.maxHp !== undefined && (
                    <div className="text-red-400">Max HP: +{displayStats.maxHp}</div>
                  )}
                  {displayStats?.maxHpPercent !== undefined && (
                    <div className="text-red-400">Max HP: +{displayStats.maxHpPercent}%</div>
                  )}
                  {displayStats?.pDefPercent !== undefined && (
                    <div className="text-yellow-400">Физ. защ: +{displayStats.pDefPercent}%</div>
                  )}
                  {displayStats?.mDefPercent !== undefined && (
                    <div className="text-purple-400">Маг. защ: +{displayStats.mDefPercent}%</div>
                  )}
                  {displayStats?.pAtkPercent !== undefined && (
                    <div className="text-orange-400">Физ. урон: +{displayStats.pAtkPercent}%</div>
                  )}
                  {displayStats?.mAtkPercent !== undefined && (
                    <div className="text-blue-400">Маг. урон: +{displayStats.mAtkPercent}%</div>
                  )}
                  {weaponAccBonus > 0 && (
                    <div className="text-sky-300">Точність: +{weaponAccBonus}</div>
                  )}
                </div>
              );
            })()}

            {/* Тип зброї */}
            {selectedItem.weaponType && (
              <div className="text-gray-300 text-[12px] mb-2">
                Тип оружия: {selectedItem.weaponType === "SWORD" ? "Меч" : 
                            selectedItem.weaponType === "BLUNT" ? "Булава" :
                            selectedItem.weaponType === "BIGBLUNT" ? "Посох" :
                            selectedItem.weaponType === "DAGGER" ? "Кинджал" :
                            selectedItem.weaponType === "BOW" ? "Лук" :
                            selectedItem.weaponType === "POLE" ? "Спис" :
                            selectedItem.weaponType === "DUALSWORD" ? "Дуальні Мечі" :
                            selectedItem.weaponType}
              </div>
            )}

            {/* Soulshots/Spiritshots - тільки для зброї */}
            {selectedItem.type === "weapon" && (
              <>
                {selectedItem.soulshots !== undefined && (
                  <div className="text-gray-300 text-[12px] mb-1">
                    Soulshots: {selectedItem.soulshots}
                  </div>
                )}
                {selectedItem.spiritshots !== undefined && (
                  <div className="text-gray-300 text-[12px] mb-1">
                    Spiritshots: {selectedItem.spiritshots}
                  </div>
                )}
              </>
            )}

            {/* Опис предмета */}
            {selectedItem.description && (
              <div className="text-gray-300 text-[12px] mb-2 italic">
                {selectedItem.description}
              </div>
            )}

            {/* Інформація про сет */}
            {getSetInfo(selectedItem) && (
              <div className="text-yellow-400 text-[12px] mb-2 border-t border-white/50 pt-2">
                <SetBonusDisplay text={getSetInfo(selectedItem)!} />
              </div>
            )}

            {/* Складування */}
            <div className="text-white text-[12px] mb-2">
              Не складывается
            </div>

            {/* Ціни */}
            <div className="text-yellow-400 text-[12px] mb-1 flex items-center gap-1">
              Цена: {selectedItem.price} 
              <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-3 h-3 object-contain" />
            </div>

            {/* ID предмета */}
            <div className="text-white text-[12px] mb-4 border-t border-white/50 pt-2">
              ID предмета: {selectedItem.itemId}
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
                Итого: {selectedItem.price * buyQuantity} 
                <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="Серебряные Монеты" className="w-3 h-3 object-contain" />
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  void handleBuy(selectedItem, buyQuantity);
                }}
                disabled={buyBusy}
                className="text-green-400 text-[12px] py-2 hover:text-green-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buyBusy ? "..." : "Купить"}
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 text-[12px] py-2 hover:text-gray-300 cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно підтвердження обміну */}
      {confirmExchange && hero && (() => {
        const maxExchanges = Math.max(1, Math.floor((hero.coins_silver ?? 0) / QUEST_EXCHANGE_SILVER_PER_UNIT));
        const q = Math.min(Math.max(1, exchangeQuantity), maxExchanges);
        const silverTotal = QUEST_EXCHANGE_SILVER_PER_UNIT * q;
        const perUnit = QUEST_EXCHANGE_REWARD_PER_UNIT[confirmExchange.type];
        const rewardTotal = perUnit * q;
        const rewardLabel =
          confirmExchange.type === "coinOfLuck"
            ? `${rewardTotal.toLocaleString()} шт.`
            : rewardTotal.toLocaleString("ru-RU");
        return (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setConfirmExchange(null);
              setExchangeQuantity(1);
            }}
          >
            <div className={`${modalPanel} max-w-[380px]`} onClick={(e) => e.stopPropagation()}>
              <div className="text-center text-gray-400 text-[14px] mb-3">
                Обменять серебро на {confirmExchange.name}
              </div>
              <div className="text-center text-[#e0c68a] text-[12px] mb-3">
                Курс: {perUnit.toLocaleString("ru-RU")}
                {confirmExchange.type === "coinOfLuck" ? " шт." : ""} за {QUEST_EXCHANGE_SILVER_PER_UNIT}{" "}
                <span className="inline-flex items-center gap-0.5 align-middle">
                  <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="" className="w-3 h-3 object-contain" />
                </span>
              </div>

              <div className="mb-3 border-t border-white/20 pt-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-white text-[12px]">Количество обменов:</span>
                  <button
                    type="button"
                    onClick={() => setExchangeQuantity((n) => Math.max(1, n - 1))}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-[12px] hover:bg-[#2a1a10]"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={maxExchanges}
                    value={q}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.startsWith("0") && val.length > 1) {
                        val = val.replace(/^0+/, "") || "1";
                      }
                      const numVal = parseInt(val, 10);
                      if (!Number.isFinite(numVal)) {
                        setExchangeQuantity(1);
                        return;
                      }
                      setExchangeQuantity(Math.min(Math.max(1, numVal), maxExchanges));
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-16 px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-center text-[12px]"
                  />
                  <button
                    type="button"
                    onClick={() => setExchangeQuantity((n) => Math.min(maxExchanges, n + 1))}
                    className="px-2 py-1 bg-[#1a1208] text-white border border-white/50 rounded text-[12px] hover:bg-[#2a1a10]"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setExchangeQuantity(maxExchanges)}
                    className="px-2 py-1 bg-[#1a1208] text-[#ffd78c] border border-[#6b5c42] rounded text-[11px] hover:bg-[#2a1a10]"
                  >
                    Макс.
                  </button>
                </div>
                <div className="text-center text-yellow-400/90 text-[12px]">
                  Списать: {silverTotal.toLocaleString("ru-RU")}{" "}
                  <span className="inline-flex items-center gap-0.5 align-middle">
                    <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="" className="w-3 h-3 object-contain" />
                  </span>
                </div>
                <div className="text-center text-green-400/90 text-[12px] mt-1">
                  Получите: {rewardLabel} {confirmExchange.name}
                </div>
              </div>

              <div className="flex justify-center gap-4 pt-1">
                <button
                  type="button"
                  disabled={exchangeBusy || !characterId}
                  onClick={() => {
                    void (async () => {
                      if (!hero || exchangeBusy) return;
                      const coinCount = hero.coins_silver ?? 0;
                      const qty = Math.min(
                        Math.max(1, exchangeQuantity),
                        Math.floor(coinCount / QUEST_EXCHANGE_SILVER_PER_UNIT)
                      );
                      const cost = QUEST_EXCHANGE_SILVER_PER_UNIT * qty;
                      if (!characterId) {
                        showToast("Нет персонажа — войдите в игру.", "error");
                        return;
                      }
                      if (coinCount < cost || qty < 1) {
                        showToast("Недостаточно Серебряных Монет!", "error");
                        return;
                      }
                      const hj: any = (hero as any).heroJson;
                      const expectedRevisionRaw =
                        hj != null && typeof hj.heroRevision === "number"
                          ? Number(hj.heroRevision)
                          : Number(useHeroStore.getState().serverState?.heroRevision ?? 0);
                      const expectedRevision =
                        Number.isFinite(expectedRevisionRaw) && expectedRevisionRaw >= 0 ? expectedRevisionRaw : 0;
                      setExchangeBusy(true);
                      try {
                        const res = await postQuestShopExchange(characterId, {
                          kind: confirmExchange.type,
                          quantity: qty,
                          expectedRevision,
                        });
                        applyCharacterSnapshotFromApi((res as any).character);
                        showToast("Обмен выполнен.", "success");
                        setConfirmExchange(null);
                        setExchangeQuantity(1);
                      } catch (e: any) {
                        const st = e?.status;
                        if (st === 409) {
                          showToast("Данные персонажа устарели. Обновите страницу (F5).", "error");
                        } else if (st === 400) {
                          showToast("Недостаточно Серебряных Монет или неверный запрос.", "error");
                        } else {
                          showToast(e?.message || "Не удалось выполнить обмен.", "error");
                        }
                      } finally {
                        setExchangeBusy(false);
                      }
                    })();
                  }}
                  className="text-[#ff8c00] text-[12px] hover:text-[#ffa500] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exchangeBusy ? "…" : "Подтвердить"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmExchange(null);
                    setExchangeQuantity(1);
                  }}
                  className="text-gray-400 text-[12px] hover:text-gray-300 cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
}

