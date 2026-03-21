// src/screens/City.tsx
import React from "react";
import { useHeroStore } from "../state/heroStore";
import { useAdminStore } from "../state/adminStore";
import { setString } from "../state/persistence";
import { loadBattle } from "../state/battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../state/battle/helpers";
import { getPreviousCity } from "../utils/locationNavigation";
import { cities as WORLD_CITIES, getCityById } from "../data/world";
import { isFishingReady } from "../state/fishing/fishingPersistence";
import {
  getCityUiVariant,
  setCityUiVariant,
  type CityUiVariant,
} from "../utils/cityUiVariant";

interface CityProps {
  navigate: (path: string) => void;
}

const formatNumber = (value: number) =>
  value.toLocaleString("ru-RU").replace(/\s/g, ".");

const City: React.FC<CityProps> = ({ navigate }) => {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const [cityUi, setCityUi] = React.useState<CityUiVariant>(() =>
    getCityUiVariant(),
  );
  const isL2 = cityUi === "l2";

  const persistCityUi = (v: CityUiVariant) => {
    setCityUiVariant(v);
    setCityUi(v);
  };

  const svcBtn = (classes: string) =>
    isL2
      ? `w-full text-left text-[12px] py-2.5 px-3 mb-2 rounded-md flex items-center gap-2.5 bg-gradient-to-b from-[#2a3344] to-[#141920] border border-[#6b5c3e]/70 shadow-[inset_0_1px_0_rgba(255,220,170,0.07),0_4px_14px_rgba(0,0,0,0.55)] hover:border-amber-500/45 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150 ${classes}`
      : `w-full text-left text-[12px] py-1.5 border-b border-solid border-black/60 flex items-center gap-2 ${classes}`;

  const ico = isL2 ? "w-4 h-4 object-contain shrink-0" : "w-3 h-3 object-contain shrink-0";

  // Перевірка адміна при відкритті міста (для кнопки «Забафать» в соціальному списку)
  React.useEffect(() => {
    useAdminStore.getState().checkAdmin().catch(() => {});
  }, []);

  React.useEffect(() => {
    if (hero) {
      const currentLocation = String((hero as any)?.location ?? (hero as any)?.heroJson?.location ?? "").trim();
      if (currentLocation !== "") {
        updateHero({ location: "" } as any);
        import("../utils/api").then(({ sendHeartbeat }) => {
           sendHeartbeat(hero.id, "").catch(() => {});
        });
      }
    }
  }, [hero?.id]);

  if (!hero) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
        <div className="w-5 h-5 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin" />
        <span className="text-xs opacity-70">...</span>
      </div>
    );
  }

  const level = hero.level ?? 1;

  // Бафи міста/статуї: показуємо max з бафами, щоб lowHp і відображення були коректні
  const now = Date.now();
  const savedBattle = loadBattle(hero.name);
  const cityBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
  const baseMax = {
    maxHp: hero.maxHp || 1,
    maxMp: hero.maxMp || 1,
    maxCp: hero.maxCp ?? Math.round((hero.maxHp || 1) * 0.6),
  };
  const buffed = computeBuffedMaxResources(baseMax, cityBuffs);
  const maxHp = buffed.maxHp;
  const maxMp = buffed.maxMp;
  const maxCp = buffed.maxCp;

  const hp = hero.hp ?? maxHp;
  const mp = hero.mp ?? maxMp;
  const cp = hero.cp ?? maxCp;

  const lowHp = maxHp > 0 && hp / maxHp < 0.3;

  // Діагностика: якщо buffedMaxHp > hero.maxHp — реген може зупинятися на hero.maxHp, полоса не 100%
  const buffedMaxHp = maxHp;

  // 🔥 ВИДАЛЕНО: Регенерація HP/MP/CP - вона вже є в StatusBars (глобальний компонент)
  // Це запобігає дублюванню регенерації та зайвим збереженням
  // StatusBars вже обробляє регенерацію для всіх сторінок

  const handleToCharacter = () => {
    updateHero({ location: "" } as any);
    window.scrollTo(0, 0);
    navigate("/character");
  };
  const handleToStats = () => {
    updateHero({ location: "" } as any);
    window.scrollTo(0, 0);
    navigate("/stats");
  };
  const handleToCity = () => {
    updateHero({ location: "" } as any);
    window.scrollTo(0, 0);
    navigate("/city");
  };

  const openFeature = (title: string) => {
    updateHero({ location: "" } as any);
    window.scrollTo(0, 0);
    setString("l2_last_feature", title);
    navigate("/wip");
  };

  const handleRecipes = () => openFeature("Книга рецептов");

  const l2Frame =
    "rounded-xl overflow-hidden border border-amber-700/40 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_55%_at_50%_-10%,rgba(55,90,130,0.38)_0%,transparent_52%),linear-gradient(180deg,#121820_0%,#06080c_100%)]";

  return (
    <div className={isL2 ? `${l2Frame} mx-0.5 my-1` : ""}>
      {/* Перемикач вигляду — зберігається в localStorage (ключ l2_city_ui_variant) */}
      <div
        className={
          isL2
            ? "flex flex-wrap items-center justify-center gap-2 px-3 py-2.5 border-b border-amber-800/35 bg-black/20"
            : "flex flex-wrap items-center justify-center gap-2 px-3 py-2 border-b border-black/50"
        }
      >
        <span className="text-[10px] text-[#8a7a60] w-full text-center sm:w-auto">
          Вигляд «Місто»:
        </span>
        <button
          type="button"
          className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
            !isL2
              ? "border-amber-500/60 bg-amber-900/30 text-[#f4e2b8]"
              : "border-white/10 text-[#9a8a70] hover:border-amber-700/40"
          }`}
          onClick={() => persistCityUi("classic")}
        >
          Класичний
        </button>
        <button
          type="button"
          className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
            isL2
              ? "border-amber-500/60 bg-amber-900/30 text-[#f4e2b8]"
              : "border-white/10 text-[#9a8a70] hover:border-amber-700/40"
          }`}
          onClick={() => persistCityUi("l2")}
        >
          L2-стиль (тест)
        </button>
      </div>

      {/* Приветствие */}
      <div
        className={
          isL2
            ? "px-4 py-4 mx-2 mt-2 mb-1 rounded-lg border border-amber-800/25 bg-black/22 shadow-[inset_0_1px_0_rgba(255,220,170,0.06)]"
            : "px-4 py-3 border-b border-black/70"
        }
      >
        <div
          className={
            isL2
              ? "text-center space-y-2 mb-2 font-semibold text-[13px] text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_18px_rgba(184,134,11,0.4)]"
              : "text-orange-400 text-center space-y-1 mb-3"
          }
        >
          <div>Ласкаво просимо до міста.</div>
          <div className={isL2 ? "font-normal text-[#d4b878] text-[12px]" : ""}>
            Оберіть необхідний сервіс зі списку нижче.
          </div>
        </div>

        <div
          className={
            isL2
              ? "border-t border-amber-900/30 pt-3 pb-1"
              : "border-t border-black/70 pt-2 pb-2"
          }
        >
          <div
            className={
              isL2
                ? "text-center text-[11px] text-sky-300/90 tracking-[0.14em] uppercase font-medium [text-shadow:0_0_12px_rgba(125,211,252,0.25)]"
                : "text-center text-[11px] text-[#87ceeb] tracking-[0.12em] uppercase"
            }
          >
            Онлайн игра Линейдж
          </div>
        </div>
        {!isL2 && <div className="border-b border-black/70"></div>}
        {import.meta.env.DEV && (
          <div className="text-[10px] text-gray-500 px-2 pt-1">
            maxHp: {hero.maxHp} | buffed: {buffedMaxHp}
          </div>
        )}
      </div>

      {/* Название города */}
      {(() => {
        const cityId =
          (hero?.heroJson as any)?.currentCityId ||
          getPreviousCity() ||
          WORLD_CITIES[0]?.id;
        const currentCity = getCityById(cityId) || WORLD_CITIES[0];
        return (
          <div
            className={
              isL2
                ? "mx-2 mb-1 px-3 py-3 rounded-lg border border-amber-800/30 bg-gradient-to-b from-[#1c2430]/95 to-[#0e1218]/95 text-[13px] text-[#d4c4a8] flex items-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "px-4 py-3 border-b border-black/70 text-[12px] text-[#cfcfcc] flex items-center gap-2"
            }
          >
            <img
              src="/assets/gk.jpg"
              alt={currentCity?.name}
              className={isL2 ? "w-7 h-7 object-contain" : "w-6 h-6 object-contain"}
            />
            <span className="font-semibold tracking-wide">
              {currentCity?.name || "—"}
            </span>
          </div>
        );
      })()}

      {/* Сервисы */}
      <div
        className={
          isL2
            ? "px-3 py-3 pb-5 text-[12px] text-[#8a7d68]"
            : "px-4 py-3 border-b border-black/70 text-[12px] text-[#645b45]"
        }
      >
        <div className={isL2 ? "pt-1 space-y-0" : "border-t border-black/60 pt-2 space-y-1.5"}>
          <button
            className={svcBtn("text-[#2d5016] hover:text-white")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/gk");
            }}
          >
            <img src="/assets/travel.png" alt="Телепорт" className={ico} />
            <span>Телепорт</span>
          </button>

          <button
            className={svcBtn("text-[#f01912] hover:text-white")}
            onClick={() => openFeature("Арена PVP сражений")}
          >
            <img src="/assets/battles.png" alt="Арена PVP сражений" className={ico} />
            <span>Арена PVP сражений</span>
          </button>

          <button
            className={svcBtn("text-[#808080] hover:text-white")}
            onClick={() => openFeature("Статистика PvP Арены")}
          >
            <img src="/assets/rate.png" alt="Статистика PvP Арены" className={ico} />
            <span>Статистика PvP Арены</span>
          </button>

          <button
            className={svcBtn("text-[#ff8c00] hover:text-white")}
            onClick={() => openFeature("TvT Менеджер")}
          >
            <img src="/assets/quest.png" alt="TvT Менеджер" className={ico} />
            <span>TvT Менеджер</span>
          </button>

          <button
            className={svcBtn("text-[#9d4edd] hover:text-white")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/magic-statue");
            }}
          >
            <img src="/assets/news.png" alt="Магическая статуя" className={ico} />
            <span>
              Магическая статуя{" "}
              <span className="text-[11px] text-[#808080]">
                — бесплатный бафф
              </span>
            </span>
          </button>

          <button
            className={svcBtn("text-[#99e074] hover:text-[#bbff97]")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/shop");
            }}
          >
            <img src="/assets/col.png" alt="Магазин вещей" className={ico} />
            <span>Магазин вещей</span>
          </button>

          <button
            className={svcBtn("text-[#ffd700] hover:text-[#ffed4e]")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/gm-shop");
            }}
          >
            <img src="/icons/col.png" alt="GM-шоп" className={ico} />
            <span>GM-шоп</span>
          </button>

          <button
            className={svcBtn("text-[#c29835] hover:text-white")}
            onClick={() => openFeature("Рынок")}
          >
            <img src="/assets/quest.png" alt="Рынок" className={ico} />
            <span>
              Рынок (2){" "}
              <span className="text-[11px] text-[#808080]">
                — покупка, продажа вещей
              </span>
            </span>
          </button>

          <button
            className={svcBtn("text-[#3b82f6] hover:text-white")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/guild");
            }}
          >
            <img src="/assets/battles.png" alt="Гильдия магов" className={ico} />
            <span>
              Гильдия магов{" "}
              <span className="text-[11px] text-[#808080]">
                — изучение скилов →
              </span>
            </span>
          </button>

          <button
            className={svcBtn("text-[#facc15] hover:text-white")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/additional-skills");
            }}
          >
            <img src="/assets/battles.png" alt="Дополнительные скилы" className={ico} />
            <span>
              Дополнительные скилы{" "}
              <span className="text-[11px] text-[#808080]">
                — изучение дополнительных скилов
              </span>
            </span>
          </button>

          <button
            className={svcBtn("text-[#ff8c00] hover:text-white")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/warehouse");
            }}
          >
            <img src="/assets/inventory.png" alt="Склад" className={ico} />
            <span>Склад</span>
          </button>

          <button
            className={svcBtn("text-[#3b82f6] hover:text-[#bbff97]")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/fishing");
            }}
          >
            <img src="/assets/quest.png" alt="Рыбак" className={ico} />
            <span>
              Рыбак
              {isFishingReady((hero?.heroJson as any)?.fishingSession ?? null) && (
                <span className="text-green-500 font-bold ml-0.5">+</span>
              )}
            </span>
          </button>

          <button
            className={svcBtn("text-[#1e40af] hover:text-white")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/tattoo-artist");
            }}
          >
            <img src="/assets/travel.png" alt="Татуировщик" className={ico} />
            <span>Татуировщик</span>
          </button>

          <button
            className={svcBtn("text-[#fef08a] hover:text-white")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/seven-seals");
            }}
          >
            <img src="/assets/rate.png" alt="7 Печатей" className={ico} />
            <span>7 Печатей</span>
          </button>

          <button
            className={svcBtn("text-[#e6ba53] hover:text-white")}
            onClick={() => openFeature("Олимпиада")}
          >
            <img src="/assets/rate.png" alt="Олимпиада" className={ico} />
            <span>Олимпиада</span>
          </button>

          <button
            className={svcBtn("text-[#800020] hover:text-white")}
            onClick={() => openFeature("Менеджер Олимпиады")}
          >
            <img src="/assets/news.png" alt="Менеджер Олимпиады" className={ico} />
            <span>Менеджер Олимпиады</span>
          </button>

          <button
            className={svcBtn("text-[#aca9a4] hover:text-white")}
            onClick={() => openFeature("Отважный охотник")}
          >
            <img src="/assets/battles.png" alt="Отважный охотник" className={ico} />
            <span>Отважный охотник</span>
          </button>

          <button
            className={svcBtn("text-[#ffb347] hover:text-white")}
            onClick={() => openFeature("Крафт-ресурси")}
          >
            <img src="/assets/news.png" alt="Крафт-ресурси" className={ico} />
            <span>Крафт-ресурси</span>
          </button>

          <button
            className={
              isL2
                ? svcBtn("text-[#ffd700] hover:text-amber-100")
                : "w-full text-left text-[12px] text-[#ffd700] py-1.5 hover:text-white flex items-center gap-2"
            }
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/clans");
            }}
          >
            <img src="/assets/ipvp.png" alt="Кланы" className={ico} />
            <span>Кланы</span>
          </button>

          {isAdmin && (
            <button
              className={
                isL2
                  ? "w-full text-left text-[12px] text-[#c7ad80] py-2.5 px-3 mt-2 rounded-md border border-amber-800/35 bg-black/25 hover:bg-black/35 hover:text-[#e8d5b5] flex items-center gap-2"
                  : "w-full text-left text-[12px] text-[#c7ad80] py-1.5 border-t border-[#c7ad80]/30 mt-2 pt-2 hover:text-[#e8d5b5] flex items-center gap-2"
              }
              onClick={() => navigate("/admin")}
            >
              <span>Адмін</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default City;
