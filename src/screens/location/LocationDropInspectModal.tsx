import React from "react";
import type { Mob } from "../../data/world/types";
import { itemsDB } from "../../data/items/itemsDB";
import { autoDetectGrade } from "../../utils/items/autoDetectArmorType";
import { findSetForItem, formatSetStatsForDisplay } from "../../data/sets/armorSets";
import type { DropEntry } from "../../data/combat/types";
import { resourceLootDisplayName } from "../../utils/resourceLootDisplayName";
import {
  formatDropChanceLabel,
  dropLineIconPath,
  onL2ResourceIconImgError,
} from "./locationZoneDropUtils";
import { L2_WARM_LOCATION_MODAL_MD, L2_WARM_LOCATION_MODAL_MD_SCROLL } from "../../utils/l2WarmLayoutClassNames";

export interface LocationDropInspectModalProps {
  isL2: boolean;
  itemId: string;
  mob: Mob;
  onClose: () => void;
}

export function LocationDropInspectModal({
  isL2,
  itemId: selectedDropItem,
  mob: selectedMob,
  onClose,
}: LocationDropInspectModalProps) {
  const itemDef = itemsDB[selectedDropItem];
  const dropLine: DropEntry | undefined =
    selectedMob.drops?.find((d) => d.id === selectedDropItem) ||
    selectedMob.spoil?.find((s) => s.id === selectedDropItem);

  if (!itemDef && dropLine) {
    const iconPath = dropLineIconPath(dropLine);
    const title = dropLine.displayName || resourceLootDisplayName(dropLine.id);
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
        onClick={onClose}
      >
        <div
          className={
            isL2
              ? L2_WARM_LOCATION_MODAL_MD
              : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full"
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <h2
              className={
                isL2 ? "text-base font-semibold text-[#e8c56e]" : "text-lg font-semibold text-[#b8860b]"
              }
            >
              {title}
            </h2>
            <button
              type="button"
              className="text-gray-400 hover:text-white text-xl leading-none"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={iconPath}
              alt={title}
              className="w-16 h-16 object-contain border border-white/40 bg-black/40"
              onError={onL2ResourceIconImgError}
            />
            <div className="text-xs text-gray-400 space-y-1">
              <div>
                Кількість: {dropLine.min}–{dropLine.max}
              </div>
              <div>Шанс (L2): {formatDropChanceLabel(dropLine)}</div>
              {dropLine.l2ItemId != null && <div>L2 item id: {dropLine.l2ItemId}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!itemDef) return null;

  const iconPath = itemDef.icon
    ? itemDef.icon.startsWith("/")
      ? itemDef.icon
      : `/items/${itemDef.icon}`
    : "/items/default_item.png";
  const isResource = itemDef.kind === "resource" || itemDef.kind === "other";
  const itemGrade = !isResource ? (itemDef.grade ?? autoDetectGrade(selectedDropItem)) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className={
          isL2
            ? L2_WARM_LOCATION_MODAL_MD_SCROLL
            : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2
            className={
              isL2
                ? "text-base font-semibold text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
                : "text-lg font-semibold text-[#b8860b]"
            }
          >
            {itemDef.name} {itemGrade && `[${itemGrade}]`}
          </h2>
          <button
            type="button"
            className={
              isL2
                ? "text-[#8a7a60] hover:text-[#d4c4a8] text-xl leading-none"
                : "text-gray-400 hover:text-white text-xl"
            }
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <img
            src={iconPath}
            alt={itemDef.name}
            className="w-16 h-16 object-contain border border-white/40 bg-black/40"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
            }}
          />
          <div className="flex-1 space-y-1 text-xs">
            {itemDef.kind && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Тип:</span>
                <span className="text-gray-300 capitalize">{itemDef.kind}</span>
              </div>
            )}
            {itemGrade && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Грейд:</span>
                <span className="text-[#b8860b]">{itemGrade}</span>
              </div>
            )}
          </div>
        </div>

        {itemDef.stats && Object.keys(itemDef.stats).length > 0 && (
          <div className="border-t border-white/40 pt-2 mt-2 mb-2">
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Стати:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {itemDef.stats.pAtk !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Физ. атака:</span>
                  <span className="text-red-400">{itemDef.stats.pAtk}</span>
                </div>
              )}
              {itemDef.stats.mAtk !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Маг. атака:</span>
                  <span className="text-purple-400">{itemDef.stats.mAtk}</span>
                </div>
              )}
              {itemDef.stats.pDef !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Физ. захист:</span>
                  <span className="text-blue-400">{itemDef.stats.pDef}</span>
                </div>
              )}
              {itemDef.stats.mDef !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Маг. захист:</span>
                  <span className="text-cyan-400">{itemDef.stats.mDef}</span>
                </div>
              )}
              {itemDef.stats.rCrit !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Крит:</span>
                  <span className="text-purple-400">{itemDef.stats.rCrit}</span>
                </div>
              )}
              {itemDef.stats.pAtkSpd !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Скорость боя:</span>
                  <span className="text-yellow-400">{itemDef.stats.pAtkSpd}</span>
                </div>
              )}
              {itemDef.stats.castSpeed !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Скорость каста:</span>
                  <span className="text-yellow-400">+{itemDef.stats.castSpeed}</span>
                </div>
              )}
              {itemDef.stats.maxHp !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Max HP:</span>
                  <span className="text-red-400">+{itemDef.stats.maxHp}</span>
                </div>
              )}
              {itemDef.stats.maxMp !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Max MP:</span>
                  <span className="text-blue-400">+{itemDef.stats.maxMp}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(() => {
          const set = findSetForItem(selectedDropItem);
          if (!set) return null;
          if (
            !set.bonuses.fullSet &&
            !set.bonuses.setStats &&
            (!set.bonuses.partialSet || set.bonuses.partialSet.length === 0)
          )
            return null;

          const bonusesList: string[] = [];
          bonusesList.push(...formatSetStatsForDisplay(set.bonuses.setStats));
          if (set.bonuses.fullSet) {
            const bonuses = set.bonuses.fullSet;
            if (bonuses.maxHp) bonusesList.push(`+${bonuses.maxHp} Max HP`);
            if (bonuses.maxMp) bonusesList.push(`+${bonuses.maxMp} Max MP`);
            if (bonuses.maxCp) bonusesList.push(`+${bonuses.maxCp} Max CP`);
            if (bonuses.pDef) bonusesList.push(`+${bonuses.pDef} Физ. захист`);
            if (bonuses.mDef) bonusesList.push(`+${bonuses.mDef} Маг. захист`);
            if (bonuses.hpRegen) bonusesList.push(`+${bonuses.hpRegen} Реген HP`);
            if (bonuses.mpRegen) bonusesList.push(`+${bonuses.mpRegen} Реген MP`);
            if (bonuses.attackSpeed) bonusesList.push(`+${bonuses.attackSpeed} Скорость атаки`);
            if (bonuses.castSpeed) bonusesList.push(`+${bonuses.castSpeed} Скорость каста`);
            if (bonuses.pAtk) bonusesList.push(`+${bonuses.pAtk} Физ. атака`);
            if (bonuses.mAtk) bonusesList.push(`+${bonuses.mAtk} Маг. атака`);
            if (bonuses.crit) {
              const critPercent = Math.round(bonuses.crit / 10);
              bonusesList.push(`+${critPercent}% Крит`);
            }
            if (bonuses.critRate) bonusesList.push(`+${bonuses.critRate}% Крит`);
            if (bonuses.critPower) bonusesList.push(`+${bonuses.critPower} Сила крита`);
            if (bonuses.skillCritRate) bonusesList.push(`+${bonuses.skillCritRate}% Шанс маг крита`);
            if (bonuses.pDefPercent) bonusesList.push(`+${bonuses.pDefPercent}% Физ. защ`);
            if (bonuses.mDefPercent) bonusesList.push(`+${bonuses.mDefPercent}% Маг. защ`);
            if (bonuses.maxHpPercent) bonusesList.push(`+${bonuses.maxHpPercent}% Max HP`);
            if (bonuses.accuracy) bonusesList.push(`+${bonuses.accuracy} Точність`);
          }

          return (
            <div className="border-t border-white/40 pt-2 mt-2 mb-2">
              <div className="text-sm font-semibold text-[#b8860b] mb-2">
                Сет: {set.name} [{set.grade}]
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Частини сету ({set.pieces.length}):{" "}
                {set.pieces
                  .map((p) => {
                    const pieceDef = itemsDB[p.itemId];
                    return pieceDef?.name || p.itemId;
                  })
                  .join(", ")}
              </div>
              {bonusesList.length > 0 && (
                <div className="text-xs text-yellow-400">
                  <div className="font-semibold mb-1">Бонуси повного сету:</div>
                  <div>
                    <span className="text-purple-400">{bonusesList.join(", ")}</span>
                  </div>
                </div>
              )}
              {set.bonuses.partialSet && set.bonuses.partialSet.length > 0 && (
                <div className="text-xs text-yellow-300 mt-2">
                  {set.bonuses.partialSet.map((partial, idx) => {
                    const partialBonuses: string[] = [];
                    if (partial.bonuses.maxHp) partialBonuses.push(`+${partial.bonuses.maxHp} Max HP`);
                    if (partial.bonuses.pDef) partialBonuses.push(`+${partial.bonuses.pDef} Физ. защ`);
                    if (partial.bonuses.mDef) partialBonuses.push(`+${partial.bonuses.mDef} Маг. защ`);
                    if (partial.bonuses.pAtk) partialBonuses.push(`+${partial.bonuses.pAtk} Физ. атака`);
                    if (partial.bonuses.mAtk) partialBonuses.push(`+${partial.bonuses.mAtk} Маг. атака`);
                    return partialBonuses.length > 0 ? (
                      <div key={idx} className="mb-1">
                        <span className="font-semibold">Частковий сет ({partial.pieces} частин):</span>{" "}
                        <span className="text-purple-400">{partialBonuses.join(", ")}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {itemDef.description && (
          <div className="border-t border-white/40 pt-2 mt-2 mb-2">
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Опис:</div>
            <div className="text-gray-300 text-xs">{itemDef.description}</div>
          </div>
        )}

        <div className="flex justify-center pt-2 border-t border-white/40">
          <button
            type="button"
            onClick={onClose}
            className={
              isL2
                ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-[#2a2620] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
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
