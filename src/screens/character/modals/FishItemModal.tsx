import React, { useState } from "react";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { useHeroStore } from "../../../state/heroStore";
import { useCharacterStore } from "../../../state/characterStore";
import FishingCatchInfoModal from "./FishingCatchInfoModal";
import { addItemsWithOverflow } from "../../../state/heroStore/inventoryOverflow";
import { dismantleFish } from "../../../utils/api";
import { showToast } from "../../../state/toastStore";
import { processFishDrop } from "../../../utils/fishDismantle";
import { normalizeIconPath, handleResourceIconError, resourceIdToFilename } from "../../../utils/itemIcon";

interface FishItemModalProps {
  item: HeroInventoryItem;
  hero: Hero;
  onClose: () => void;
  onDelete: (amount: number) => void;
  onTransfer: (amount: number) => void;
  updateHero: (partial: Partial<Hero>) => void;
}

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
  const [dismantleLoading, setDismantleLoading] = useState(false);

  const characterId = useCharacterStore((s) => s.characterId) ?? hero?.id;

  const handleTransfer = () => {
    if (transferAmount < 1 || transferAmount > maxCount) return;
    onTransfer(transferAmount);
  };

  const handleDelete = () => {
    if (deleteAmount < 1 || deleteAmount > maxCount) return;
    onDelete(deleteAmount);
  };

  const handleDismantle = async () => {
    if (dismantleAmount < 1 || dismantleAmount > maxCount) return;

    const currentHero = useHeroStore.getState().hero;
    if (!currentHero) return;

    const inventory = currentHero.inventory || [];
    const invItem = inventory.find((i: HeroInventoryItem) => i.id === item.id);
    if (!invItem || (invItem.count ?? 0) < dismantleAmount) return;

    // Якщо є characterId — використовуємо серверний API (дроп зберігається в БД, без відкату)
    if (characterId) {
      setDismantleLoading(true);
      try {
        const res = await dismantleFish(characterId, item.id, dismantleAmount);
        const hj = res.character?.heroJson ?? {};
        const newRev = hj?.heroRevision;
        if (newRev != null) useHeroStore.getState().updateServerState?.({ heroRevision: newRev });
        updateHero({
          adena: res.character?.adena ?? currentHero.adena,
          inventory: hj?.inventory ?? currentHero.inventory,
          overflowChest: hj?.overflowChest ?? currentHero.overflowChest,
          heroJson: { ...(currentHero as any).heroJson, ...hj },
        });
        setDismantleResult(res.dropResult);
        setShowDismantleResult(true);
      } catch (e: any) {
        showToast(e?.message || e?.error || "Не вдалося розділити рибу", "error");
      } finally {
        setDismantleLoading(false);
      }
      return;
    }

    // Fallback: локальна обробка (для офлайн — без збереження на сервер)
    const result = processFishDrop(dismantleAmount);
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
                          {(weaponDef?.icon || true) && (
                            <img
                              src={normalizeIconPath(weaponDef?.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                              alt={weaponDef?.name || id}
                              className="w-5 h-5 object-contain"
                              onError={handleResourceIconError}
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
                          {(jewelryDef?.icon || true) && (
                            <img
                              src={normalizeIconPath(jewelryDef?.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                              alt={jewelryDef?.name || id}
                              className="w-5 h-5 object-contain"
                              onError={handleResourceIconError}
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
                          {(armorDef?.icon || true) && (
                            <img
                              src={normalizeIconPath(armorDef?.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                              alt={armorDef?.name || id}
                              className="w-5 h-5 object-contain"
                              onError={handleResourceIconError}
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
                      const iconPath = resourceDef?.icon ? normalizeIconPath(resourceDef.icon) : `/items/drops/resources/${resourceIdToFilename(id)}.jpg`;
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <img
                            src={iconPath}
                            alt={resourceDef?.name || id}
                            className="w-5 h-5 object-contain"
                            onError={handleResourceIconError}
                          />
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
                        <img
                          src={scrollDef?.icon ? normalizeIconPath(scrollDef.icon) : "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                          alt={scrollDef?.name || id}
                          className="w-5 h-5 object-contain"
                          onError={handleResourceIconError}
                        />
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
          <h2 className="text-lg font-semibold text-[#b8860b]">{itemDef?.name || item.name || item.id}</h2>
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
              <div>Зброя/Броня/Бижутерія — за 10 риб: D/C 0.7%, B/A/S 0.1%</div>
              <div>Ресурси — за 1 рибу: 0.8% кожен тип</div>
              <div>Скарбничка — за 1 рибу: 0.3%</div>
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
                disabled={dismantleLoading}
                className="px-3 py-1 text-xs text-blue-400 hover:text-blue-300 bg-[#2a2a2a] rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dismantleLoading ? "..." : "Разделать"}
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
