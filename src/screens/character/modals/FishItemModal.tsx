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

interface FishItemModalProps {
  item: HeroInventoryItem;
  hero: Hero;
  onClose: () => void;
  onDelete: (amount: number) => void;
  onTransfer: (amount: number) => void;
  updateHero: (partial: Partial<Hero>) => void;
}

const CURRENCY_IDS = new Set(["adena", "coin_of_luck", "coins_silver", "ancient_adena", "coin_of_fair"]);

// Всі види ресурсів (без риби, квестових, валют)
function getAllResources(): ItemDefinition[] {
  const resources: ItemDefinition[] = [];
  Object.values(itemsDB).forEach((item) => {
    if (
      item.kind === "resource" &&
      !item.id.startsWith("fish_") &&
      !item.id.startsWith("quest_") &&
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

// Шанси за грейд для зброї/броні/біжутерії: D/C без змін, B/A/S — 0.1%
const GRADE_CHANCE: Record<string, number> = { D: 0.7, C: 0.7, B: 0.1, A: 0.1, S: 0.1 };

// Розділка риби: B/A/S зброя/броня/бижутерія 0.1%, ресурси 0.8%, скарбничка 0.3%. Без адени, коінів, срібних монет.
function processFishDrop(fishCount: number): {
  adena: number;
  coinOfLuck: number;
  coinsSilver: number;
  weapons: Array<{ id: string; count: number }>;
  armorPieces: Array<{ id: string; count: number }>;
  jewelryPieces: Array<{ id: string; count: number }>;
  resources: Array<{ id: string; count: number }>;
} {
  let totalAdena = 0;
  let totalCoinOfLuck = 0;
  let totalCoinsSilver = 0;
  const weapons: Record<string, number> = {};
  const armorPieces: Record<string, number> = {};
  const jewelryPieces: Record<string, number> = {};
  const resources: Record<string, number> = {};

  const allResources = getAllResources();
  const weaponsByGrade = getShopIdsByTypeAndGrade("weapon");
  const armorByGrade = getShopIdsByTypeAndGrade("armor");
  const jewelryByGrade = getShopIdsByTypeAndGrade("jewelry");

  for (let i = 0; i < fishCount; i++) {
    // Зброя/Броня/Бижутерія — за грейдом: D/C 0.7%, B/A/S 0.1%
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
    // Ресурси: 0.8% кожен тип
    allResources.forEach((res) => {
      if (Math.random() * 100 < 0.8) resources[res.id] = (resources[res.id] || 0) + 1;
    });
    // Скарбничка: 0.3%
    if (Math.random() * 100 < 0.3) resources["treasure_box"] = (resources["treasure_box"] || 0) + 1;
    // Адена, Coin of Luck, Срібні монети — прибрано з дропу
  }

  return {
    adena: totalAdena,
    coinOfLuck: totalCoinOfLuck,
    coinsSilver: totalCoinsSilver,
    weapons: Object.entries(weapons).map(([id, count]) => ({ id, count })),
    armorPieces: Object.entries(armorPieces).map(([id, count]) => ({ id, count })),
    jewelryPieces: Object.entries(jewelryPieces).map(([id, count]) => ({ id, count })),
    resources: Object.entries(resources).map(([id, count]) => ({ id, count })),
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
    let updatedInventory = inventory.map((i: HeroInventoryItem) => {
      if (i.id === item.id) {
        const newCount = (i.count ?? 1) - dismantleAmount;
        return newCount > 0 ? { ...i, count: newCount } : null;
      }
      return i;
    }).filter(Boolean) as HeroInventoryItem[];

    // Додаємо адену
    const newAdena = (currentHero.adena || 0) + result.adena;

    // Додаємо бижутерію — окремий слот, завжди по 1 предмету (не стакається)
    result.jewelryPieces.forEach(({ id, count }) => {
      const itemDef = itemsDB[id];
      if (itemDef) {
        for (let i = 0; i < count; i++) {
          updatedInventory.push({
            id,
            name: itemDef.name,
            icon: itemDef.icon,
            slot: itemDef.slot,
            count: 1,
            description: itemDef.description,
          });
        }
      }
    });

    // Додаємо зброю — завжди по 1 предмету (не стакається)
    result.weapons.forEach(({ id, count }) => {
      const itemDef = itemsDB[id];
      if (itemDef) {
        for (let i = 0; i < count; i++) {
          updatedInventory.push({
            id,
            name: itemDef.name,
            icon: itemDef.icon,
            slot: itemDef.slot,
            count: 1,
            description: itemDef.description,
          });
        }
      }
    });

    // Додаємо броню — завжди по 1 предмету (не стакається)
    result.armorPieces.forEach(({ id, count }) => {
      const itemDef = itemsDB[id];
      if (itemDef) {
        for (let i = 0; i < count; i++) {
          updatedInventory.push({
            id,
            name: itemDef.name,
            icon: itemDef.icon,
            slot: itemDef.slot,
            count: 1,
            description: itemDef.description,
          });
        }
      }
    });

    // Додаємо ресурси (без бижутерії — вона вже в jewelryPieces): стакається
    result.resources.forEach(({ id, count }) => {
      const itemDef = itemsDB[id];
      if (!itemDef) return;
      const existingItem = updatedInventory.find((i) => i.id === id);
      if (existingItem) {
        updatedInventory = updatedInventory.map((i) =>
          i.id === id ? { ...i, count: (i.count ?? 1) + count } : i
        );
      } else {
        updatedInventory.push({
          id,
          name: itemDef.name,
          icon: itemDef.icon,
          slot: itemDef.slot,
          count,
          description: itemDef.description,
        });
      }
    });

    const newCoinOfLuck = (currentHero.coinOfLuck ?? 0) + (result.coinOfLuck ?? 0);
    const newCoinsSilver = (currentHero.coins_silver ?? (currentHero as any).coinsSilver ?? 0) + (result.coinsSilver ?? 0);

    // Оновлюємо героя
    updateHero({
      adena: newAdena,
      coinOfLuck: newCoinOfLuck,
      coins_silver: newCoinsSilver,
      inventory: updatedInventory,
    });

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
                        {Object.keys(stats).length > 0 && (
                          <div className="pl-7 space-y-0.5 text-xs">
                            {stats.pAtk !== undefined && stats.pAtk !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Физ. атака:</span>
                                <span className="text-red-400">+{stats.pAtk}</span>
                              </div>
                            )}
                            {stats.mAtk !== undefined && stats.mAtk !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Маг. атака:</span>
                                <span className="text-purple-400">+{stats.mAtk}</span>
                              </div>
                            )}
                            {stats.rCrit !== undefined && stats.rCrit !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Крит:</span>
                                <span className="text-purple-400">+{stats.rCrit}</span>
                              </div>
                            )}
                            {stats.pAtkSpd !== undefined && stats.pAtkSpd !== null && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Скорость боя:</span>
                                <span className="text-yellow-400">+{stats.pAtkSpd}</span>
                              </div>
                            )}
                          </div>
                        )}
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
                        {Object.keys(stats).length > 0 && (
                          <div className="pl-7 space-y-0.5 text-xs">
                            {(stats as any).STR && (
                              <div className="flex justify-between"><span className="text-gray-400">STR:</span><span className="text-yellow-300">+{(stats as any).STR}</span></div>
                            )}
                            {(stats as any).DEX && (
                              <div className="flex justify-between"><span className="text-gray-400">DEX:</span><span className="text-yellow-300">+{(stats as any).DEX}</span></div>
                            )}
                            {(stats as any).CON && (
                              <div className="flex justify-between"><span className="text-gray-400">CON:</span><span className="text-yellow-300">+{(stats as any).CON}</span></div>
                            )}
                            {(stats as any).INT && (
                              <div className="flex justify-between"><span className="text-gray-400">INT:</span><span className="text-yellow-300">+{(stats as any).INT}</span></div>
                            )}
                            {(stats as any).WIT && (
                              <div className="flex justify-between"><span className="text-gray-400">WIT:</span><span className="text-yellow-300">+{(stats as any).WIT}</span></div>
                            )}
                            {(stats as any).MEN && (
                              <div className="flex justify-between"><span className="text-gray-400">MEN:</span><span className="text-yellow-300">+{(stats as any).MEN}</span></div>
                            )}
                          </div>
                        )}
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
                        {(stats.pDef || stats.mDef || stats.maxHp || stats.maxMp) && (
                          <div className="pl-7 space-y-0.5 text-xs">
                            {stats.pDef && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Физ. защита:</span>
                                <span className="text-blue-400">+{stats.pDef}</span>
                              </div>
                            )}
                            {stats.mDef && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Маг. защита:</span>
                                <span className="text-cyan-400">+{stats.mDef}</span>
                              </div>
                            )}
                            {stats.maxHp && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Max HP:</span>
                                <span className="text-red-400">+{stats.maxHp}</span>
                              </div>
                            )}
                            {stats.maxMp && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Max MP:</span>
                                <span className="text-blue-400">+{stats.maxMp}</span>
                              </div>
                            )}
                            {(stats.STR || stats.DEX || stats.CON || stats.INT || stats.WIT || stats.MEN) && (
                              <>
                                {stats.STR && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">STR:</span>
                                    <span className="text-yellow-300">+{stats.STR}</span>
                                  </div>
                                )}
                                {stats.DEX && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">DEX:</span>
                                    <span className="text-yellow-300">+{stats.DEX}</span>
                                  </div>
                                )}
                                {stats.CON && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">CON:</span>
                                    <span className="text-yellow-300">+{stats.CON}</span>
                                  </div>
                                )}
                                {stats.INT && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">INT:</span>
                                    <span className="text-yellow-300">+{stats.INT}</span>
                                  </div>
                                )}
                                {stats.WIT && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">WIT:</span>
                                    <span className="text-yellow-300">+{stats.WIT}</span>
                                  </div>
                                )}
                                {stats.MEN && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">MEN:</span>
                                    <span className="text-yellow-300">+{stats.MEN}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
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

            {dismantleResult.adena === 0 &&
              ((dismantleResult as { coinOfLuck?: number }).coinOfLuck ?? 0) === 0 &&
              ((dismantleResult as { coinsSilver?: number }).coinsSilver ?? 0) === 0 &&
              dismantleResult.weapons.length === 0 &&
              dismantleResult.armorPieces.length === 0 &&
              dismantleResult.jewelryPieces.length === 0 &&
              dismantleResult.resources.length === 0 && (
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
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Шанси дропу (за 1 рибу):</div>
            <div className="text-gray-400 text-[11px] space-y-0.5">
              <div>Зброя/Броня/Бижутерія D/C: 0.7%</div>
              <div>Зброя/Броня/Бижутерія B/A/S: 0.1%</div>
              <div>Ресурси: 0.8% кожен тип</div>
              <div>Скарбничка: 0.3%</div>
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
