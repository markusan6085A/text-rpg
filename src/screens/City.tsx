// src/screens/City.tsx
import React, { useEffect } from "react";
import { useHeroStore } from "../state/heroStore";

interface CityProps {
  navigate: (path: string) => void;
}

const formatNumber = (value: number) =>
  value.toLocaleString("ru-RU").replace(/\s/g, ".");

const City: React.FC<CityProps> = ({ navigate }) => {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);

  if (!hero) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400">
        Загрузка персонажа...
      </div>
    );
  }

  const level = hero.level ?? 1;

  const maxHp = hero.maxHp || 1;
  const maxMp = hero.maxMp || 1;
  const maxCp = hero.maxCp ?? Math.round(maxHp * 0.6);

  const hp = hero.hp ?? maxHp;
  const mp = hero.mp ?? maxMp;
  const cp = hero.cp ?? maxCp;

  const expCurrent = hero.exp ?? 0;
  const expToNext = 100000 + level * 7500;
  const expPercent =
    expToNext > 0 ? Math.min(100, Math.floor((expCurrent / expToNext) * 100)) : 0;

  const lowHp = hp / maxHp < 0.3;

  useEffect(() => {
    const interval = setInterval(() => {
      const baseMaxHp = hero.maxHp || 1;
      const baseMaxMp = hero.maxMp || 1;
      const baseMaxCp = hero.maxCp ?? Math.round(baseMaxHp * 0.6);

      const hpRegen = Math.max(1, Math.round(baseMaxHp * 0.02));
      const mpRegen = Math.max(1, Math.round(baseMaxMp * 0.03));
      const cpRegen = Math.max(1, Math.round(baseMaxCp * 0.05));

      const nextHp = Math.min(baseMaxHp, (hero.hp ?? baseMaxHp) + hpRegen);
      const nextMp = Math.min(baseMaxMp, (hero.mp ?? baseMaxMp) + mpRegen);
      const nextCp = Math.min(baseMaxCp, (hero.cp ?? baseMaxCp) + cpRegen);

      if (
        nextHp !== hero.hp ||
        nextMp !== hero.mp ||
        nextCp !== hero.cp ||
        baseMaxCp !== hero.maxCp
      ) {
        updateHero({
          hp: nextHp,
          mp: nextMp,
          cp: nextCp,
          maxCp: baseMaxCp,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hero, updateHero]);

  const handleToCharacter = () => navigate("/character");
  const handleToStats = () => navigate("/stats");
  const handleToCity = () => navigate("/city");

  const openFeature = (title: string) => {
    localStorage.setItem("l2_last_feature", title);
    navigate("/wip");
  };

  const handleRecipes = () => openFeature("Книга рецептов");

  return (
    <div className="w-full flex items-start justify-center">
      <div className="w-full max-w-md mt-5 mb-10 px-3">
          <div className="border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#f4e2b8] tracking-[0.12em] uppercase">
            Онлайн игра Линейдж
          </div>


          {/* Название города */}
          <div className="px-4 py-3 border-b border-black/70 text-[12px] text-[#cfcfcc] flex items-center gap-2">
            <img src="/assets/gk.jpg" alt="Talking Island Village" className="w-6 h-6 object-contain" />
            <span className="font-semibold">Talking Island Village</span>
          </div>

          {/* Сервисы */}
          <div className="px-4 py-3 border-b border-black/70 text-[12px] text-[#645b45]">
            <div className="border-t border-[#61513b]/60 pt-2 space-y-1.5">

              <button
                className="w-full text-left text-[12px] text-[#e0c68a] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => navigate("/gk")}
              >
                <img src="/assets/travel.png" alt="Телепорт" className="w-3 h-3 object-contain" />
                <span>Телепорт</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f01912] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Арена PVP сражений")}
              >
                <img src="/assets/battles.png" alt="Арена PVP сражений" className="w-3 h-3 object-contain" />
                <span>Арена PVP сражений</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Статистика PvP Арены")}
              >
                <img src="/assets/rate.png" alt="Статистика PvP Арены" className="w-3 h-3 object-contain" />
                <span>Статистика PvP Арены</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("TvT Менеджер")}
              >
                <img src="/assets/quest.png" alt="TvT Менеджер" className="w-3 h-3 object-contain" />
                <span>TvT Менеджер</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#d6922de5] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Магическая статуя")}
              >
                <img src="/assets/news.png" alt="Магическая статуя" className="w-3 h-3 object-contain" />
                <span>
                  Магическая статуя{" "}
                  <span className="text-[11px] text-[#c7ad80]">
                    — бесплатный бафф
                  </span>
                </span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#99e074] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text-[#bbff97] flex items-center gap-2"
                onClick={() => openFeature("Магазин вещей")}
              >
                <img src="/assets/col.png" alt="Магазин вещей" className="w-3 h-3 object-contain" />
                <span>Магазин вещей</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#c29835] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Рынок")}
              >
                <img src="/assets/quest.png" alt="Рынок" className="w-3 h-3 object-contain" />
                <span>
                  Рынок (2){" "}
                  <span className="text-[11px] text-[#c7ad80]">
                    — покупка, продажа вещей
                  </span>
                </span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#e7e4de] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => navigate("/guild")}
              >
                <img src="/assets/battles.png" alt="Гильдия магов" className="w-3 h-3 object-contain" />
                <span>
                  Гильдия магов{" "}
                  <span className="text-[11px] text-[#c7ad80]">
                    — изучение скилов и квесты
                  </span>
                </span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#e2dfd7] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Склад")}
              >
                <img src="/assets/inventory.png" alt="Склад" className="w-3 h-3 object-contain" />
                <span>Склад</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#99e074] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text-[#bbff97] flex items-center gap-2"
                onClick={() => openFeature("Рыбак")}
              >
                <img src="/assets/quest.png" alt="Рыбак" className="w-3 h-3 object-contain" />
                <span>Рыбак (+)</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Манор")}
              >
                <img src="/assets/travel.png" alt="Манор" className="w-3 h-3 object-contain" />
                <span>Манор</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("7 Печатей")}
              >
                <img src="/assets/rate.png" alt="7 Печатей" className="w-3 h-3 object-contain" />
                <span>7 Печатей</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#e6ba53] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Олимпиада")}
              >
                <img src="/assets/rate.png" alt="Олимпиада" className="w-3 h-3 object-contain" />
                <span>Олимпиада</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Менеджер Олимпиады")}
              >
                <img src="/assets/news.png" alt="Менеджер Олимпиады" className="w-3 h-3 object-contain" />
                <span>Менеджер Олимпиады</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#aca9a4] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Отважный охотник")}
              >
                <img src="/assets/battles.png" alt="Отважный охотник" className="w-3 h-3 object-contain" />
                <span>Отважный охотник</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Рейд-Боссы (инф)")}
              >
                <img src="/assets/news.png" alt="Рейд-Боссы" className="w-3 h-3 object-contain" />
                <span>Рейд-Боссы (инф)</span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#ebe6da] py-1.5 hover:text:white flex items-center gap-2"
                onClick={() => openFeature("Кланы")}
              >
                <img src="/assets/ipvp.png" alt="Кланы" className="w-3 h-3 object-contain" />
                <span>Кланы</span>
              </button>
            </div>
          </div>

      </div>
    </div>
  );
};

export default City;
