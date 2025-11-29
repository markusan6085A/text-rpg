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
      <div className="min-h-screen bg-black flex items-center justify-center text-xs text-gray-400">
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
    <div className="min-h-screen bg-black flex items-start justify-center">
      <div className="w-full max-w-md mt-5 mb-10 px-3">
        <div className="rounded-[18px] border border-[#7a6040] bg-gradient-to-b from-[#2b2015] via-[#19130d] to-[#0e0a07] shadow-[0_26px_80px_rgba(0,0,0,0.95)] overflow-hidden">
          <div className="bg-[#20160f] border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#f4e2b8] tracking-[0.12em] uppercase">
            Онлайн игра Линейдж
          </div>

          <div className="px-4 pt-3 pb-2 text-[11px] text-[#f4e2b8] bg-[#19130d] border-b border-black/70">
            <div className="flex items-start mb-2">
              <div>
                <div className="font-semibold text-[12px]">
                  {hero.name}, {level} ур.
                </div>
              </div>
            </div>

            <div className="space-y-0 mt-1">
              {/* CP */}
              <div className="flex items-center gap-2">
                <span className="w-7 text-[10px] text-[#caa777]">CP</span>
                <div className="w-24 h-[0.7rem] bg-[#2c241b] rounded-[3px] overflow-hidden relative shadow-[0_0_7px_rgb(0,0,0)]">
                  <div
                    className="h-full bg-[#d9963b] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (cp / maxCp) * 100).toFixed(0)}%`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[#241809] font-semibold">
                    {cp}/{maxCp}
                  </div>
                </div>
              </div>

              {/* HP */}
              <div className="flex items-center gap-2">
                <span className="w-7 text-[10px] text-[#caa777]">HP</span>
                <div className="w-24 h-[0.7rem] bg-[#2c1b1b] rounded-[3px] overflow-hidden relative shadow-[0_0_7px_rgb(0,0,0)]">
                  <div
                    className={`h-full bg-[#c9423b] transition-all duration-500 ${
                      lowHp ? "animate-pulse" : ""
                    }`}
                    style={{
                      width: `${Math.min(100, (hp / maxHp) * 100).toFixed(0)}%`,
                    }}
                  />
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-[9px] font-semibold ${
                      lowHp ? "text-[#ffe4e4]" : "text-[#330e0e]"
                    }`}
                  >
                    {hp}/{maxHp}
                  </div>
                </div>
              </div>

              {/* MP */}
              <div className="flex items-center gap-2">
                <span className="w-7 text-[10px] text-[#caa777]">MP</span>
                <div className="w-24 h-[0.7rem] bg-[#202637] rounded-[3px] overflow-hidden relative shadow-[0_0_7px_rgb(0,0,0)]">
                  <div
                    className="h-full bg-[#4d7ad9] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (mp / maxMp) * 100).toFixed(0)}%`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[#0f1728] font-semibold">
                    {mp}/{maxMp}
                  </div>
                </div>
              </div>

              {/* EXP */}
              <div className="flex items-center gap-2">
                <span className="w-7 text-[10px] text-[#caa777]">Exp</span>
                <div className="w-24 h-[0.7rem] bg-[#22321f] rounded-[3px] overflow-hidden relative shadow-[0_0_7px_rgb(0,0,0)]">
                  <div
                    className="h-full bg-[#4f9c3b] transition-all duration-500"
                    style={{ width: `${expPercent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[#0f1b0b] font-semibold">
                    {formatNumber(expCurrent)} / {formatNumber(expToNext)} (
                    {expPercent}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Название города */}
          <div className="px-4 py-3 bg-[#22170c9a] border-b border-black/70 text-[12px] text-[#cfcfcc] flex items-center gap-2">
            <span className="text-[15px]">🏰</span>
            <span className="font-semibold">Talking Island Village</span>
          </div>

          {/* Сервисы */}
          <div className="px-4 py-3 bg-[#1d1208] border-b border-black/70 text-[12px] text-[#645b45]">
            <div className="border-t border-[#61513b]/60 pt-2 space-y-1.5">

              <button
                className="w-full text-left text-[12px] text-[#e0c68a] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => navigate("/gk")}
              >
                ✧ Телепорт
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f01912] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Арена PVP сражений")}
              >
                🩸 Арена PVP сражений
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Статистика PvP Арены")}
              >
                🧾 Статистика PvP Арены
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("TvT Менеджер")}
              >
                ⚔️ TvT Менеджер
              </button>

              <button
                className="w-full text-left text-[12px] text-[#d6922de5] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Магическая статуя")}
              >
                🔮 Магическая статуя{" "}
                <span className="text-[11px] text-[#c7ad80]">
                  — бесплатный бафф
                </span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#99e074] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text-[#bbff97]"
                onClick={() => openFeature("Магазин вещей")}
              >
                🪙 Магазин вещей
              </button>

              <button
                className="w-full text-left text-[12px] text-[#c29835] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Рынок")}
              >
                ⚖ Рынок (2){" "}
                <span className="text-[11px] text-[#c7ad80]">
                  — покупка, продажа вещей
                </span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#e7e4de] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Гильдия магов")}
              >
                🧙‍♂️ Гильдия магов{" "}
                <span className="text-[11px] text-[#c7ad80]">
                  — изучение скилов и квесты
                </span>
              </button>

              <button
                className="w-full text-left text-[12px] text-[#e2dfd7] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Склад")}
              >
                📦 Склад
              </button>

              <button
                className="w-full text-left text-[12px] text-[#99e074] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text-[#bbff97]"
                onClick={() => openFeature("Рыбак")}
              >
                🎣 Рыбак (+)
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Манор")}
              >
                🌾 Манор
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("7 Печатей")}
              >
                📜 7 Печатей
              </button>

              <button
                className="w-full text-left text-[12px] text-[#e6ba53] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Олимпиада")}
              >
                🎖 Олимпиада
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Менеджер Олимпиады")}
              >
                🏆 Менеджер Олимпиады
              </button>

              <button
                className="w-full text-left text-[12px] text-[#aca9a4] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Отважный охотник")}
              >
                🗡 Отважный охотник
              </button>

              <button
                className="w-full text-left text-[12px] text-[#f4e2b8] py-1.5 border-b border-dotted border-[#5b4b35]/60 hover:text:white"
                onClick={() => openFeature("Рейд-Боссы (инф)")}
              >
                💀 Рейд-Боссы (инф)
              </button>

              <button
                className="w-full text-left text-[12px] text-[#ebe6da] py-1.5 hover:text:white"
                onClick={() => openFeature("Кланы")}
              >
                🛡 Кланы
              </button>
            </div>
          </div>

          {/* нижнє меню */}
          <div className="px-3 py-2 bg-[#120d08] border-t border-black/80">
            <div className="grid grid-cols-4 gap-1 text-[11px] text-[#f4e2b8]">
              <button
                onClick={() => openFeature("Почта")}
                className="rounded-full bg-[#20160f] py-0.5 border border-black/60 hover:bg-[#291c12]"
              >
                Почта
              </button>
              <button
                onClick={() => openFeature("Чат")}
                className="rounded-full bg-[#20160f] py-0.5 border border-black/60 hover:bg-[#291c12]"
              >
                Чат
              </button>
              <button
                onClick={() => openFeature("Форум")}
                className="rounded-full bg-[#20160f] py-0.5 border border-black/60 hover:bg-[#291c12]"
              >
                Форум
              </button>
              <button
                onClick={handleToCharacter}
                className="rounded-full bg-[#20160f] py-0.5 border border-black/60 hover:bg-[#291c12]"
              >
                Персонаж
              </button>

              <button
                onClick={() => openFeature("Клан")}
                className="rounded-full bg-[#20160f] py-0.5 border border-black/60 hover:bg-[#291c12]"
              >
                Клан
              </button>
              <button
                onClick={handleToCity}
                className="rounded-full bg-[#3b2a17] py-0.5 border border-yellow-500/70 text-yellow-200 shadow-[0_4px_14px_rgба(0,0,0,0.9)]"
              >
                Город
              </button>
              <button
                onClick={handleRecipes}
                className="rounded-full bg-[#20160f] py-0.5 border border-black/60 hover:bg-[#291c12]"
              >
                Книга рецептов
              </button>
              <button
                onClick={() => navigate("/news")}
                className="rounded-full bg-[#20160f] py-0.5 border border-black/60 hover:bg-[#291c12]"
              >
                Новости
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default City;
