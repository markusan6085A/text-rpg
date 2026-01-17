// src/screens/Location.tsx
import React from "react";
import {
  locations as WORLD_LOCATIONS,
  cities as WORLD_CITIES,
} from "../data/world";
import type { City, Zone, Mob } from "../data/world/types";
import { useHeroStore } from "../state/heroStore";
import { itemsDB } from "../data/items/itemsDB";
import { isMobOnRespawn, getRespawnTimeRemaining } from "../state/battle/mobRespawns";
import { autoDetectGrade } from "../utils/items/autoDetectArmorType";
import { findSetForItem } from "../data/sets/armorSets";
import { savePreviousLocation } from "../utils/locationNavigation";

type Navigate = (path: string) => void;

function useQuery() {
  return React.useMemo(() => new URLSearchParams(location.search), []);
}

function findZoneById(zoneId: string): { zone: Zone; city: City } | undefined {
  const zone = WORLD_LOCATIONS.find((z) => z.id === zoneId);
  if (!zone) return undefined;
  const city = WORLD_CITIES.find((c) => c.id === zone.cityId);
  if (!city) return undefined;
  return { zone, city };
}

export default function LocationScreen({ navigate }: { navigate: Navigate }) {
  const q = useQuery();
  const hero = useHeroStore((s) => s.hero);

  // Підтримуємо і ?id=, і ?zone= на всяк випадок
  const zoneId = q.get("id") || q.get("zone") || "";

  const found = zoneId ? findZoneById(zoneId) : undefined;

  const [page, setPage] = React.useState(() => {
    const p = Number(q.get("page") || "1");
    return Number.isFinite(p) && p > 0 ? p : 1;
  });

  const [selectedMob, setSelectedMob] = React.useState<Mob | null>(null);
  const [selectedDropItem, setSelectedDropItem] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(Date.now());

  // Оновлюємо час кожну секунду для відображення таймера респавну
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!found) {
    return (
      <div className="w-full text-[#b8860b] flex items-center justify-center px-1 py-4">
        <div className="w-full text-center space-y-3">
          <div className="text-xs font-semibold">Зона не знайдена.</div>
          <button
            className="h-8 px-4 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b]"
            onClick={() => navigate("/gk")}
          >
            Телепорт
          </button>
        </div>
      </div>
    );
  }

  const { zone, city } = found;

  // ===== пагінація по мобах (15 на сторінку) =====
  const pageSize = 15;
  const totalMobs = zone.mobs.length;
  const totalPages = Math.max(1, Math.ceil(totalMobs / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleMobs: Mob[] = zone.mobs.slice(
    startIndex,
    startIndex + pageSize,
  );

  const goPage = (p: number) => {
    const safe = Math.min(Math.max(1, p), totalPages);
    setPage(safe);
    const params = new URLSearchParams(location.search);
    params.set("id", zone.id);
    params.set("page", String(safe));
    history.replaceState(null, "", `/location?${params.toString()}`);
  };

  const handleBackToCity = () => {
    // 🔥 Зберігаємо попередню локацію при переході в місто через телепорт
    // (щоб потім заблокувати прямий повернення назад)
    if (zoneId) {
      savePreviousLocation(zoneId);
    }
    navigate("/gk");
  };

  const openBattle = (mobIndexInZone: number) => {
    navigate(`/battle?zone=${zone.id}&idx=${mobIndexInZone}`);
  };

  return (
    <div className="w-full text-[#b8860b] px-1 py-2">
        {/* Заголовок */}
        <div className="text-[#b8860b] mb-4 text-base font-semibold flex items-center gap-2">
          <img src="/assets/travel.png" alt={zone.name} className="w-3 h-3 object-contain" />
          <span>{zone.name}</span>
        </div>

        {/* Список мобів */}
        <div className="space-y-0">
          {visibleMobs.length === 0 && (
            <div className="text-[#b8860b]/60 text-xs py-4">
              У цій локації поки немає мобів.
            </div>
          )}

          {visibleMobs
            .map((mob, i) => {
              const globalIndex = startIndex + i;
              // Перевіряємо респавн моба - якщо на респавні, не показуємо його
              const heroName = hero?.name;
              const onRespawn = isMobOnRespawn(zone.id, globalIndex, heroName);
              if (onRespawn) return null; // Приховуємо моба на респавні
              
              const isChampion = mob.name.startsWith("[Champion]") || mob.name.startsWith("[Чемпион]");
              const isRaid = (mob as any).isRaidBoss === true;
              const heroLevel = hero?.level || 1;
              const levelDiff = Math.abs(heroLevel - mob.level);
              const isLevelDiffTooHigh = levelDiff > 10;

              return (
                <div
                  key={globalIndex}
                  className={`flex items-center gap-2 py-1 border-b border-dotted border-gray-500 text-xs ${
                    isLevelDiffTooHigh ? "text-red-500" : "text-[#b8860b]"
                  }`}
                >
                  {mob.icon && (
                    <img
                      src={mob.icon}
                      alt={mob.name}
                      className="w-4 h-4 object-contain flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <span
                    className="text-green-500 cursor-pointer hover:text-green-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMob(mob);
                    }}
                  >
                    (і)
                  </span>
                  <span
                    className={`flex-1 cursor-pointer hover:text-[#daa520] ${
                      isRaid
                        ? "text-[#ff6666]"
                        : isChampion
                        ? "text-[#ffd966]"
                        : isLevelDiffTooHigh
                        ? "text-red-500"
                        : "text-[#b8860b]"
                    }`}
                    onClick={() => openBattle(globalIndex)}
                  >
                    {mob.name}
                  </span>
                  <span className="text-red-500">[{mob.level}]</span>
                  <span className="text-red-500">({mob.hp}/{mob.hp})</span>
                </div>
              );
            })
            .filter(Boolean)}
        </div>

        {/* Пагінація */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 text-[#b8860b] text-xs">
            <button
              className="disabled:opacity-40"
              disabled={currentPage <= 1}
              onClick={() => goPage(currentPage - 1)}
            >
              &lt;&lt;&lt;
            </button>
            <span>|</span>
            <button
              className="disabled:opacity-40"
              disabled={currentPage >= totalPages}
              onClick={() => goPage(currentPage + 1)}
            >
              &gt;&gt;&gt;
            </button>
          </div>
        )}

        {/* Кнопка Назад */}
        <div className="flex justify-center mt-4">
          <button
            className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
            onClick={handleBackToCity}
          >
            Назад
          </button>
        </div>

        {/* Модальне вікно з інформацією про моба */}
        {selectedMob && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => setSelectedMob(null)}
          >
            <div
              className="bg-[#1a1a1a] border border-[#7c6847] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#b8860b]">
                  {selectedMob.name}
                </h2>
                <button
                  className="text-gray-400 hover:text-white text-xl"
                  onClick={() => setSelectedMob(null)}
                >
                  ×
                </button>
              </div>

              {/* Основна інформація */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Рівень:</span>
                  <span className="text-red-500">{selectedMob.level}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">HP:</span>
                  <span className="text-red-500">{selectedMob.hp}</span>
                </div>

                {selectedMob.mp > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">MP:</span>
                    <span className="text-blue-500">{selectedMob.mp}</span>
                  </div>
                )}

                {/* Стати */}
                <div className="border-t border-gray-700 pt-2 mt-2">
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

                {/* Досвід та валюта */}
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="text-sm font-semibold text-[#b8860b] mb-2">Нагороди:</div>
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
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Adena:</span>
                      <span className="text-yellow-400">
                        {selectedMob.adenaMin} - {selectedMob.adenaMax}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Дроп */}
                {selectedMob.drops && selectedMob.drops.length > 0 && (
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="text-sm font-semibold text-[#b8860b] mb-2">Дроп:</div>
                    <div className="space-y-1">
                      {selectedMob.drops.map((drop, idx) => {
                        const itemDef = itemsDB[drop.id];
                        const iconPath = itemDef?.icon 
                          ? (itemDef.icon.startsWith("/") ? itemDef.icon : `/items/${itemDef.icon}`)
                          : "/items/default_item.png"; // Fallback іконка
                        const itemName = itemDef?.name || drop.id;
                        // Показуємо грейд тільки для зброї та броні, не для ресурсів
                        const isResource = itemDef?.kind === "resource" || itemDef?.kind === "other";
                        // Використовуємо grade з itemsDB, якщо є, інакше autoDetectGrade (яка також перевіряє itemsDB)
                        const itemGrade = !isResource ? (itemDef?.grade ?? autoDetectGrade(drop.id)) : null;
                        const gradeDisplay = itemGrade ? ` [${itemGrade}]` : "";
                        
                        return (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded transition-colors"
                            onClick={() => itemDef && setSelectedDropItem(drop.id)}
                          >
                            <img
                              src={iconPath}
                              alt={itemName}
                              className="w-5 h-5 object-contain border border-gray-600 bg-black/40"
                              onError={(e) => {
                                // Якщо іконка не завантажилась, приховуємо її
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <span className="text-gray-400 flex-1 hover:text-[#b8860b] transition-colors">
                              {itemName}{gradeDisplay}:
                            </span>
                            <span className="text-green-400">
                              {drop.min}-{drop.max} ({Math.round(drop.chance * 100)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Спойл */}
                {selectedMob.spoil && selectedMob.spoil.length > 0 && (
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="text-sm font-semibold text-[#b8860b] mb-2">Спойл:</div>
                    <div className="space-y-1">
                      {selectedMob.spoil.map((spoil, idx) => {
                        const itemDef = itemsDB[spoil.id];
                        const iconPath = itemDef?.icon 
                          ? (itemDef.icon.startsWith("/") ? itemDef.icon : `/items/${itemDef.icon}`)
                          : "/items/default_item.png"; // Fallback іконка
                        const itemName = itemDef?.name || spoil.id;
                        // Показуємо грейд тільки для зброї та броні, не для ресурсів
                        const isResource = itemDef?.kind === "resource" || itemDef?.kind === "other";
                        // Використовуємо grade з itemsDB, якщо є, інакше autoDetectGrade (яка також перевіряє itemsDB)
                        const itemGrade = !isResource ? (itemDef?.grade ?? autoDetectGrade(spoil.id)) : null;
                        const gradeDisplay = itemGrade ? ` [${itemGrade}]` : "";
                        
                        return (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded transition-colors"
                            onClick={() => itemDef && setSelectedDropItem(spoil.id)}
                          >
                            <img
                              src={iconPath}
                              alt={itemName}
                              className="w-5 h-5 object-contain border border-gray-600 bg-black/40"
                              onError={(e) => {
                                // Якщо іконка не завантажилась, приховуємо її
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <span className="text-gray-400 flex-1 hover:text-[#b8860b] transition-colors">
                              {itemName}{gradeDisplay}:
                            </span>
                            <span className="text-yellow-400">
                              {spoil.min}-{spoil.max} ({Math.round(spoil.chance * 100)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Кнопка закриття */}
                <div className="flex justify-center mt-4 pt-2 border-t border-gray-700">
                  <button
                    className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
                    onClick={() => setSelectedMob(null)}
                  >
                    Закрити
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Модалка для перегляду предмета з дропу */}
      {selectedDropItem && (() => {
        const itemDef = itemsDB[selectedDropItem];
        if (!itemDef) return null;

        const iconPath = itemDef.icon 
          ? (itemDef.icon.startsWith("/") ? itemDef.icon : `/items/${itemDef.icon}`)
          : "/items/default_item.png";
        const isResource = itemDef.kind === "resource" || itemDef.kind === "other";
        const itemGrade = !isResource ? (itemDef.grade ?? autoDetectGrade(selectedDropItem)) : null;

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" 
            onClick={() => setSelectedDropItem(null)}
          >
            <div
              className="bg-[#1a1a1a] border border-[#7c6847] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#b8860b]">
                  {itemDef.name} {itemGrade && `[${itemGrade}]`}
                </h2>
                <button
                  className="text-gray-400 hover:text-white text-xl"
                  onClick={() => setSelectedDropItem(null)}
                >
                  ×
                </button>
              </div>

              {/* Іконка та основна інформація */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={iconPath}
                  alt={itemDef.name}
                  className="w-16 h-16 object-contain border border-gray-600 bg-black/40"
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

              {/* Стати */}
              {itemDef.stats && Object.keys(itemDef.stats).length > 0 && (
                <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
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

              {/* Інформація про сет */}
              {(() => {
                const set = findSetForItem(selectedDropItem);
                if (!set) return null;

                const bonusesList: string[] = [];
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
                  <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
                    <div className="text-sm font-semibold text-[#b8860b] mb-2">
                      Сет: {set.name} [{set.grade}]
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      Частини сету ({set.pieces.length}): {set.pieces.map(p => {
                        const pieceDef = itemsDB[p.itemId];
                        return pieceDef?.name || p.itemId;
                      }).join(", ")}
                    </div>
                    {bonusesList.length > 0 && (
                      <div className="text-xs text-yellow-400">
                        <div className="font-semibold mb-1">Бонуси повного сету:</div>
                        <div>{bonusesList.join(", ")}</div>
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
                              <span className="font-semibold">Частковий сет ({partial.pieces} частин):</span> {partialBonuses.join(", ")}
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Опис предмета */}
              {itemDef.description && (
                <div className="border-t border-gray-700 pt-2 mt-2 mb-4">
                  <div className="text-sm font-semibold text-[#b8860b] mb-2">Опис:</div>
                  <div className="text-gray-300 text-xs">
                    {itemDef.description}
                  </div>
                </div>
              )}

              {/* Кнопка закриття */}
              <div className="flex justify-center pt-2 border-t border-gray-700">
                <button
                  onClick={() => setSelectedDropItem(null)}
                  className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
      </div>
    </div>
  );
}
