import React from "react";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import { L2_EPIC_RAID_BOSSES } from "../data/world/l2dop/epicRaidBosses";
import type { RaidBoss } from "../data/bosses/floran_overlord";
import { findZoneWithCity } from "./battle/battleUtils";
import { displayCityName, displayMobName, displayZoneName } from "../utils/worldDisplay";
import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import { autoDetectGrade } from "../utils/items/autoDetectArmorType";
import type { DropEntry } from "../data/combat/types";
import { resourceLootDisplayName } from "../utils/resourceLootDisplayName";
import {
  formatDropChanceLabel,
  dropLineIconPath,
  onL2ResourceIconImgError,
} from "./location/locationZoneDropUtils";
import { LocationDropInspectModal } from "./location/LocationDropInspectModal";
import { useGameSettingsVersion } from "../hooks/useGameSettingsVersion";

interface EpicBossesInfoProps {
  navigate: (path: string) => void;
}

function formatRespawnUkr(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const d = Math.floor(h / 24);
  const hr = h % 24;
  const m = Math.floor((s % 3600) / 60);
  if (h <= 0 && m <= 0) return "—";
  if (d > 0 && m === 0 && hr === 0) return `${d} діб`;
  if (d > 0 && m === 0) return `${d} діб ${hr} год`;
  if (m === 0) return `${h} год`;
  if (h === 0) return `${m} хв`;
  return `${h} год ${m} хв`;
}

/** Шанс випадіння ключової біжутерії з епіка (для таблиці в інфо). */
const EPIC_JEWELRY_INFO: { bossUa: string; itemId: string; chanceLabel: string }[] = [
  { bossUa: "Queen Ant (Королева мурахів)", itemId: "ring_of_queen_ant", chanceLabel: "30%" },
  { bossUa: "Core (Ядро)", itemId: "ring_of_core", chanceLabel: "30%" },
  { bossUa: "Orfen (Орфен)", itemId: "earring_of_orfen", chanceLabel: "30%" },
  { bossUa: "Zaken (Закен)", itemId: "earring_of_zaken", chanceLabel: "100%" },
  { bossUa: "Frintezza (Фрінтеза)", itemId: "necklace_of_frintezza", chanceLabel: "100%" },
  { bossUa: "Baium (Баюм)", itemId: "ring_of_baium", chanceLabel: "100%" },
  { bossUa: "Antharas (Антарас)", itemId: "earring_of_antharas", chanceLabel: "100%" },
  { bossUa: "Valakas (Валакас)", itemId: "necklace_of_valakas", chanceLabel: "100%" },
];

type EpicRow = {
  boss: RaidBoss;
  cityLabel: string;
  zoneLabel: string;
  sortCity: string;
  sortZone: string;
};

export default function EpicBossesInfo({ navigate }: EpicBossesInfoProps) {
  useGameSettingsVersion();
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const innerPanel = isL2
    ? "max-w-lg mx-auto rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-4"
    : "max-w-lg mx-auto border border-white/50 rounded-lg p-4 bg-[#1a0b0b]/30";

  const rows: EpicRow[] = React.useMemo(() => {
    return L2_EPIC_RAID_BOSSES.map((boss) => {
      const found = findZoneWithCity(boss.zoneId);
      const cityLabel = found ? displayCityName(found.city) : "—";
      const zoneLabel = found ? displayZoneName(found.zone) : boss.zoneId;
      const sortCity = found ? displayCityName(found.city) : boss.zoneId;
      const sortZone = found ? found.zone.name : boss.zoneId;
      return { boss, cityLabel, zoneLabel, sortCity, sortZone };
    }).sort((a, b) => {
      const c = a.sortCity.localeCompare(b.sortCity, "uk");
      if (c !== 0) return c;
      const z = a.sortZone.localeCompare(b.sortZone, "uk");
      if (z !== 0) return z;
      return a.boss.name.localeCompare(b.boss.name, "uk");
    });
  }, []);

  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [inspectItemId, setInspectItemId] = React.useState<string | null>(null);
  const [inspectBoss, setInspectBoss] = React.useState<RaidBoss | null>(null);

  const openInspect = (boss: RaidBoss, itemId: string) => {
    setInspectBoss(boss);
    setInspectItemId(itemId);
  };

  const closeInspect = () => {
    setInspectItemId(null);
    setInspectBoss(null);
  };

  const rowCard = isL2
    ? "rounded-lg border border-[#5c4a32]/60 bg-gradient-to-b from-[#2e2619]/90 to-[#14110c]/90 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-3"
    : "rounded-lg border border-white/20 bg-black/20 p-3";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 text-[#d4c4a8]`
          : "w-full text-white px-3 py-4"
      }
    >
      <div className={innerPanel}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h1 className={isL2 ? "text-lg font-bold text-[#e8c56e]" : "text-lg font-bold text-[#ffe9c0]"}>
              Епік-боси (рейд)
            </h1>
            <p className="text-[11px] text-[#8a7a60] mt-1 leading-snug">
              Де стоїть кожен епік: місто та локація. Натисніть ім’я боса — повний дроп. Предмет у списку — картка предмета.
            </p>
            <div className="mt-3 space-y-2 text-[11px] text-[#a89878] leading-snug border border-[#5c4a32]/45 rounded-lg p-2.5 bg-black/20">
              <p className="font-semibold text-[#e8c56e]">Початкові епіки (low level)</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  <strong>Queen Ant</strong>: 24 год ± 4 год (~раз на добу).
                </li>
                <li>
                  <strong>Core</strong>: 36 год ± 4 год.
                </li>
                <li>
                  <strong>Orfen</strong>: 36 год ± 4 год.
                </li>
              </ul>
              <p className="font-semibold text-[#e8c56e] pt-1">Середній рівень</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  <strong>Zaken</strong>: 48 год ± 2 год.
                </li>
                <li>
                  <strong>Frintezza</strong>: 48 год ± 2 год.
                </li>
              </ul>
              <p className="font-semibold text-[#e8c56e] pt-1">Вищі епіки (top tier)</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  <strong>Baium</strong>: 5 діб (120 год) + рандом 0–8 год.
                </li>
                <li>
                  <strong>Antharas</strong>: 8 діб (192 год).
                </li>
                <li>
                  <strong>Valakas</strong>: 11 діб (264 год), стабільно.
                </li>
              </ul>
            </div>
            <div className="mt-3 rounded-lg border border-[#5c4a32]/45 overflow-hidden">
              <div className="text-[11px] font-semibold text-[#b8860b] px-2.5 py-1.5 bg-black/30">
                Шанс епічної біжутерії
              </div>
              <table className="w-full text-[10px] text-[#d4c4a8]">
                <thead>
                  <tr className="border-b border-[#5c4a32]/40 text-[#8a7a60]">
                    <th className="text-left font-medium py-1 px-2">Епік-бос</th>
                    <th className="text-left font-medium py-1 px-2">Предмет</th>
                    <th className="text-right font-medium py-1 px-2">Шанс</th>
                    <th className="text-right font-medium py-1 px-2">Кількість</th>
                  </tr>
                </thead>
                <tbody>
                  {EPIC_JEWELRY_INFO.map((row) => {
                    const nm =
                      itemsDBWithStarter[row.itemId]?.name ?? itemsDB[row.itemId]?.name ?? row.itemId;
                    return (
                      <tr key={row.itemId} className="border-b border-[#5c4a32]/25">
                        <td className="py-1 px-2 align-top">{row.bossUa}</td>
                        <td className="py-1 px-2 align-top text-[#c9a44c]">{nm}</td>
                        <td className="py-1 px-2 text-right whitespace-nowrap">{row.chanceLabel}</td>
                        <td className="py-1 px-2 text-right whitespace-nowrap">1 шт.</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <button
            type="button"
            className={
              isL2
                ? "shrink-0 px-3 py-1.5 rounded-md border border-[#5c4a32]/70 text-[11px] text-[#c9a44c] hover:border-[#c7ad80]/40"
                : "shrink-0 px-3 py-1.5 rounded border border-white/25 text-xs text-[#c7ad80] hover:bg-white/10"
            }
            onClick={() => navigate("/city")}
          >
            У місто
          </button>
        </div>

        <div className="space-y-3">
          {rows.map(({ boss, cityLabel, zoneLabel }) => {
            const open = expandedId === boss.id;
            const dropsNoAdena = (boss.drops ?? []).filter((d) => d.id !== "adena" && d.kind !== "adena");

            return (
              <div key={boss.id} className={rowCard}>
                <div className="text-[11px] text-[#8a7a60] uppercase tracking-wide">{cityLabel}</div>
                <div className="text-sm font-semibold text-[#d4c4a8] mt-0.5">{zoneLabel}</div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <button
                    type="button"
                    className={
                      isL2
                        ? "text-left text-sm font-semibold text-violet-300 hover:text-violet-200 [text-shadow:0_0_12px_rgba(124,58,237,0.25)] underline-offset-2 hover:underline"
                        : "text-left text-sm font-semibold text-violet-300 hover:text-violet-200 underline-offset-2 hover:underline"
                    }
                    onClick={() => setExpandedId(open ? null : boss.id)}
                  >
                    {displayMobName(boss.name)}
                  </button>
                  <span className="text-[#6b5b48]">·</span>
                  <span className="text-[11px] text-[#a89878]">
                    Респавн:{" "}
                    <span className="text-[#c9a44c]">
                      {boss.respawnLabelUkr ?? formatRespawnUkr(boss.respawnTime)}
                    </span>
                  </span>
                </div>

                {open && (
                  <div className="mt-3 pt-3 border-t border-[#5c4a32]/40">
                    <div className="text-xs font-semibold text-[#b8860b] mb-2">Дроп</div>
                    {dropsNoAdena.length === 0 ? (
                      <p className="text-[11px] text-[#8a7a60]">Немає записаного дропу.</p>
                    ) : (
                      <div className="space-y-1">
                        {dropsNoAdena.map((drop: DropEntry, idx: number) => {
                          const itemDef = itemsDBWithStarter[drop.id] ?? itemsDB[drop.id];
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
                              className={
                                canInspect
                                  ? "flex items-center gap-2 cursor-pointer hover:bg-black/30 p-1 rounded transition-colors"
                                  : "flex items-center gap-2 p-1 rounded opacity-90"
                              }
                              onClick={() => canInspect && openInspect(boss, drop.id)}
                            >
                              <img
                                src={iconPath}
                                alt=""
                                className="w-5 h-5 object-contain border border-white/30 bg-black/40 shrink-0"
                                onError={onL2ResourceIconImgError}
                              />
                              <span className="text-[#a89878] flex-1 text-xs hover:text-[#c9a44c] transition-colors">
                                {itemName}
                                {gradeDisplay}:
                              </span>
                              <span className="text-green-400 text-xs shrink-0">
                                {drop.min}-{drop.max} ({formatDropChanceLabel(drop)})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {inspectItemId && inspectBoss && (
        <LocationDropInspectModal
          isL2={isL2}
          itemId={inspectItemId}
          mob={inspectBoss}
          onClose={closeInspect}
        />
      )}
    </div>
  );
}
