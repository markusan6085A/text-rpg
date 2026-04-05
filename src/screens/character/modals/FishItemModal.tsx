import React, { useState } from "react";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import { useHeroStore } from "../../../state/heroStore";
import { useCharacterStore } from "../../../state/characterStore";
import FishingCatchInfoModal from "./FishingCatchInfoModal";
import { dismantleFish, type FishDismantleResponse } from "../../../utils/api";
import { showToast } from "../../../state/toastStore";
import { normalizeIconPath, handleResourceIconError, resourceIdToFilename } from "../../../utils/itemIcon";
import {
  characterModalBorderT,
  characterModalInputClass,
  characterModalPanelClass,
  isCharacterModalL2,
} from "../characterModalL2";

interface FishItemModalProps {
  item: HeroInventoryItem;
  hero: Hero;
  onClose: () => void;
  onDelete: (amount: number) => void;
  onTransfer: (amount: number) => void;
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

function dropItemGradeLabel(grade?: string) {
  if (!grade) return null;
  return (
    <span className="text-[#c9a44c] font-normal ml-1" title="Грейд">
      ({grade})
    </span>
  );
}

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
}: FishItemModalProps) {
  const maxCount = item.count ?? 1;
  const [transferAmount, setTransferAmount] = useState(1);
  const [deleteAmount, setDeleteAmount] = useState(1);
  const [dismantleAmount, setDismantleAmount] = useState(1);
  const [showDismantleResult, setShowDismantleResult] = useState(false);
  const [dismantleResult, setDismantleResult] = useState<FishDismantleResponse["dropResult"] | null>(null);
  const [showCatchInfoModal, setShowCatchInfoModal] = useState(false);
  const [dismantleLoading, setDismantleLoading] = useState(false);

  const bt = characterModalBorderT();
  const l2 = isCharacterModalL2();
  const inp = characterModalInputClass();
  const dropCardClass = l2
    ? "border border-[#5c4a32]/50 rounded-md p-2 bg-[#14110c]"
    : "border border-white/50 rounded p-2 bg-[#1a1a1a]";

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
        const expectedRevision = Number(
          useHeroStore.getState().serverState?.heroRevision ??
          (currentHero as any)?.heroJson?.heroRevision ??
          0
        );
        const res = await dismantleFish(
          characterId,
          item.id,
          dismantleAmount,
          Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0
        );
        const store = useHeroStore.getState();
        const liveHero = store.hero;
        if (liveHero && res.character) {
          const hj = (res.character as any).heroJson ?? {};
          const inventory = Array.isArray(hj.inventory) ? hj.inventory : liveHero.inventory ?? [];
          const overflowChest = Array.isArray(hj.overflowChest)
            ? hj.overflowChest
            : liveHero.overflowChest ?? [];
          const activeDyes = Array.isArray(hj.activeDyes) ? hj.activeDyes : liveHero.activeDyes ?? [];
          const nextCoinLuck = Number((res.character as any).coinLuck ?? hj.coinOfLuck ?? liveHero.coinOfLuck ?? 0);
          const nextAdena = Number((res.character as any).adena ?? hj.adena ?? liveHero.adena ?? 0);
          const nextLevel = Number((res.character as any).level ?? liveHero.level ?? 1);
          const nextExp = Number((res.character as any).exp ?? liveHero.exp ?? 0);
          const nextSp = Number((res.character as any).sp ?? liveHero.sp ?? 0);
          const revision = Number(hj.heroRevision ?? (liveHero as any)?.heroJson?.heroRevision ?? 0);
          store.applyServerSync(
            {
              level: nextLevel,
              exp: nextExp,
              sp: nextSp,
              adena: nextAdena,
              coinOfLuck: nextCoinLuck,
              inventory,
              overflowChest,
              activeDyes,
              heroJson: hj,
            } as any,
            {
              level: nextLevel,
              exp: nextExp,
              sp: nextSp,
              adena: nextAdena,
              coinLuck: nextCoinLuck,
              heroRevision: Number.isFinite(revision) ? revision : 0,
              updatedAt: Date.now(),
            }
          );
        }
        setDismantleResult(res.dropResult);
        setShowDismantleResult(true);
      } catch (e: any) {
        showToast(e?.message || e?.error || "Не вдалося розділити рибу", "error");
      } finally {
        setDismantleLoading(false);
      }
      return;
    }

    showToast("Для разделки рыбы нужна онлайн-сессия персонажа.", "error");
  };

  const itemDef = itemsDB[item.id];

  if (showDismantleResult && dismantleResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => { setShowDismantleResult(false); setDismantleResult(null); onClose(); }}>
        <div
          className={characterModalPanelClass("max-w-md w-full max-h-[80vh] overflow-y-auto")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={l2 ? "text-lg font-semibold text-[#e8c56e]" : "text-lg font-semibold text-[#b8860b]"}>
              Результат розділки
            </h2>
            <button
              className={l2 ? "text-[#8a7a60] hover:text-[#d4c4a8] text-xl" : "text-gray-400 hover:text-white text-xl"}
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
                      <div key={id} className={dropCardClass}>
                        <div className="flex items-center gap-2 mb-1">
                          {(weaponDef?.icon || true) && (
                            <img
                              src={normalizeIconPath(weaponDef?.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                              alt={weaponDef?.name || id}
                              className="w-5 h-5 object-contain"
                              onError={handleResourceIconError}
                            />
                          )}
                          <span className="text-gray-300 font-semibold">
                            {weaponDef?.name || id}
                            {dropItemGradeLabel(weaponDef?.grade)}
                          </span>
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
                      <div key={id} className={dropCardClass}>
                        <div className="flex items-center gap-2 mb-1">
                          {(jewelryDef?.icon || true) && (
                            <img
                              src={normalizeIconPath(jewelryDef?.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                              alt={jewelryDef?.name || id}
                              className="w-5 h-5 object-contain"
                              onError={handleResourceIconError}
                            />
                          )}
                          <span className="text-gray-300 font-semibold">
                            {jewelryDef?.name || id}
                            {dropItemGradeLabel(jewelryDef?.grade)}
                          </span>
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
                      <div key={id} className={dropCardClass}>
                        <div className="flex items-center gap-2 mb-1">
                          {(armorDef?.icon || true) && (
                            <img
                              src={normalizeIconPath(armorDef?.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
                              alt={armorDef?.name || id}
                              className="w-5 h-5 object-contain"
                              onError={handleResourceIconError}
                            />
                          )}
                          <span className="text-gray-300 font-semibold">
                            {armorDef?.name || id}
                            {dropItemGradeLabel(armorDef?.grade)}
                          </span>
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
                          <span className="text-gray-400">
                            {resourceDef?.name || id}
                            {dropItemGradeLabel(resourceDef?.grade)}:
                          </span>
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
                <div className="text-gray-400 text-center py-4">
                  Рибу розділено. У цьому разі без додаткового луту (спробуй ще — шанси як при зборі улову).
                </div>
              )}
          </div>

          <div className={`flex justify-center pt-2 ${bt}`}>
            <button
              onClick={() => { setShowDismantleResult(false); setDismantleResult(null); onClose(); }}
              className={
                l2
                  ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
                  : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
              }
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
        className={characterModalPanelClass("max-w-md w-full")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={l2 ? "text-lg font-semibold text-[#e8c56e]" : "text-lg font-semibold text-[#b8860b]"}>
            {itemDef?.name || item.name || item.id}
          </h2>
          <button
            className={l2 ? "text-[#8a7a60] hover:text-[#d4c4a8] text-xl" : "text-gray-400 hover:text-white text-xl"}
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
            <button
              type="button"
              onClick={() => setShowCatchInfoModal(true)}
              className="py-1.5 px-2 rounded border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/20 text-[11px]"
            >
              Информация об улове
            </button>
            {showCatchInfoModal && <FishingCatchInfoModal onClose={() => setShowCatchInfoModal(false)} />}
          </div>
        </div>

        <div className={`${bt} pt-2 mt-2 mb-4 space-y-3`}>
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
                className={inp}
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
                className={inp}
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
                className={inp}
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

        <div className={`flex justify-center pt-2 ${bt}`}>
          <button
            onClick={onClose}
            className={
              l2
                ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
                : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
            }
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
