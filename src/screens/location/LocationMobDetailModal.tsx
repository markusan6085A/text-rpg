import React from "react";
import type { Zone, Mob } from "../../data/world/types";
import { itemsDB } from "../../data/items/itemsDB";
import { autoDetectGrade } from "../../utils/items/autoDetectArmorType";
import { getFloranMobDropProfile } from "../../data/drop/floranMobDrops";
import { MOB_LOOT_TABLES_DISABLED } from "../../state/battle/helpers/mobLootTablesDisabled";
import { getEpicRaidBossNamesForZone, isL2EpicRaidBossMob } from "../../data/world/l2dop/epicRaidBosses";
import type { DropEntry } from "../../data/combat/types";
import { resourceLootDisplayName } from "../../utils/resourceLootDisplayName";
import { displayMobName } from "../../utils/worldDisplay";
import { getMobListIconSrc } from "../../utils/mobPublicIcon";
import { getMobEffectiveMaxHp } from "../../utils/mobs/mobEffectiveMaxHp";
import { isChampionMob } from "../../utils/mobs/isChampionMob";
import {
  formatDropChanceLabel,
  dropLineIconPath,
  onL2ResourceIconImgError,
  getMobWorldHpDisplay,
} from "./locationZoneDropUtils";
import { L2_WARM_LOCATION_MODAL_LG } from "../../utils/l2WarmLayoutClassNames";

export interface LocationMobDetailModalProps {
  isL2: boolean;
  zone: Zone;
  zoneId: string;
  mob: Mob;
  mobIndexInZone: number;
  onClose: () => void;
  onInspectDrop: (itemId: string) => void;
}

export function LocationMobDetailModal({
  isL2,
  zone,
  zoneId,
  mob: selectedMob,
  mobIndexInZone: selIdx,
  onClose,
  onInspectDrop,
}: LocationMobDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className={
          isL2
            ? L2_WARM_LOCATION_MODAL_LG
            : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2
            className={
              isL2EpicRaidBossMob(selectedMob)
                ? isL2
                  ? "text-base font-semibold text-[#e9d5ff] [text-shadow:0_0_14px_rgba(124,58,237,0.4)]"
                  : "text-lg font-semibold text-violet-300"
                : isL2
                  ? "text-base font-semibold text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
                  : "text-lg font-semibold text-[#b8860b]"
            }
          >
            {displayMobName(selectedMob.name)}
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

        {selectedMob.lore && (
          <p
            className={
              isL2
                ? "mb-3 text-[11px] sm:text-xs leading-relaxed text-[#c4b89a]/95 border-l-2 border-[#7c3aed]/45 pl-2.5 italic"
                : "mb-3 text-xs leading-relaxed text-violet-200/90 border-l-2 border-violet-500/40 pl-2.5 italic"
            }
          >
            {selectedMob.lore}
          </p>
        )}

        {(() => {
          const modalMobIcon = getMobListIconSrc(selectedMob);
          const labelCls = isL2 ? "text-[#8a7a60]" : "text-gray-400";
          const modalHp =
            selIdx >= 0 && zoneId
              ? getMobWorldHpDisplay(zoneId, selIdx, selectedMob)
              : {
                  current: getMobEffectiveMaxHp(selectedMob),
                  max: getMobEffectiveMaxHp(selectedMob),
                };
          return (
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start mb-3">
              {modalMobIcon ? (
                <div className="flex justify-center sm:justify-start shrink-0">
                  <div
                    className={
                      isL2
                        ? "w-[128px] h-[128px] rounded-lg border border-[#5c4a32]/60 bg-black/45 p-2 flex items-center justify-center shadow-[inset_0_1px_0_rgba(199,173,128,0.1)]"
                        : "w-[112px] h-[112px] rounded-lg border border-white/35 bg-black/50 p-2 flex items-center justify-center"
                    }
                  >
                    <img
                      src={modalMobIcon}
                      alt=""
                      className="max-w-full max-h-full w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              ) : null}
              <div className="flex-1 min-w-0 w-full space-y-2 text-xs sm:pt-0.5">
                <div className="flex items-center gap-2">
                  <span className={labelCls}>Рівень:</span>
                  <span
                    className={
                      isL2EpicRaidBossMob(selectedMob) ? "text-violet-400 font-semibold" : "text-red-500"
                    }
                  >
                    {selectedMob.level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelCls}>HP:</span>
                  <span
                    className={
                      isL2EpicRaidBossMob(selectedMob) ? "text-violet-400 font-semibold" : "text-red-500"
                    }
                  >
                    {modalHp.current}/{modalHp.max}
                  </span>
                </div>
                {selectedMob.mp > 0 && (
                  <div className="flex items-center gap-2">
                    <span className={labelCls}>MP:</span>
                    <span className="text-blue-500">{selectedMob.mp}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="space-y-3 text-xs">
          <div className="border-t border-white/40 pt-2 mt-0">
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Стати:</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Физ. атака:</span>
                <span className="text-red-400">{selectedMob.pAtk ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Маг. атака:</span>
                <span className="text-purple-400">{selectedMob.mAtk ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Физ. захист:</span>
                <span className="text-blue-400">{selectedMob.pDef ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Маг. захист:</span>
                <span className="text-cyan-400">{selectedMob.mDef ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/40 pt-2 mt-2">
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Нагороди:</div>
            {isChampionMob(selectedMob) ? (
              <p className="text-[10px] text-[#c9a44c] mb-2 leading-snug pr-0.5">
                Чемпіон: EXP, SP і Adena — уже повна нагорода за вбивство (множник у даних; у l2dop з пулу зазвичай ×10 до
                базового моба, у класичних зонах часто ще вищий коефіцієнт до звичайного моба тут).
              </p>
            ) : null}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Досвід:</span>
                <span className="text-green-400">{selectedMob.exp}</span>
              </div>
              {selectedMob.sp !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">SP:</span>
                  <span className="text-blue-400">{selectedMob.sp}</span>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-400">Adena:</span>
                <span className="text-yellow-400">
                  {selectedMob.adenaMin} - {selectedMob.adenaMax}
                  <span className="text-gray-500 ml-1">
                    ({Math.round((selectedMob.dropChance ?? 0.7) * 100)}% шанс)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {MOB_LOOT_TABLES_DISABLED ? (
            <div className="border-t border-white/40 pt-2 mt-2">
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Дроп:</div>
              <p className="text-xs text-gray-500">Дроп і спойл з мобів вимкнені.</p>
            </div>
          ) : (
            (() => {
              const isFloranZone = zone.id?.startsWith("floran");
              const useLegacyFloranProfile =
                isFloranZone &&
                !selectedMob.id?.startsWith("l2dop_") &&
                !selectedMob.id?.startsWith("rb_") &&
                (selectedMob as { isRaidBoss?: boolean }).isRaidBoss !== true;
              const floranProfile = useLegacyFloranProfile ? getFloranMobDropProfile(selectedMob) : undefined;
              const displayDrops: DropEntry[] = floranProfile
                ? floranProfile.items.map((item) => ({
                    id: item.itemId,
                    kind: item.itemId === "adena" ? "adena" : "resource",
                    min: item.min,
                    max: item.max,
                    chance: item.chance,
                  }))
                : (selectedMob.drops ?? []);
              const dropsNoAdena = displayDrops.filter((d) => d.id !== "adena" && d.kind !== "adena");
              const isRaid = (selectedMob as { isRaidBoss?: boolean }).isRaidBoss === true;
              const epicNames = getEpicRaidBossNamesForZone(zone.id);
              const showEpicHint =
                isRaid &&
                dropsNoAdena.length === 0 &&
                epicNames.length > 0 &&
                !isL2EpicRaidBossMob(selectedMob);
              return (
                (dropsNoAdena.length > 0 || showEpicHint) && (
                  <div className="border-t border-white/40 pt-2 mt-2">
                    <div className="text-sm font-semibold text-[#b8860b] mb-2">Дроп:</div>
                    {dropsNoAdena.length > 0 ? (
                      <div className="space-y-1">
                        {dropsNoAdena.map((drop: DropEntry, idx: number) => {
                          const itemDef = itemsDB[drop.id];
                          const iconPath = dropLineIconPath(drop);
                          const itemName =
                            itemDef?.name || drop.displayName || resourceLootDisplayName(drop.id);
                          const isResource =
                            itemDef?.kind === "resource" ||
                            itemDef?.kind === "other" ||
                            drop.kind === "resource" ||
                            drop.kind === "adena";
                          const itemGrade = !isResource ? (itemDef?.grade ?? autoDetectGrade(drop.id)) : null;
                          const gradeDisplay = itemGrade ? ` [${itemGrade}]` : "";
                          const canInspect = !!itemDef || !!drop.displayName || drop.id.startsWith("l2item_");

                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded transition-colors"
                              onClick={() => canInspect && onInspectDrop(drop.id)}
                            >
                              <img
                                src={iconPath}
                                alt={itemName}
                                className="w-5 h-5 object-contain border border-white/40 bg-black/40"
                                onError={onL2ResourceIconImgError}
                              />
                              <span className="text-gray-400 flex-1 hover:text-[#b8860b] transition-colors">
                                {itemName}
                                {gradeDisplay}:
                              </span>
                              <span className="text-green-400">
                                {drop.min}-{drop.max} ({formatDropChanceLabel(drop)})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    {showEpicHint ? (
                      <p className="text-[11px] leading-snug text-[#a89878] mt-1">
                        Для цього рейдбоса таблиця дропу порожня. Епік-РБ цієї зони (у т.ч.{" "}
                        <span className="text-[#c9a44c] font-medium">Ring of Queen Ant</span> ~30%) дивись у картці окремого
                        моба з іменем на кшталт: {epicNames.join(", ")}.
                      </p>
                    ) : null}
                  </div>
                )
              );
            })()
          )}

          {!MOB_LOOT_TABLES_DISABLED && selectedMob.spoil && selectedMob.spoil.length > 0 && (
            <div className="border-t border-white/40 pt-2 mt-2">
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Спойл:</div>
              <div className="space-y-1">
                {selectedMob.spoil.map((spoil: DropEntry, idx) => {
                  const itemDef = itemsDB[spoil.id];
                  const iconPath = dropLineIconPath(spoil);
                  const itemName =
                    itemDef?.name || spoil.displayName || resourceLootDisplayName(spoil.id);
                  const isResource =
                    itemDef?.kind === "resource" || itemDef?.kind === "other" || spoil.kind === "resource";
                  const itemGrade = !isResource ? (itemDef?.grade ?? autoDetectGrade(spoil.id)) : null;
                  const gradeDisplay = itemGrade ? ` [${itemGrade}]` : "";
                  const canInspect = !!itemDef || !!spoil.displayName || spoil.id.startsWith("l2item_");

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded transition-colors"
                      onClick={() => canInspect && onInspectDrop(spoil.id)}
                    >
                      <img
                        src={iconPath}
                        alt={itemName}
                        className="w-5 h-5 object-contain border border-white/40 bg-black/40"
                        onError={onL2ResourceIconImgError}
                      />
                      <span className="text-gray-400 flex-1 hover:text-[#b8860b] transition-colors">
                        {itemName}
                        {gradeDisplay}:
                      </span>
                      <span className="text-yellow-400">
                        {spoil.min}-{spoil.max} ({formatDropChanceLabel(spoil)})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-center mt-2 pt-2 border-t border-white/40">
            <button
              type="button"
              className={
                isL2
                  ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-[#2a2620] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
                  : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
              }
              onClick={onClose}
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
