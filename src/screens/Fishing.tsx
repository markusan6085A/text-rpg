// src/screens/Fishing.tsx
import React from "react";
import type { Mob } from "../data/world/types";
import { useHeroStore } from "../state/heroStore";
import { locations } from "../data/world";
import { itemsDB } from "../data/items/itemsDB";
import { isMobOnRespawn, getRespawnTimeRemaining } from "../state/battle/mobRespawns";

type Navigate = (path: string) => void;

interface FishingProps {
  navigate: Navigate;
}

// Список риб для риболовлі (використовуємо з world.ts)
const FISHING_ZONE = locations.find((z) => z.id === "fishing");
const FISHING_MOBS: Mob[] = FISHING_ZONE?.mobs || [];

type FishCategory = "Тунець" | "Морська риба" | "Лящ" | "Морський чорт";

export default function Fishing({ navigate }: FishingProps) {
  const hero = useHeroStore((s) => s.hero);
  const [isFishingStarted, setIsFishingStarted] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<FishCategory>("Тунець");
  const [selectedMob, setSelectedMob] = React.useState<Mob | null>(null);
  const [page, setPage] = React.useState(1);
  const [now, setNow] = React.useState(Date.now());

  // Оновлюємо час кожну секунду для відображення таймера респавну
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Групуємо риби по категоріях
  const fishByCategory = React.useMemo(() => {
    const categories: Record<FishCategory, { mobs: Mob[]; indices: number[] }> = {
      "Тунець": { mobs: [], indices: [] },
      "Морська риба": { mobs: [], indices: [] },
      "Лящ": { mobs: [], indices: [] },
      "Морський чорт": { mobs: [], indices: [] },
    };

    FISHING_MOBS.forEach((mob, index) => {
      if (categories[mob.name as FishCategory]) {
        categories[mob.name as FishCategory].mobs.push(mob);
        categories[mob.name as FishCategory].indices.push(index);
      }
    });

    return categories;
  }, []);

  // Пагінація для вибраної категорії
  const currentCategoryData = fishByCategory[selectedCategory];
  const pageSize = 10;
  const totalMobs = currentCategoryData.mobs.length;
  const totalPages = Math.max(1, Math.ceil(totalMobs / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleMobs = currentCategoryData.mobs.slice(startIndex, startIndex + pageSize);
  const visibleIndices = currentCategoryData.indices.slice(startIndex, startIndex + pageSize);

  // Скидаємо сторінку при зміні категорії
  React.useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  const goPage = (p: number) => {
    const safe = Math.min(Math.max(1, p), totalPages);
    setPage(safe);
  };

  const openBattle = (mobIndex: number) => {
    navigate(`/battle?zone=fishing&idx=${mobIndex}`);
  };

  if (!hero) {
    return <div className="text-white text-center mt-10">Загрузка...</div>;
  }

  // Фон fishing.jpg відображається через Layout customBackground
  return (
    <div className="w-full text-[#b8860b] px-1 pb-2">
      {!isFishingStarted ? (
        // Початковий екран з кнопкою
        <div className="w-full text-center space-y-2 py-4">
          <div className="text-base font-semibold text-[#b8860b] mb-6 border-t border-b border-white/40 py-2">
            Риболовля
          </div>
          <button
            className="h-10 px-6 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-sm text-[#b8860b] hover:bg-[#3a3a3a] hover:text-[#daa520]"
            onClick={() => setIsFishingStarted(true)}
          >
            Начать рибалку
          </button>
        </div>
      ) : (
        // Список риб з категоріями
        <>
          <div className="text-[#b8860b] mb-2 text-base font-semibold text-center border-t border-b border-white/40 py-2">
            Риболовля
          </div>

          {/* Таби категорій */}
          <div className="flex flex-wrap gap-2 mb-2">
            {(Object.keys(fishByCategory) as FishCategory[]).map((category) => (
              <button
                key={category}
                className={`text-xs text-green-500 ${
                  selectedCategory === category
                    ? "font-semibold"
                    : "hover:opacity-70"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Список риб поточної категорії */}
          <div className="space-y-0">
            {visibleMobs.length === 0 ? (
              <div className="text-[#b8860b]/60 text-xs py-4 text-center">
                Немає риб у цій категорії
              </div>
            ) : (
              visibleMobs.map((mob, idx) => {
                const actualIndex = visibleIndices[idx];
                const heroLevel = hero?.level || 1;
                const heroName = hero?.name;
                const levelDiff = Math.abs(heroLevel - mob.level);
                const isLevelDiffTooHigh = levelDiff > 10;
                const onRespawn = isMobOnRespawn("fishing", actualIndex, heroName);
                const respawnTime = onRespawn ? getRespawnTimeRemaining("fishing", actualIndex, heroName) : 0;

                // Приховуємо рибу на респавні
                if (onRespawn) return null;

                return (
                  <div
                    key={mob.id}
                    className={`flex items-center gap-2 py-1 border-b border-solid border-white/50 text-xs ${
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
                        isLevelDiffTooHigh ? "text-red-500" : "text-[#b8860b]"
                      }`}
                      onClick={() => openBattle(actualIndex)}
                    >
                      {mob.name}
                    </span>
                    <span className="text-red-500">[{mob.level}]</span>
                    <span className="text-red-500">({mob.hp}/{mob.hp})</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Пагінація */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-2 text-white text-xs">
              <button
                className="disabled:opacity-40 text-white"
                disabled={currentPage <= 1}
                onClick={() => goPage(currentPage - 1)}
              >
                &lt;&lt;&lt;
              </button>
              <span className="text-white">|</span>
              <button
                className="disabled:opacity-40 text-white"
                disabled={currentPage >= totalPages}
                onClick={() => goPage(currentPage + 1)}
              >
                &gt;&gt;&gt;
              </button>
            </div>
          )}

          {/* Кнопка назад */}
          <div className="mt-2 flex justify-center">
            <button
              className="text-xs text-red-500 hover:text-red-400"
              onClick={() => setIsFishingStarted(false)}
            >
              Назад
            </button>
          </div>
        </>
      )}

      {/* Модалка з інформацією про рибу */}
      {selectedMob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setSelectedMob(null)}
        >
          <div
            className="bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-2">
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

              {/* Стати */}
              <div className="border-t border-white/40 pt-2 mt-2">
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

              {/* Дроп */}
              {selectedMob.drops && selectedMob.drops.length > 0 && (
                <div className="border-t border-white/40 pt-2 mt-2">
                  <div className="text-sm font-semibold text-[#b8860b] mb-2">Дроп:</div>
                  <div className="space-y-1">
                      {selectedMob.drops.map((drop, idx) => {
                      const itemDef = itemsDB[drop.id];
                      const iconPath = itemDef?.icon 
                        ? (itemDef.icon.startsWith("/") ? itemDef.icon : `/items/${itemDef.icon}`)
                        : "/items/default_item.png";
                      const itemName = itemDef?.name || drop.id;
                      
                      return (
                        <div 
                          key={idx} 
                          className="flex items-center gap-2 p-1 rounded"
                        >
                          <img
                            src={iconPath}
                            alt={itemName}
                            className="w-5 h-5 object-contain border border-white/40 bg-black/40"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          <span className="text-gray-400 flex-1 hover:text-[#b8860b] transition-colors">
                            {itemName}:
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

              {/* Кнопка закриття */}
              <div className="flex justify-center mt-2 pt-2 border-t border-white/40">
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
    </div>
  );
}
