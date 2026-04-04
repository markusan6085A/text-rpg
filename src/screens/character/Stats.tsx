import React, { useState, useEffect, useMemo } from "react";
import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { getCritMultiplier, getSkillCritMultiplier } from "../../state/battle/actions/useSkill/helpers";
import { useHeroStore } from "../../state/heroStore";
import { PlayerNameWithEmblem } from "../../components/PlayerNameWithEmblem";
import { getActiveSevenSealsRank, getSevenSealsBonusFromHero } from "../../utils/sevenSealsBonus";
import { useBattleStore } from "../../state/battle/store";
import { loadBattle } from "../../state/battle/persist";
import { cleanupBuffs } from "../../state/battle/helpers";
import { hasShieldEquipped, getShieldMitigationTotal } from "../../utils/shield/shieldDefense";
import CharacterBuffs from "./CharacterBuffs";
import { getMyClan } from "../../utils/api";
import { SET_STAT_FORMULAS_UI } from "../../data/sets/statBonusFormulas";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { getHeroResourceValues } from "../../utils/heroBuffedResources";
import { filterBuffsForHeroProfession } from "../../state/battle/loadout";
import { L2_WARM_OUTER_FRAME } from "../../utils/l2WarmLayoutClassNames";

export default function Stats() {
  const hero = useHeroStore((s) => s.hero);
  const battleBuffs = useBattleStore((s) => s.heroBuffs || []);
  const battleStatus = useBattleStore((s) => s.status);
  const [baseStats, setBaseStats] = useState<any>(null);
  const [combatStats, setCombatStats] = useState<any>(null);
  const [playerClan, setPlayerClan] = useState<any>(null);
  const [showSetFormulas, setShowSetFormulas] = useState(false);
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  // 🔥 Таймер — перерахунок статів щосекунди, щоб зникали бафи при простроченні
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!hero) return;

    // Використовуємо централізовану функцію для перерахунку всіх статів
    const now = Date.now();
    // Завантажуємо бафи з battle state (включаючи бафи статуї) навіть поза боєм
    const savedBattle = loadBattle(hero.name);
    const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
    const battleActiveBuffs = battleStatus === "fighting" 
      ? cleanupBuffs(battleBuffs, now) 
      : savedBuffs;
    
    // 🔥 КРИТИЧНО: Також завантажуємо бафи з heroJson.heroBuffs (з сервера)
    const heroJson = (hero as any)?.heroJson || {};
    const heroJsonBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
    const activeHeroJsonBuffs = heroJsonBuffs.filter((b: any) => {
      if (!b.expiresAt) return false;
      return b.expiresAt > now;
    });
    
    // Об'єднуємо бафи з обох джерел (уникаємо дублікатів за id)
    const allActiveBuffs = [...battleActiveBuffs, ...activeHeroJsonBuffs];
    const uniqueBuffs = allActiveBuffs.filter((buff, index, self) => 
      index === self.findIndex((b) => 
        (b.id && buff.id && b.id === buff.id) || 
        (!b.id && !buff.id && b.name === buff.name)
      )
    );
    const buffsForProfession = filterBuffsForHeroProfession(hero, uniqueBuffs);
    
    const recalculated = recalculateAllStats(hero, buffsForProfession);
    
    setBaseStats(recalculated.baseStats);
    setCombatStats(recalculated.finalStats);
  }, [hero, battleBuffs, battleStatus, now]);

  // Завантажуємо клан гравця для відображення емблеми
  useEffect(() => {
    const loadClan = async () => {
      try {
        const response = await getMyClan();
        if (response.ok && response.clan) {
          setPlayerClan(response.clan);
        } else {
          setPlayerClan(null);
        }
      } catch (err) {
        setPlayerClan(null);
      }
    };
    loadClan();
  }, [hero]);

  const resourceValues = useMemo(() => {
    if (!hero) return null;
    return getHeroResourceValues(hero, battleStatus === "fighting");
  }, [
    hero,
    battleStatus,
    hero?.hp,
    hero?.mp,
    hero?.cp,
    hero?.maxHp,
    hero?.maxMp,
    hero?.maxCp,
  ]);

  if (!hero || !baseStats || !combatStats) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center py-16 text-[#8a7a60]`
            : "text-white text-center mt-10"
        }
      >
        {isL2 ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin" />
            Загрузка...
          </span>
        ) : (
          "Загрузка..."
        )}
      </div>
    );
  }

  // Функція для форматування чисел
  const formatStatValue = (value: number): string => {
    if (value >= 1000) {
      // Для чисел >= 1000: 1093.576 → округлюємо до цілого → 1094 → "1.094"
      const rounded = Math.round(value);
      // Форматуємо як тисяча з крапкою як роздільником
      return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else {
      // Для чисел < 1000: округлюємо до цілого (86.0 → 86, 152.6 → 153)
      return Math.round(value).toString();
    }
  };

  const race = hero.race || "Human";
  const level = hero.level || 1;
  
  // Визначаємо відображення професії
  let professionDisplay = "";
  const profession = hero.profession || "";
  
  if (!profession || profession === "") {
    // Якщо тільки створив героя - показуємо тільки расу
    professionDisplay = race;
  } else if (profession.includes("_")) {
    // Якщо є підкреслення (human_mystic_necromancer)
    const parts = profession.split("_");
    if (parts.length === 2) {
      // Перша профа: Human Mystic
      professionDisplay = `${race} ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}`;
    } else if (parts.length >= 3) {
      // Друга профа: Necromancer
      professionDisplay = parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
    } else {
      professionDisplay = profession;
    }
  } else {
    professionDisplay = profession;
  }

  const valClass = isL2 ? "text-[#f0d78c]" : "text-white";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 flex flex-col items-center px-3 py-3 text-[#e8dcc8]`
          : "w-full flex flex-col items-center text-white px-4 py-2"
      }
    >
      <div className={isL2 ? "w-full max-w-[420px] mx-auto" : "w-full max-w-[360px]"}>
        <div className="mb-4">
          <div
            className={
              isL2 ? "border-t border-[#c7ad80]/20 mb-2" : "border-t border-white/50 mb-2"
            }
          />
          <div
            className={
              isL2
                ? "text-[#e8c56e] text-sm font-semibold mb-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
                : "text-orange-400 text-sm font-semibold mb-1"
            }
          >
            Характеристики персонажа
          </div>
          <div
            className={
              isL2 ? "text-[#d4b878] text-xs mb-2" : "text-orange-400 text-xs mb-2"
            }
          >
            Тут відображаються базові параметри, бойові характеристики та бонуси від екіпіровки і бафів.
          </div>
          <div
            className={
              isL2 ? "border-b border-[#c7ad80]/20 mt-2" : "border-b border-white/50 mt-2"
            }
          />
        </div>

        {/* Інформація про персонажа */}
        <div className="mb-4 text-center">
          <div className="font-semibold text-base mb-1">
            <PlayerNameWithEmblem
              playerName={hero.name || "Без имени"}
              hero={hero}
              clan={playerClan}
              sevenSealsWinnerRank={getActiveSevenSealsRank(getSevenSealsBonusFromHero(hero))}
              size={14}
            />
          </div>
          <div className={isL2 ? "text-[#c45c5c] text-sm" : "text-red-500 text-sm"}>
            {level} ур. — {professionDisplay}
          </div>
        </div>

        {/* Бафи */}
        <div className="mb-4">
          <CharacterBuffs />
        </div>

        {/* Ресурси: поточне / максимум (як у HUD) + SP */}
        {resourceValues && (
          <div className="mb-4">
            <div
              className={
                isL2
                  ? "text-[#7d9b7a] font-semibold text-sm mb-2"
                  : "text-green-500 font-semibold text-sm mb-2"
              }
            >
              Ресурсы
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className={isL2 ? "text-[#e8c56e]" : "text-amber-400"}>CP</span>
                <span className={`${valClass} tabular-nums`}>
                  {formatStatValue(Math.round(resourceValues.cp))} /{" "}
                  {formatStatValue(Math.round(resourceValues.maxCp))}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className={isL2 ? "text-[#c45c5c]" : "text-red-400"}>HP</span>
                <span className={`${valClass} tabular-nums`}>
                  {formatStatValue(Math.round(resourceValues.hp))} /{" "}
                  {formatStatValue(Math.round(resourceValues.maxHp))}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className={isL2 ? "text-[#6b8cc9]" : "text-sky-400"}>MP</span>
                <span className={`${valClass} tabular-nums`}>
                  {formatStatValue(Math.round(resourceValues.mp))} /{" "}
                  {formatStatValue(Math.round(resourceValues.maxMp))}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className={isL2 ? "text-[#9ed686]" : "text-lime-400"}>SP</span>
                <span className={`${valClass} tabular-nums`}>
                  {formatStatValue(Math.round(Number(hero.sp) || 0))}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Базовые характеристики */}
        <div className="mb-4">
          <div
            className={
              isL2
                ? "text-[#7d9b7a] font-semibold text-sm mb-2"
                : "text-green-500 font-semibold text-sm mb-2"
            }
          >
            Базовые характеристики
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-red-500">STR:</span>
              <span className={valClass}>{baseStats.STR}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">DEX:</span>
              <span className={valClass}>{baseStats.DEX}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">CON:</span>
              <span className={valClass}>{baseStats.CON}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">INT:</span>
              <span className={valClass}>{baseStats.INT}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">WIT:</span>
              <span className={valClass}>{baseStats.WIT}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">MEN:</span>
              <span className={valClass}>{baseStats.MEN}</span>
            </div>
          </div>
        </div>

        {/* Боевые параметры */}
        <div>
          <div
            className={
              isL2
                ? "text-[#7d9b7a] font-semibold text-sm mb-2"
                : "text-green-500 font-semibold text-sm mb-2"
            }
          >
            Боевые параметры
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {/* Ліва колонка */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Физ. атака</span>
                <span className={valClass}>{formatStatValue(combatStats.pAtk)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Физ. защ</span>
                <span className={valClass}>{formatStatValue(combatStats.pDef)}</span>
              </div>
              {hasShieldEquipped(hero) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#c88a5c]">Защ. щитом</span>
                    <span className={valClass}>+{formatStatValue(getShieldMitigationTotal(hero, combatStats))}</span>
                  </div>
                  {combatStats.shieldBlockRate && combatStats.shieldBlockRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#c88a5c]">Шанс блоку щита</span>
                      <span className={valClass}>{formatStatValue(combatStats.shieldBlockRate)}%</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Точность</span>
                <span className={valClass}>{formatStatValue(combatStats.accuracy)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Крит</span>
                <span className={valClass}>{formatStatValue(combatStats.critFlat ?? combatStats.crit * 10)} ({combatStats.crit}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Скор. атаки</span>
                <span className={valClass}>{formatStatValue(combatStats.attackSpeed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">НР реген</span>
                <span className={valClass}>{formatStatValue(combatStats.hpRegen)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">СР реген</span>
                <span className={valClass}>{formatStatValue(combatStats.cpRegen)}</span>
              </div>
            </div>

            {/* Права колонка */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. атака</span>
                <span className={valClass}>{formatStatValue(combatStats.mAtk)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. защ</span>
                <span className={valClass}>{formatStatValue(combatStats.mDef)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Уклонение</span>
                <span className={valClass}>{formatStatValue(combatStats.evasion)}%</span>
              </div>
              {typeof (combatStats as any).runSpeed === "number" && (combatStats as any).runSpeed > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#c88a5c]">Швидкість бігу</span>
                  <span className={valClass}>{formatStatValue((combatStats as any).runSpeed)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Маг. крит</span>
                <span className={valClass}>{formatStatValue(combatStats.mCritFlat ?? combatStats.mCrit * 10)} ({combatStats.mCrit}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Сила крита</span>
                <span className={valClass}>{formatStatValue(combatStats.critPower)} (×{Math.min(2.0, (1.5 + (combatStats.critPower ?? 0) / 5000)).toFixed(2)} атака / ×{Math.min(3.0, (2.0 + (combatStats.critPower ?? 0) / 1500)).toFixed(2)} скіли)</span>
              </div>
              {(combatStats as any).poisonResist ? (
                <div className="flex justify-between">
                  <span className="text-[#c88a5c]">Стійк. до отрути</span>
                  <span className={valClass}>{formatStatValue((combatStats as any).poisonResist)}%</span>
                </div>
              ) : null}
              {(combatStats as any).holdResist ? (
                <div className="flex justify-between">
                  <span className="text-[#c88a5c]">Стійк. до утримання</span>
                  <span className={valClass}>{formatStatValue((combatStats as any).holdResist)}%</span>
                </div>
              ) : null}
              {(combatStats as any).poisonChanceBonus ? (
                <div className="flex justify-between">
                  <span className="text-[#c88a5c]">Шанс отрути (бонус)</span>
                  <span className={valClass}>+{formatStatValue((combatStats as any).poisonChanceBonus)}%</span>
                </div>
              ) : null}
              {(combatStats as any).holdChanceBonus ? (
                <div className="flex justify-between">
                  <span className="text-[#c88a5c]">Шанс утримання (бонус)</span>
                  <span className={valClass}>+{formatStatValue((combatStats as any).holdChanceBonus)}%</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">Скор. каста</span>
                <span className={valClass}>{formatStatValue(combatStats.castSpeed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c88a5c]">МР реген</span>
                <span className={valClass}>{formatStatValue(combatStats.mpRegen)}</span>
              </div>
            </div>
          </div>
          {/* Риска від краю до краю під останніми рядками */}
          <div
            className={
              isL2 ? "border-t border-[#c7ad80]/20 mt-1.5" : "border-t border-white/50 mt-1.5"
            }
          />

          {/* Формули бонусів сетів */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowSetFormulas(!showSetFormulas)}
              className={
                isL2
                  ? "w-full py-2 text-left text-sm font-semibold text-[#c9a44c] hover:text-[#f4e2b8] border-b border-[#5c4a32]/40"
                  : "w-full py-2 text-left text-sm font-semibold text-[#b8860b] hover:text-[#d4af37] border-b border-white/30"
              }
            >
              {showSetFormulas ? "▼ " : "▶ "}Формули бонусів сетів
            </button>
            {showSetFormulas && (
              <div
                className={
                  isL2
                    ? "mt-2 p-3 rounded-lg border border-[#5c4a32]/50 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)] text-xs space-y-2 text-[#d4c4a8]"
                    : "mt-2 p-3 bg-[#1a1a1a] rounded border border-white/20 text-xs space-y-2"
                }
              >
                <div className={isL2 ? "text-[#8a7a60] mb-2" : "text-gray-400 mb-2"}>
                  За кожну одиницю стату з повного сету:
                </div>
                {SET_STAT_FORMULAS_UI.map(({ stat, effects, statColor, effectsColor }) => (
                  <div key={stat} className="flex gap-3 items-baseline">
                    <span className={`font-semibold shrink-0 w-14 ${statColor}`}>{stat}</span>
                    <span className={`${effectsColor} leading-tight`}>{effects}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

