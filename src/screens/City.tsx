// src/screens/City.tsx
import React from "react";
import { useHeroStore } from "../state/heroStore";
import { useAdminStore } from "../state/adminStore";
import { setString } from "../state/persistence";
import { loadBattle } from "../state/battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../state/battle/helpers";
import { getPreviousCity } from "../utils/locationNavigation";
import { cities as WORLD_CITIES, getCityById, DEFAULT_PLAYER_CITY_ID } from "../data/world";
import { GLUDIO_SHADOW_WEAPON_QUEST_ID } from "../data/quests";
import { mergeActiveQuestsForUi } from "../utils/quests/mergeActiveQuestsForUi";
import { isFishingReady } from "../state/fishing/fishingPersistence";
import {
  getCityUiVariant,
  isWarmCityUi,
  setCityUiVariant,
  type CityUiVariant,
} from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import { displayCityName } from "../utils/worldDisplay";
import { getGameSettings } from "../state/gameSettings";
import { useGameSettingsVersion } from "../hooks/useGameSettingsVersion";

interface CityProps {
  navigate: (path: string) => void;
}

const formatNumber = (value: number) =>
  value.toLocaleString("ru-RU").replace(/\s/g, ".");

const City: React.FC<CityProps> = ({ navigate }) => {
  useGameSettingsVersion();
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const [cityUi, setCityUi] = React.useState<CityUiVariant>(() =>
    getCityUiVariant(),
  );
  const [shadowWeaponQuestHintDismissed, setShadowWeaponQuestHintDismissed] = React.useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem("gludio_shadow_weapon_quest_hint") === "1"
  );
  const isL2 = isWarmCityUi(cityUi);

  const persistCityUi = (v: CityUiVariant) => {
    setCityUiVariant(v);
    setCityUi(v);
  };

  const svcBtn = (classes: string) =>
    isL2
      ? `w-full text-left text-[11px] py-1.5 px-2.5 mb-1.5 rounded-md flex items-center gap-2 bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.1),0_2px_10px_rgba(0,0,0,0.5)] hover:border-[#c7ad80]/50 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150 ${classes}`
      : `w-full text-left text-[12px] py-1.5 border-b border-solid border-black/60 flex items-center gap-2 ${classes}`;

  const ico = isL2 ? "w-3.5 h-3.5 object-contain shrink-0" : "w-3 h-3 object-contain shrink-0";

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

  const l2Frame = L2_WARM_OUTER_FRAME;

  const currentCityId =
    String((hero as any)?.heroJson?.currentCityId || "").trim() || DEFAULT_PLAYER_CITY_ID;
  const activeQuestsCity = mergeActiveQuestsForUi(hero.activeQuests, (hero as any)?.heroJson?.activeQuests);
  const showShadowWeaponQuestHintCity =
    level >= 19 &&
    currentCityId === "l2dop_gludio" &&
    !(hero.completedQuests || []).includes(GLUDIO_SHADOW_WEAPON_QUEST_ID) &&
    !activeQuestsCity.some((a) => a.questId === GLUDIO_SHADOW_WEAPON_QUEST_ID) &&
    !shadowWeaponQuestHintDismissed;

  const primaryCityHintBtn = isL2
    ? "px-3 py-1.5 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-[11px] text-[#e8c56e] hover:border-[#c7ad80]/45"
    : "px-3 py-1 rounded border border-[#c7ad80]/50 text-[11px] text-[#f4e2b8] hover:bg-white/5";

  return (
    <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1` : ""}>
      {/* Приветствие + перемикач теми в шапці блоку */}
      <div
        className={
          isL2
            ? "px-3 py-4 mt-2 mb-1 mx-0 rounded-lg border border-amber-800/25 bg-black/22 shadow-[inset_0_1px_0_rgba(255,220,170,0.06)]"
            : "px-4 py-3 border-b border-black/70"
        }
      >
        <div
          className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 ${
            isL2 ? "mb-3" : "mb-3"
          }`}
        >
          <div
            className={
              isL2
                ? "text-center sm:text-left space-y-1.5 font-semibold text-[13px] text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_18px_rgba(184,134,11,0.4)] flex-1 min-w-0"
                : "text-orange-400 text-center sm:text-left space-y-1 flex-1 min-w-0"
            }
          >
            <div>Ласкаво просимо до міста.</div>
            <div className={isL2 ? "font-normal text-[#d4b878] text-[12px]" : ""}>
              Оберіть необхідний сервіс зі списку нижче.
            </div>
          </div>
          {/* Перемикач вигляду (той самий ключ localStorage — інші екрани лише читають) */}
          <div
            className={
              isL2
                ? "flex flex-wrap items-center justify-center sm:justify-end gap-1.5 shrink-0 rounded-md border border-[#5c4a32]/45 px-2 py-1.5 bg-black/28"
                : "flex flex-wrap items-center justify-center sm:justify-end gap-1.5 shrink-0"
            }
          >
            <span className="text-[9px] text-[#8a7a60] w-full sm:w-auto text-center sm:text-right leading-none">
              Тема UI:
            </span>
            <button
              type="button"
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                cityUi === "classic"
                  ? "border-amber-500/60 bg-amber-900/30 text-[#f4e2b8]"
                  : "border-white/10 text-[#9a8a70] hover:border-amber-700/40"
              }`}
              onClick={() => persistCityUi("classic")}
            >
              Класичний
            </button>
            <button
              type="button"
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                cityUi === "l2"
                  ? "border-amber-500/60 bg-amber-900/30 text-[#f4e2b8]"
                  : "border-white/10 text-[#9a8a70] hover:border-amber-700/40"
              }`}
              onClick={() => persistCityUi("l2")}
            >
              L2
            </button>
            <button
              type="button"
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                cityUi === "l2test"
                  ? "border-cyan-500/55 bg-cyan-950/40 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                  : "border-white/10 text-[#9a8a70] hover:border-cyan-700/40"
              }`}
              onClick={() => persistCityUi("l2test")}
            >
              Тест
            </button>
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
                ? "text-center text-[11px] text-[#d4c4a8] tracking-[0.14em] uppercase font-medium [text-shadow:0_0_10px_rgba(199,173,128,0.35)]"
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

      {/* Назва міста — той самий патерн, що шапка локації в Location.tsx */}
      {(() => {
        const cityId =
          (hero?.heroJson as any)?.currentCityId ||
          getPreviousCity() ||
          DEFAULT_PLAYER_CITY_ID;
        const currentCity = getCityById(cityId) || getCityById(DEFAULT_PLAYER_CITY_ID);
        const cityLabel =
          getGameSettings().language === "uk" ? "Місто" : "Город";
        return (
          <div
            className={
              isL2
                ? "mb-2 mx-0 rounded-lg border border-[#5c4a32]/45 bg-black/22 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                : "px-4 py-3 border-b border-black/70 text-[12px] text-[#cfcfcc] flex items-center gap-2"
            }
          >
            {isL2 ? (
              <>
                <div className="text-[10px] uppercase tracking-wider text-[#8a7a60]">
                  {cityLabel}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[#e8c56e] text-[15px] font-semibold leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
                  <img
                    src="/assets/gk.jpg"
                    alt=""
                    className="w-4 h-4 object-contain shrink-0 opacity-90 rounded-sm"
                  />
                  <span>{currentCity ? displayCityName(currentCity) : "—"}</span>
                </div>
              </>
            ) : (
              <>
                <img
                  src="/assets/gk.jpg"
                  alt={currentCity?.name}
                  className="w-6 h-6 object-contain"
                />
                <span className="font-semibold tracking-wide">
                  {currentCity ? displayCityName(currentCity) : "—"}
                </span>
              </>
            )}
          </div>
        );
      })()}

      {showShadowWeaponQuestHintCity ? (
        <div
          className={
            isL2
              ? "mx-0 mb-2 rounded-lg border border-[#5c4a32]/50 bg-black/25 px-3 py-2.5 text-[11px] text-[#d4c4a8]"
              : "mx-4 mb-2 rounded border border-white/20 bg-black/30 px-2 py-2 text-[11px] text-[#c7ad80]"
          }
        >
          <div className="font-semibold text-[#c9a44c] mb-1 flex items-center gap-2">
            <img src="/nps/144.png" alt="" className="w-4 h-4 object-contain shrink-0 rounded-sm opacity-95" />
            Помощник
          </div>
          <p className="mb-2 opacity-95 leading-snug">
            На 19 уровне доступен квест «Теневой контракт — оружие D-grade»: вкладка «Квесты», раздел Глудио. Награда —
            теневая D-grade зброя на выбор (+40 к атаке к магазинной) и свитки заточки.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryCityHintBtn} onClick={() => navigate("/quests")}>
              Квесты
            </button>
            <button
              type="button"
              className={isL2 ? "text-[10px] text-[#8a7a60] hover:text-[#d4c4a8]" : "text-[10px] text-gray-500"}
              onClick={() => {
                try {
                  localStorage.setItem("gludio_shadow_weapon_quest_hint", "1");
                } catch {
                  /* ignore */
                }
                setShadowWeaponQuestHintDismissed(true);
              }}
            >
              Скрыть
            </button>
          </div>
        </div>
      ) : null}

      {/* Сервисы */}
      <div
        className={
          isL2
            ? "px-2 py-2.5 pb-4 text-[11px] text-[#a89878]"
            : "px-4 py-3 border-b border-black/70 text-[12px] text-[#645b45]"
        }
      >
        <div className={isL2 ? "pt-0.5 space-y-0" : "border-t border-black/60 pt-2 space-y-1.5"}>
          {currentCityId === "l2dop_gludio" ? (
            <button
              className={svcBtn("text-[#6b5b8a] hover:text-[#e0d4ff]")}
              onClick={() => {
                window.scrollTo(0, 0);
                navigate("/quests");
              }}
            >
              <img src="/nps/144.png" alt="" className={ico} />
              <span>
                Странник теней — квест оружия{" "}
                <span className="text-[10px] text-[#808080]">(D-grade, 19+)</span>
              </span>
            </button>
          ) : null}

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
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/arena");
            }}
          >
            <img src="/assets/battles.png" alt="Арена PVP сражений" className={ico} />
            <span>Арена PVP сражений</span>
          </button>

          <button
            className={svcBtn("text-[#808080] hover:text-white")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/pvp-stats");
            }}
          >
            <img src="/assets/rate.png" alt="Статистика PvP Арены" className={ico} />
            <span>Статистика PvP Арены</span>
          </button>

          <button
            className={svcBtn("text-[#ff8c00] hover:text-white")}
            onClick={() => {
              updateHero({ location: "" } as any);
              window.scrollTo(0, 0);
              navigate("/tvt");
            }}
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
            className={svcBtn("text-[#c4a5f5] hover:text-white")}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/epic-bosses");
            }}
          >
            <img src="/assets/quest.png" alt="Епік-боси" className={ico} />
            <span>
              Информация: эпик-боссы{" "}
              <span className="text-[11px] text-[#808080]">— локации, дроп, респ</span>
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
            onClick={() => {
              updateHero({ location: "" } as any);
              window.scrollTo(0, 0);
              navigate("/market");
            }}
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
            className={svcBtn("text-[#c9a44c] hover:text-[#f4e2b8]")}
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
            className={svcBtn("text-[#7d9b7a] hover:text-[#c8e4c4]")}
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
            className={svcBtn("text-[#9d8265] hover:text-[#e8d5c4]")}
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
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/craft/resources");
            }}
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
                  ? "w-full text-left text-[11px] text-[#c7ad80] py-1.5 px-2.5 mt-1.5 rounded-md border border-amber-800/35 bg-black/25 hover:bg-black/35 hover:text-[#e8d5b5] flex items-center gap-2"
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
