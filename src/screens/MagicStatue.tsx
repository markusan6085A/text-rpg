import React from "react";
import { useHeroStore } from "../state/heroStore";
import { BUFFER_BUFFS, BUFFER_BUFF_DURATION_SEC } from "../data/bufferBuffs";
import { loadBattle, persistBattle } from "../state/battle/persist";
import { cleanupBuffs } from "../state/battle/helpers";
import type { BattleBuff } from "../state/battle/types";
import { useBattleStore } from "../state/battle/store";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import { getHeroBuffedResourceCaps, isOnlineHeroBuffsJsonCanonical } from "../utils/heroBuffedResources";

interface MagicStatueProps {
  navigate: (path: string) => void;
}

export default function MagicStatue({ navigate }: MagicStatueProps) {
  const hero = useHeroStore((s) => s.hero);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [now, setNow] = React.useState(Date.now());

  // Оновлюємо час кожну секунду для відображення таймера
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center py-12 text-[#8a7a60] text-xs gap-2`
            : "flex items-center justify-center text-xs text-gray-400"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
        )}
        Загрузка персонажа...
      </div>
    );
  }

  const saved = loadBattle(hero.name);
  const currentBuffs = isOnlineHeroBuffsJsonCanonical()
    ? cleanupBuffs(
        Array.isArray((hero as any).heroJson?.heroBuffs) ? (hero as any).heroJson.heroBuffs : [],
        now,
      )
    : cleanupBuffs(saved?.heroBuffs || [], now);

  // Отримуємо активні бафи статуї
  const activeBufferBuffs = currentBuffs.filter((b) => b.source === "buffer");

  const restoreFullHpMpCp = () => {
    const heroStore = useHeroStore.getState();
    const currentHero = heroStore.hero;
    if (!currentHero) return;
    const inBattle = useBattleStore.getState().status === "fighting";
    const { maxHp, maxMp, maxCp } = getHeroBuffedResourceCaps(currentHero, inBattle);
    const existingJson = (currentHero as any).heroJson || {};
    heroStore.updateHero({
      hp: maxHp,
      mp: maxMp,
      cp: maxCp,
      maxHp,
      maxMp,
      maxCp,
      heroJson: { ...existingJson },
    }, { persist: true });
    setRefreshKey((k) => k + 1);
  };

  const applyAllBufferBuffs = () => {
    const now = Date.now();
    const saved = loadBattle(hero.name);
    const liveHero = useHeroStore.getState().hero;
    const currentBuffs = isOnlineHeroBuffsJsonCanonical()
      ? cleanupBuffs(
          Array.isArray((liveHero as any)?.heroJson?.heroBuffs) ? (liveHero as any).heroJson.heroBuffs : [],
          now,
        )
      : cleanupBuffs(saved?.heroBuffs || [], now);
    
    // Отримуємо поточний стан бою, щоб зберегти summon та cooldowns
    const battleState = useBattleStore.getState();

    // Видаляємо всі старі бафи з такими самими stackType (як від статуї, так і від скілів)
    const stackTypesToRemove = new Set(BUFFER_BUFFS.map((b) => b.stackType));
    const filteredBuffs = currentBuffs.filter(
      (b) => !stackTypesToRemove.has(b.stackType)
    );

    // Додаємо всі бафи від статуї
    const newBuffs: BattleBuff[] = BUFFER_BUFFS.map((buffDef) => ({
      id: buffDef.id,
      name: buffDef.name,
      icon: buffDef.icon,
      stackType: buffDef.stackType,
      effects: buffDef.effects,
      expiresAt: now + BUFFER_BUFF_DURATION_SEC * 1000,
      startedAt: now,
      durationMs: BUFFER_BUFF_DURATION_SEC * 1000,
      source: "buffer",
    }));

    const updatedBuffs = [...filteredBuffs, ...newBuffs];

    // Зберігаємо оновлені бафи, зберігаючи поточний стан (включаючи summon та cooldowns)
    // ❗ ВАЖЛИВО: Беремо cooldowns з saved (якщо є), бо battleState може мати порожні cooldowns поза боєм
    // Якщо battleState має актуальні cooldowns (не порожній об'єкт), використовуємо їх
    const currentCooldowns = battleState.cooldowns && Object.keys(battleState.cooldowns).length > 0
      ? battleState.cooldowns
      : (saved?.cooldowns || {});
    
    persistBattle({
      ...saved,
      heroBuffs: updatedBuffs,
      cooldowns: currentCooldowns, // Використовуємо актуальні cooldowns або збережені
      // Зберігаємо summon з поточного стану бою, якщо він є
      summon: battleState.summon || saved?.summon || undefined,
      summonLastAttackAt: battleState.summonLastAttackAt || saved?.summonLastAttackAt || undefined,
    }, hero.name);

    // Синхронізуємо battle store, щоб бафи одразу відображались (StatusBars/інші читають loadBattle, але store теж оновлюємо)
    useBattleStore.setState({ heroBuffs: updatedBuffs });

    if (import.meta.env.DEV) {
      console.log("AFTER STATUE buffs:", updatedBuffs.length, updatedBuffs.map((b: any) => [b.id, b.name, b.expiresAt, b.source]));
    }

    // ❗ ВАЖЛИВО: Після застосування бафів статуї потрібно перерахувати стати
    // Але hero.maxHp має містити БАЗОВЕ значення БЕЗ бафів
    const heroStore = useHeroStore.getState();
    const currentHero = heroStore.hero;
    if (currentHero) {
      const existingHeroJson = (currentHero as any).heroJson || {};
      // ❗ hp/mp/cp=0 → heroUpdate заповнить до buffedMax (логіка hp<=0 ? buffedMax.maxHp)
      // Передаємо equipment щоб спричинити needsRecalc (без цього hp=0 залишився б 0)
      heroStore.updateHero({
        hp: 0,
        mp: 0,
        cp: 0,
        equipment: currentHero.equipment,
        heroJson: { ...existingHeroJson, heroBuffs: updatedBuffs },
      });
    }

    void import("../utils/api/heroBuffsSync").then(({ scheduleHeroBuffsSync }) =>
      scheduleHeroBuffsSync(updatedBuffs)
    );

    // Оновлюємо компонент для відображення
    setRefreshKey((k) => k + 1);
    
    // 🔥 ВАЖЛИВО: Викликаємо navigate з поточним шляхом, щоб спрацював механізм refreshKey з App.tsx
    // Це форсує повне оновлення сторінки та відображення бафів
    const currentPath = window.location.pathname;
    navigate(currentPath);
  };

  const hasActiveBuffs =
    activeBufferBuffs.length > 0 && activeBufferBuffs.some((b) => b.expiresAt > now);

  const bufferExpiresAt = hasActiveBuffs
    ? Math.min(...activeBufferBuffs.filter((b) => b.expiresAt > now).map((b) => b.expiresAt))
    : 0;
  const bufferTimeLeftSec = hasActiveBuffs ? Math.max(0, Math.floor((bufferExpiresAt - now) / 1000)) : 0;
  const bufferTimeLabel = `${Math.floor(bufferTimeLeftSec / 60)}:${String(bufferTimeLeftSec % 60).padStart(2, "0")}`;

  // Видаляємо ВСІ бафи (і від статуї, і від скілів) — з першого натискання
  const removeAllBufferBuffs = () => {
    const now = Date.now();
    const saved = loadBattle(hero.name);
    const currentBuffs = cleanupBuffs(saved?.heroBuffs || [], now);
    
    // Видаляємо всі бафи без винятку
    const filteredBuffs: BattleBuff[] = [];

    const battleState = useBattleStore.getState();
    const currentCooldowns = battleState.cooldowns && Object.keys(battleState.cooldowns).length > 0
      ? battleState.cooldowns
      : (saved?.cooldowns || {});
    
    persistBattle({
      ...saved,
      heroBuffs: filteredBuffs,
      cooldowns: currentCooldowns,
      summon: battleState.summon || saved?.summon || undefined,
      summonLastAttackAt: battleState.summonLastAttackAt || saved?.summonLastAttackAt || undefined,
    }, hero.name);

    // Синхронізуємо battle store одразу, щоб UI оновився
    useBattleStore.setState({ heroBuffs: filteredBuffs });

    const heroStore = useHeroStore.getState();
    const currentHero = heroStore.hero;
    if (currentHero) {
      const existingHeroJson = (currentHero as any).heroJson || {};
      // Після зняття бафів max = base; обрізаємо hp/mp/cp до base
      const baseMax = {
        maxHp: currentHero.maxHp ?? 1,
        maxMp: currentHero.maxMp ?? 1,
        maxCp: currentHero.maxCp ?? 1,
      };
      heroStore.updateHero({
        hp: Math.min(currentHero.hp ?? baseMax.maxHp, baseMax.maxHp),
        mp: Math.min(currentHero.mp ?? baseMax.maxMp, baseMax.maxMp),
        cp: Math.min(currentHero.cp ?? baseMax.maxCp, baseMax.maxCp),
        heroJson: {
          ...existingHeroJson,
          heroBuffs: filteredBuffs,
        } as any,
      });
    }

    void import("../utils/api/heroBuffsSync").then(({ scheduleHeroBuffsSync }) =>
      scheduleHeroBuffsSync(filteredBuffs)
    );

    setRefreshKey((k) => k + 1);
    const currentPath = window.location.pathname;
    navigate(currentPath);
  };

  const heroArtWrapL2 =
    "rounded-lg border border-[#6b5a3e]/55 bg-[radial-gradient(ellipse_90%_70%_at_50%_15%,rgba(199,173,128,0.12)_0%,transparent_60%),linear-gradient(180deg,#1a1610_0%,#0c0a08_100%)] p-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.08),0_8px_24px_rgba(0,0,0,0.45)]";
  const sectionCardL2 =
    "rounded-lg border border-[#5c4a32]/45 bg-[linear-gradient(180deg,rgba(24,20,14,0.92)_0%,rgba(10,9,7,0.97)_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]";
  const btnRestoreL2 =
    "w-full text-left sm:text-center text-[12px] py-2.5 px-3 rounded-md border border-[#2d6b45]/75 bg-gradient-to-b from-[#1f4a32] to-[#0f2418] text-[#c8f0d4] shadow-[inset_0_1px_0_rgba(140,220,160,0.15),0_4px_14px_rgba(0,0,0,0.4)] hover:border-[#3bd16f]/55 hover:from-[#255a3e] hover:to-[#122818] active:scale-[0.99] transition-[border-color,transform,filter] duration-150";
  const btnBuffL2 =
    "w-full text-[12px] py-2.5 px-3 rounded-md border text-[#f4ead0] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.45)] active:scale-[0.99] transition-[border-color,transform,opacity] duration-150 font-medium";
  const btnBuffL2On =
    "border-[#6b5a8a]/80 bg-gradient-to-b from-[#3a3260] via-[#2a2648] to-[#151022] hover:border-[#9b8fd4]/55 hover:brightness-110";
  const btnBuffL2Off = "border-[#3d3d3d]/80 bg-[#1a1a1a]/80 text-[#6a6a6a] cursor-not-allowed opacity-70 shadow-none";
  const btnRemoveL2 =
    "w-full text-[12px] py-2.5 px-3 rounded-md border border-[#8b3a3a]/75 bg-gradient-to-b from-[#4a2222] to-[#1a0c0c] text-[#f0c8c8] shadow-[inset_0_1px_0_rgba(255,160,160,0.1),0_4px_14px_rgba(0,0,0,0.45)] hover:border-[#c75c5c]/60 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150";
  const btnCityL2 =
    "w-full text-[12px] py-2.5 px-3 rounded-md border border-[#6b5940]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-[#d4c4a8] shadow-[inset_0_1px_0_rgba(199,173,128,0.1),0_4px_14px_rgba(0,0,0,0.4)] hover:border-[#c7ad80]/45 hover:text-[#f4e2b8] active:scale-[0.99] transition-[border-color,color,transform] duration-150";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full text-white px-4 py-2"
      }
    >
      <div className={isL2 ? "w-full max-w-[420px] mx-auto space-y-3" : "w-full max-w-[360px] mx-auto space-y-3"}>
        <div className={isL2 ? heroArtWrapL2 : "flex justify-center mb-1"}>
          <div className="flex justify-center">
            <img
              src="/stats.jpg"
              alt=""
              className={
                isL2
                  ? "h-auto w-full max-w-[320px] max-h-36 rounded-md object-cover opacity-95"
                  : "h-auto w-[80%] max-h-32"
              }
            />
          </div>
        </div>

        <div className={isL2 ? sectionCardL2 : "text-center"}>
          <div className="text-center">
            {isL2 && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#c7ad80]/45" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#a89878]">храм буфера</span>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#c7ad80]/45" />
              </div>
            )}
            <div
              className={
                isL2
                  ? "text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-b from-[#fff4d4] via-[#e8c56e] to-[#a67c2c] [text-shadow:none] drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
                  : "text-lg font-semibold mb-1 text-green-500"
              }
            >
              Магическая статуя
            </div>
            <div className={isL2 ? "text-[13px] text-[#b8a88a] mt-1" : "text-sm text-gray-400"}>
              Бесплатные баффы на 1 час
            </div>
          </div>

          <div
            className={
              isL2
                ? "mt-3 pt-3 border-t border-[#c7ad80]/15 flex flex-wrap gap-2 justify-center"
                : "flex flex-wrap gap-2 justify-center mt-2"
            }
          >
            {BUFFER_BUFFS.map((buffDef) => {
              const activeBuff = activeBufferBuffs.find((b) => b.stackType === buffDef.stackType);
              const isActive = !!activeBuff && activeBuff.expiresAt > now;

              return (
                <div
                  key={buffDef.id}
                  className={
                    isL2
                      ? `relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-md overflow-hidden border transition-shadow duration-200 ${
                          isActive
                            ? "border-[#3bd16f]/55 shadow-[0_0_12px_rgba(59,209,111,0.2),inset_0_0_8px_rgba(0,0,0,0.6)] bg-[#0d0b08]"
                            : "border-[#5c4a32]/40 bg-black/35 opacity-80"
                        }`
                      : "relative w-4 h-4 flex items-center justify-center"
                  }
                  title={buffDef.name}
                >
                  <img
                    src={buffDef.icon}
                    alt={buffDef.name}
                    className={
                      isL2
                        ? `w-[26px] h-[26px] sm:w-7 sm:h-7 object-cover rounded-sm ${isActive ? "opacity-100" : "opacity-55"}`
                        : `w-4 h-4 object-cover rounded ${isActive ? "opacity-100" : "opacity-60"}`
                    }
                  />
                  {isActive && (
                    <div
                      className={
                        isL2
                          ? "absolute top-0.5 right-0.5 w-2 h-2 bg-[#3bd16f] rounded-full shadow-[0_0_6px_#3bd16f]"
                          : "absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full"
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {isL2 && hasActiveBuffs && (
            <p className="text-center text-[11px] text-[#8fbc8f] mt-2 tabular-nums">
              Действие бафов: <span className="text-[#c8f0d4] font-semibold">{bufferTimeLabel}</span>
            </p>
          )}
        </div>

        <div className={isL2 ? "space-y-2" : "space-y-2"}>
          <button type="button" onClick={restoreFullHpMpCp} className={isL2 ? btnRestoreL2 : "w-full text-[13px] py-2 rounded-lg border border-green-700/60 bg-green-950/40 text-green-400 hover:bg-green-900/30"}>
            Восстановить HP MP CP бесплатно до 100%
          </button>

          <button
            type="button"
            onClick={applyAllBufferBuffs}
            disabled={hasActiveBuffs}
            className={
              isL2
                ? `${btnBuffL2} ${hasActiveBuffs ? btnBuffL2Off : btnBuffL2On}`
                : `w-full text-[13px] py-2 rounded-lg border ${
                    hasActiveBuffs
                      ? "border-gray-600 text-gray-500 cursor-not-allowed"
                      : "border-violet-600/60 bg-violet-950/40 text-violet-200 hover:bg-violet-900/35"
                  }`
            }
          >
            {hasActiveBuffs ? "Баффы активны" : "Получить баф"}
          </button>

          {hasActiveBuffs && (
            <button type="button" onClick={removeAllBufferBuffs} className={isL2 ? btnRemoveL2 : "w-full text-[13px] py-2 rounded-lg border border-red-800/60 bg-red-950/35 text-red-300 hover:bg-red-900/25"}>
              Удалить баф
            </button>
          )}

          <button type="button" onClick={() => navigate("/city")} className={isL2 ? btnCityL2 : "w-full text-[13px] py-2 rounded-lg border border-amber-800/50 bg-amber-950/20 text-amber-200/90 hover:bg-amber-900/20"}>
            В город
          </button>
        </div>
      </div>
    </div>
  );
}

