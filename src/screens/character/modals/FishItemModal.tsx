import React, { useState } from "react";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { useHeroStore } from "../../../state/heroStore";
import type { ItemDefinition } from "../../../data/items/itemsDB.types";
import FishingCatchInfoModal from "./FishingCatchInfoModal";
import { NG_GRADE_SHOP_ITEMS } from "../../../data/shop/ngGradeShop";
import { D_GRADE_SHOP_ITEMS } from "../../../data/shop/dGradeShop";
import { C_GRADE_SHOP_ITEMS } from "../../../data/shop/cGradeShop";
import { B_GRADE_SHOP_ITEMS } from "../../../data/shop/bGradeShop";
import { A_GRADE_SHOP_ITEMS } from "../../../data/shop/aGradeShop";
import { S_GRADE_SHOP_ITEMS } from "../../../data/shop/sGradeShop";
import { QUEST_SHOP_WEAPONS, QUEST_SHOP_SETS, QUEST_SHOP_ACCESSORIES } from "../../../data/shop/questShop";
import { CONSUMABLES_SHOP_ITEMS } from "../../../data/shop/consumablesShop";
import { SHOP_ITEM_ID_MAPPING } from "../../../data/shop/itemMappings";
import { addItemsWithOverflow } from "../../../state/heroStore/inventoryOverflow";
import { saveHeroToLocalStorage } from "../../../state/heroStore/heroPersistence";

interface FishItemModalProps {
  item: HeroInventoryItem;
  hero: Hero;
  onClose: () => void;
  onDelete: (amount: number) => void;
  onTransfer: (amount: number) => void;
  updateHero: (partial: Partial<Hero>) => void;
}

const CURRENCY_IDS = new Set(["adena", "coin_of_luck", "coins_silver", "ancient_adena", "coin_of_fair"]);

const STAT_LABELS: Record<string, string> = {
  pAtk: "Физ. атака",
  mAtk: "Маг. атака",
  rCrit: "Крит",
  pAtkSpd: "Швидкість бою",
  castSpeed: "Швидкість касту",
  pDef: "Физ. захист",
  mDef: "Маг. захист",
  maxHp: "Max HP",
  maxMp: "Max MP",
  maxCp: "Max CP",
  maxHpPercent: "Max HP %",
  maxMpPercent: "Max MP %",
  pDefPercent: "Физ. захист %",
  mDefPercent: "Маг. захист %",
  pAtkPercent: "Физ. атака %",
  mAtkPercent: "Маг. атака %",
  STR: "STR",
  DEX: "DEX",
  CON: "CON",
  INT: "INT",
  WIT: "WIT",
  MEN: "MEN",
};

function renderStatsBlock(stats: Record<string, unknown>) {
  const entries = Object.entries(stats).filter(
    ([, v]) => v !== undefined && v !== null && (typeof v === "number" || typeof v === "string")
  ) as [string, number | string][];
  if (entries.length === 0) return null;
  return (
    <div className="pl-7 space-y-0.5 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between">
          <span className="text-gray-400">{STAT_LABELS[key] || key}:</span>
          <span className="text-yellow-300">{typeof value === "number" && value >= 0 ? `+${value}` : String(value)}</span>
        </div>
      ))}
    </div>
  );
}

// Всі види ресурсів (без риби, квестових, валют та заточок)
function getAllResources(): ItemDefinition[] {
  const resources: ItemDefinition[] = [];
  Object.values(itemsDB).forEach((item) => {
    if (
      item.kind === "resource" &&
      !item.id.startsWith("fish_") &&
      !item.id.startsWith("quest_") &&
      !item.id.includes("enchant_weapon_scroll") &&
      !item.id.includes("enchant_armor_scroll") &&
      !item.id.includes("blessed_scroll_enchant") &&
      item.slot !== "quest" &&
      !CURRENCY_IDS.has(item.id)
    ) {
      resources.push(item);
    }
  });
  return resources;
}

// Зброя, броня, бижутерія з простого магазину
function getShopWeaponIds(): string[] {
  return getShopIdsByType("weapon");
}
function getShopArmorIds(): string[] {
  return getShopIdsByType("armor");
}

function getShopIdsByType(type: string): string[] {
  const allShop = [
    ...NG_GRADE_SHOP_ITEMS,
    ...D_GRADE_SHOP_ITEMS,
    ...C_GRADE_SHOP_ITEMS,
    ...B_GRADE_SHOP_ITEMS,
    ...A_GRADE_SHOP_ITEMS,
    ...S_GRADE_SHOP_ITEMS,
  ];
  const ids: string[] = [];
  allShop.forEach((shopItem) => {
    if (shopItem.type !== type) return;
    const id = SHOP_ITEM_ID_MAPPING[shopItem.itemId as keyof typeof SHOP_ITEM_ID_MAPPING];
    if (id && itemsDB[id]) ids.push(id);
  });
  return ids;
}

// Зброя/броня/бижутерія згруповані по грейду (звичайний магазин + квест-шоп)
function getShopIdsByTypeAndGrade(type: string): Record<string, string[]> {
  const allShop = [
    { items: D_GRADE_SHOP_ITEMS, grade: "D" },
    { items: C_GRADE_SHOP_ITEMS, grade: "C" },
    { items: B_GRADE_SHOP_ITEMS, grade: "B" },
    { items: A_GRADE_SHOP_ITEMS, grade: "A" },
    { items: S_GRADE_SHOP_ITEMS, grade: "S" },
  ];
  const questItems = [
    ...QUEST_SHOP_WEAPONS,
    ...QUEST_SHOP_SETS,
    ...QUEST_SHOP_ACCESSORIES,
  ];
  const byGrade: Record<string, string[]> = {};

  allShop.forEach(({ items, grade }) => {
    const ids: string[] = [];
    items.forEach((shopItem: any) => {
      if (shopItem.type !== type) return;
      const id = SHOP_ITEM_ID_MAPPING[shopItem.itemId as keyof typeof SHOP_ITEM_ID_MAPPING];
      if (id && itemsDB[id]) ids.push(id);
    });
    if (ids.length > 0) byGrade[grade] = ids;
  });

  questItems.forEach((shopItem: any) => {
    if (shopItem.type !== type) return;
    const grade = shopItem.grade || "D";
    const id = shopItem.id;
    if (id && itemsDB[id]) {
      if (!byGrade[grade]) byGrade[grade] = [];
      if (!byGrade[grade].includes(id)) byGrade[grade].push(id);
    }
  });

  return byGrade;
}

// Шанси за грейд для зброї/броні/біжутерії: D/C 0.7%, B/A/S 0.1%
const GRADE_CHANCE: Record<string, number> = { D: 0.7, C: 0.7, B: 0.1, A: 0.1, S: 0.1 };

// Заточки по грейду (для дропу з риби) — категорія «Заточки»
const ENCHANT_SCROLLS_BY_GRADE: Record<string, string[]> = {
  D: ["d_enchant_weapon_scroll", "d_enchant_armor_scroll"],
  C: ["c_enchant_weapon_scroll", "c_enchant_armor_scroll"],
  B: ["b_enchant_weapon_scroll", "b_enchant_armor_scroll"],
  A: ["a_enchant_weapon_scroll", "a_enchant_armor_scroll"],
  S: ["s_enchant_weapon_scroll", "s_enchant_armor_scroll"],
};

// Розділка риби: зброя, броня, бижутерія — шанс за 10 риб; ресурси, скарбничка, заточки — за 1 рибу.
function processFishDrop(fishCount: number): {
  adena: number;
  coinOfLuck: number;
  coinsSilver: number;
  weapons: Array<{ id: string; count: number }>;
  armorPieces: Array<{ id: string; count: number }>;
  jewelryPieces: Array<{ id: string; count: number }>;
  resources: Array<{ id: string; count: number }>;
  enchantScrolls: Array<{ id: string; count: number }>;
} {
  let totalAdena = 0;
  let totalCoinOfLuck = 0;
  let totalCoinsSilver = 0;
  const weapons: Record<string, number> = {};
  const armorPieces: Record<string, number> = {};
  const jewelryPieces: Record<string, number> = {};
  const resources: Record<string, number> = {};
  const enchantScrolls: Record<string, number> = {};

  const allResources = getAllResources();
  const weaponsByGrade = getShopIdsByTypeAndGrade("weapon");
  const armorByGrade = getShopIdsByTypeAndGrade("armor");
  const jewelryByGrade = getShopIdsByTypeAndGrade("jewelry");

  // Зброя, броня і бижутерія — шанс за 10 риб (не за 1), як оружие
  const batchesOf10 = Math.floor(fishCount / 10);
  for (let b = 0; b < batchesOf10; b++) {
    (["D", "C", "B", "A", "S"] as const).forEach((grade) => {
      const chance = GRADE_CHANCE[grade];
      const weaponIds = weaponsByGrade[grade];
      const armorIds = armorByGrade[grade];
      const jewelryIds = jewelryByGrade[grade];
      if (weaponIds?.length && Math.random() * 100 < chance) {
        const id = weaponIds[Math.floor(Math.random() * weaponIds.length)];
        weapons[id] = (weapons[id] || 0) + 1;
      }
      if (armorIds?.length && Math.random() * 100 < chance) {
        const id = armorIds[Math.floor(Math.random() * armorIds.length)];
        armorPieces[id] = (armorPieces[id] || 0) + 1;
      }
      if (jewelryIds?.length && Math.random() * 100 < chance) {
        const id = jewelryIds[Math.floor(Math.random() * jewelryIds.length)];
        jewelryPieces[id] = (jewelryPieces[id] || 0) + 1;
      }
    });
  }

  // Ресурси (без кристалів/LS), скарбничка, заточки — за 1 рибу
  for (let i = 0; i < fishCount; i++) {
    allResources.forEach((res) => {
      if (res.id.startsWith("crystal_")) return; // Кристали та LS не дропають з риби
      if (Math.random() * 100 < 0.8) resources[res.id] = (resources[res.id] || 0) + 1;
    });
    if (Math.random() * 100 < 0.3) resources["treasure_box"] = (resources["treasure_box"] || 0) + 1;
    // Заточки (точки) — 0.4% за рибу, D/C частіше
    if (Math.random() * 100 < 0.4) {
      const grade = Math.random() < 0.7 ? "D" : "C";
      const scrolls = ENCHANT_SCROLLS_BY_GRADE[grade];
      if (scrolls?.length) {
        const id = scrolls[Math.floor(Math.random() * scrolls.length)];
        if (itemsDB[id]) enchantScrolls[id] = (enchantScrolls[id] || 0) + 1;
      }
    }
  }

  return {
    adena: totalAdena,
    coinOfLuck: totalCoinOfLuck,
    coinsSilver: totalCoinsSilver,
    weapons: Object.entries(weapons).map(([id, count]) => ({ id, count })),
    armorPieces: Object.entries(armorPieces).map(([id, count]) => ({ id, count })),
    jewelryPieces: Object.entries(jewelryPieces).map(([id, count]) => ({ id, count })),
    resources: Object.entries(resources).map(([id, count]) => ({ id, count })),
    enchantScrolls: Object.entries(enchantScrolls).map(([id, count]) => ({ id, count })),
  };
}

export default function FishItemModal({
  item,
  hero,
  onClose,
  onDelete,
  onTransfer,
  updateHero,
}: FishItemModalProps) {
  const maxCount = item.count ?? 1;
  const [transferAmount, setTransferAmount] = useState(1);
  const [deleteAmount, setDeleteAmount] = useState(1);
  const [dismantleAmount, setDismantleAmount] = useState(1);
  const [showDismantleResult, setShowDismantleResult] = useState(false);
  const [dismantleResult, setDismantleResult] = useState<ReturnType<typeof processFishDrop> | null>(null);
  const [showCatchInfoModal, setShowCatchInfoModal] = useState(false);

  const handleTransfer = () => {
    if (transferAmount < 1 || transferAmount > maxCount) return;
    onTransfer(transferAmount);
  };

  const handleDelete = () => {
    if (deleteAmount < 1 || deleteAmount > maxCount) return;
    onDelete(deleteAmount);
  };

  const handleDismantle = () => {
    if (dismantleAmount < 1 || dismantleAmount > maxCount) return;

    const currentHero = useHeroStore.getState().hero;
    if (!currentHero) return;

    const inventory = currentHero.inventory || [];
    const invItem = inventory.find((i: HeroInventoryItem) => i.id === item.id);
    if (!invItem || (invItem.count ?? 0) < dismantleAmount) return;

    // Обробляємо розділку
    const result = processFishDrop(dismantleAmount);

    // Оновлюємо інвентар: видаляємо рибу
    const inventoryAfterFish = inventory.map((i: HeroInventoryItem) => {
      if (i.id === item.id) {
        const newCount = (i.count ?? 1) - dismantleAmount;
        return newCount > 0 ? { ...i, count: newCount } : null;
      }
      return i;
    }).filter(Boolean) as HeroInventoryItem[];

    const newAdena = (currentHero.adena || 0) + result.adena;
    const newCoinOfLuck = (currentHero.coinOfLuck ?? 0) + (result.coinOfLuck ?? 0);
    const newCoinsSilver = (currentHero.coins_silver ?? (currentHero as any).coinsSilver ?? 0) + (result.coinsSilver ?? 0);

    // Збираємо предмети для додавання (з overflow-логікою)
    const itemsToAdd: HeroInventoryItem[] = [];
    result.jewelryPieces.forEach(({ id, count }) => {
      const itemDef = itemsDB[id];
      if (itemDef) {
        for (let i = 0; i < count; i++) {
          itemsToAdd.push({ id, name: itemDef.name, type: itemDef.kind ?? "jewelry", slot: itemDef.slot, icon: itemDef.icon, description: itemDef.description, stats: itemDef.stats, count: 1 });
        }
      }
    });
    result.weapons.forEach(({ id, count }) => {
      const itemDef = itemsDB[id];
      if (itemDef) {
        for (let i = 0; i < count; i++) {
          itemsToAdd.push({ id, name: itemDef.name, type: itemDef.kind ?? "weapon", slot: itemDef.slot, icon: itemDef.icon, description: itemDef.description, stats: itemDef.stats, count: 1 });
        }
      }
    });
    result.armorPieces.forEach(({ id, count }) => {
      const itemDef = itemsDB[id];
      if (itemDef) {
        for (let i = 0; i < count; i++) {
          itemsToAdd.push({ id, name: itemDef.name, type: itemDef.kind ?? "armor", slot: itemDef.slot, icon: itemDef.icon, description: itemDef.description, stats: itemDef.stats, count: 1 });
        }
      }
    });
    result.resources.forEach(({ id, count }) => {
      const itemDef = itemsDB[id];
      if (itemDef) {
        itemsToAdd.push({
          id,
          name: itemDef.name,
          type: itemDef.kind ?? "resource",
          slot: itemDef.slot,
          icon: itemDef.icon,
          description: itemDef.description,
          stats: itemDef.stats,
          count,
        });
      }
    });
    (result.enchantScrolls || []).forEach(({ id, count }) => {
      const itemDef = itemsDB[id];
      if (itemDef) {
        itemsToAdd.push({
          id,
          name: itemDef.name,
          type: itemDef.kind ?? "resource",
          slot: itemDef.slot,
          icon: itemDef.icon,
          description: itemDef.description,
          count,
        });
      }
    });

    const heroForOverflow = { ...currentHero, inventory: inventoryAfterFish, overflowChest: currentHero.overflowChest ?? [] };
    const { inventory: finalInventory, overflowChest: finalOverflow } = addItemsWithOverflow(heroForOverflow, itemsToAdd);

    updateHero({
      adena: newAdena,
      coinOfLuck: newCoinOfLuck,
      coins_silver: newCoinsSilver,
      inventory: finalInventory,
      overflowChest: finalOverflow,
    });

    // Миттєво запускаємо збереження на сервер — щоб дроп не відкатував після F5
    const heroToSave = useHeroStore.getState().hero;
    if (heroToSave) saveHeroToLocalStorage(heroToSave).catch(() => {});

    // Показуємо результат
    setDismantleResult(result);
    setShowDismantleResult(true);
  };

  const itemDef = itemsDB[item.id];

  if (showDismantleResult && dismantleResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => { setShowDismantleResult(false); setDismantleResult(null); onClose(); }}>
        <div
          className="bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#b8860b]">Результат розділки</h2>
            <button
              className="text-gray-400 hover:text-white text-xl"
              onClick={() => { setShowDismantleResult(false); setDismantleResult(null); onClose(); }}
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-xs mb-4">
            {dismantleResult.adena > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Адена:</span>
                <span className="text-yellow-400">{dismantleResult.adena.toLocaleString()}</span>
              </div>
            )}
            {((dismantleResult as { coinOfLuck?: number }).coinOfLuck ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Coin of Luck:</span>
                <span className="text-[#e0c68a]">+{(dismantleResult as { coinOfLuck?: number }).coinOfLuck}</span>
              </div>
            )}
            {((dismantleResult as { coinsSilver?: number }).coinsSilver ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Серебряные Монеты:</span>
                <span className="text-gray-300">+{(dismantleResult as { coinsSilver?: number }).coinsSilver}</span>
              </div>
            )}

            {dismantleResult.weapons.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-[#b8860b] mb-2">Зброя:</div>
                <div className="space-y-2">
                  {dismantleResult.weapons.map(({ id, count }) => {
                    const weaponDef = itemsDB[id];
                    const stats = weaponDef?.stats || {};
                    return (
                      <div key={id} className="border border-white/50 rounded p-2 bg-[#1a1a1a]">
                        <div className="flex items-center gap-2 mb-1">
                          {weaponDef?.icon && (
                            <img
                              src={weaponDef.icon.startsWith("/") ? weaponDef.icon : `/items/${weaponDef.icon}`}
                              alt={weaponDef.name}
                              className="w-5 h-5 object-contain"
                            />
                          )}
                          <span className="text-gray-300 font-semibold">{weaponDef?.name || id}</span>
                          <span className="text-green-400 ml-auto">x{count}</span>
                        </div>
                        {renderStatsBlock(stats)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dismantleResult.jewelryPieces.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-[#b8860b] mb-2">Бижутерия:</div>
                <div className="space-y-2">
                  {dismantleResult.jewelryPieces.map(({ id, count }) => {
                    const jewelryDef = itemsDB[id];
                    const stats = jewelryDef?.stats || {};
                    return (
                      <div key={id} className="border border-white/50 rounded p-2 bg-[#1a1a1a]">
                        <div className="flex items-center gap-2 mb-1">
                          {jewelryDef?.icon && (
                            <img
                              src={jewelryDef.icon.startsWith("/") ? jewelryDef.icon : `/items/${jewelryDef.icon}`}
                              alt={jewelryDef.name}
                              className="w-5 h-5 object-contain"
                            />
                          )}
                          <span className="text-gray-300 font-semibold">{jewelryDef?.name || id}</span>
                          <span className="text-green-400 ml-auto">x{count}</span>
                        </div>
                        {renderStatsBlock(stats)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dismantleResult.armorPieces.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-[#b8860b] mb-2">Частинки броні:</div>
                <div className="space-y-2">
                  {dismantleResult.armorPieces.map(({ id, count }) => {
                    const armorDef = itemsDB[id];
                    const stats = armorDef?.stats || {};
                    return (
                      <div key={id} className="border border-white/50 rounded p-2 bg-[#1a1a1a]">
                        <div className="flex items-center gap-2 mb-1">
                          {armorDef?.icon && (
                            <img
                              src={armorDef.icon.startsWith("/") ? armorDef.icon : `/items/${armorDef.icon}`}
                              alt={armorDef.name}
                              className="w-5 h-5 object-contain"
                            />
                          )}
                          <span className="text-gray-300 font-semibold">{armorDef?.name || id}</span>
                          <span className="text-green-400 ml-auto">x{count}</span>
                        </div>
                        {renderStatsBlock(stats)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dismantleResult.resources.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-[#b8860b] mb-2">Ресурси:</div>
                <div className="space-y-1">
                  {dismantleResult.resources.map(({ id, count }) => {
                      const resourceDef = itemsDB[id];
                      return (
                        <div key={id} className="flex items-center gap-2">
                          {resourceDef?.icon && (
                            <img
                              src={resourceDef.icon.startsWith("/") ? resourceDef.icon : `/items/${resourceDef.icon}`}
                              alt={resourceDef.name}
                              className="w-5 h-5 object-contain"
                            />
                          )}
                          <span className="text-gray-400">{resourceDef?.name || id}:</span>
                          <span className="text-green-400">x{count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {(dismantleResult.enchantScrolls?.length ?? 0) > 0 && (
              <div>
                <div className="text-sm font-semibold text-[#b8860b] mb-2">Заточки:</div>
                <div className="space-y-1">
                  {dismantleResult.enchantScrolls!.map(({ id, count }) => {
                    const scrollDef = itemsDB[id];
                    return (
                      <div key={id} className="flex items-center gap-2">
                        {scrollDef?.icon && (
                          <img
                            src={scrollDef.icon.startsWith("/") ? scrollDef.icon : `/items/${scrollDef.icon}`}
                            alt={scrollDef.name}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className="text-gray-400">{scrollDef?.name || id}:</span>
                        <span className="text-green-400">x{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dismantleResult.adena === 0 &&
              ((dismantleResult as { coinOfLuck?: number }).coinOfLuck ?? 0) === 0 &&
              ((dismantleResult as { coinsSilver?: number }).coinsSilver ?? 0) === 0 &&
              dismantleResult.weapons.length === 0 &&
              dismantleResult.armorPieces.length === 0 &&
              dismantleResult.jewelryPieces.length === 0 &&
              dismantleResult.resources.length === 0 &&
              (dismantleResult.enchantScrolls?.length ?? 0) === 0 && (
                <div className="text-gray-400 text-center py-4">Нічого не випало</div>
              )}
          </div>

          <div className="flex justify-center pt-2 border-t border-white/50">
            <button
              onClick={() => { setShowDismantleResult(false); setDismantleResult(null); onClose(); }}
              className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#b8860b]">{item.name}</h2>
          <button
            className="text-gray-400 hover:text-white text-xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-3 text-xs mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Кількість:</span>
            <span className="text-green-400">{maxCount}</span>
          </div>
          {itemDef?.description && (
            <div>
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Опис:</div>
              <div className="text-gray-300">{itemDef.description}</div>
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Шанси дропу:</div>
            <div className="text-gray-400 text-[11px] space-y-0.5">
              <div>Зброя/Броня — за 10 риб: D/C 0.7%, B/A/S 0.1%</div>
              <div>Бижутерія/Ресурси/Скарбничка — за 1 рибу: як було</div>
              <div>Заточки — за 1 рибу: 0.4% (D/C)</div>
            </div>
            <button
              onClick={() => setShowCatchInfoModal(true)}
              className="mt-2 py-1.5 px-2 rounded border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/20 text-[11px]"
            >
              Информация об улове
            </button>
            {showCatchInfoModal && <FishingCatchInfoModal onClose={() => setShowCatchInfoModal(false)} />}
          </div>
        </div>

        <div className="border-t border-white/50 pt-2 mt-2 mb-4 space-y-3">
          <div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Передати:</div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={maxCount}
                value={transferAmount}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.startsWith("0") && val.length > 1) {
                    val = val.replace(/^0+/, "") || "1";
                  }
                  const numVal = parseInt(val) || 1;
                  setTransferAmount(Math.max(1, Math.min(maxCount, numVal)));
                }}
                onFocus={(e) => e.target.select()}
                className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/50 text-white rounded text-xs"
              />
              <button
                onClick={handleTransfer}
                className="px-3 py-1 text-xs text-[#b8860b] hover:text-[#d4af37] bg-[#2a2a2a] rounded"
              >
                Передати
              </button>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Удалити:</div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={maxCount}
                value={deleteAmount}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.startsWith("0") && val.length > 1) {
                    val = val.replace(/^0+/, "") || "1";
                  }
                  const numVal = parseInt(val) || 1;
                  setDeleteAmount(Math.max(1, Math.min(maxCount, numVal)));
                }}
                onFocus={(e) => e.target.select()}
                className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/50 text-white rounded text-xs"
              />
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-xs text-red-400 hover:text-red-300 bg-[#2a2a2a] rounded"
              >
                Удалить
              </button>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Разделать:</div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={maxCount}
                value={dismantleAmount}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.startsWith("0") && val.length > 1) {
                    val = val.replace(/^0+/, "") || "1";
                  }
                  const numVal = parseInt(val) || 1;
                  setDismantleAmount(Math.max(1, Math.min(maxCount, numVal)));
                }}
                onFocus={(e) => e.target.select()}
                className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/50 text-white rounded text-xs"
              />
              <button
                onClick={handleDismantle}
                className="px-3 py-1 text-xs text-blue-400 hover:text-blue-300 bg-[#2a2a2a] rounded"
              >
                Разделать
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2 border-t border-white/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
