import React from "react";
import { useHeroStore } from "../state/heroStore";
import { BUFFER_BUFFS, BUFFER_BUFF_DURATION_SEC } from "../data/bufferBuffs";
import { loadBattle, persistBattle } from "../state/battle/persist";
import { cleanupBuffs } from "../state/battle/helpers";
import type { BattleBuff } from "../state/battle/types";
import { useBattleStore } from "../state/battle/store";
import { getCityUiVariant } from "../utils/cityUiVariant";

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

  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

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
  const currentBuffs = cleanupBuffs(saved?.heroBuffs || [], now);

  // Отримуємо активні бафи статуї
  const activeBufferBuffs = currentBuffs.filter((b) => b.source === "buffer");

  const restoreFullHpMpCp = () => {
    const heroStore = useHeroStore.getState();
    const currentHero = heroStore.hero;
    if (!currentHero) return;
    const maxHp = currentHero.maxHp ?? 1;
    const maxMp = currentHero.maxMp ?? 1;
    const maxCp = currentHero.maxCp ?? Math.round(maxHp * 0.6);
    const existingJson = (currentHero as any).heroJson || {};
    heroStore.updateHero({
      hp: maxHp,
      mp: maxMp,
      cp: maxCp,
      heroJson: { ...existingJson },
    }, { persist: true });
    setRefreshKey((k) => k + 1);
  };

  const applyAllBufferBuffs = () => {
    const now = Date.now();
    const saved = loadBattle(hero.name);
    const currentBuffs = cleanupBuffs(saved?.heroBuffs || [], now);
    
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

    // Оновлюємо компонент для відображення
    setRefreshKey((k) => k + 1);
    
    // 🔥 ВАЖЛИВО: Викликаємо navigate з поточним шляхом, щоб спрацював механізм refreshKey з App.tsx
    // Це форсує повне оновлення сторінки та відображення бафів
    const currentPath = window.location.pathname;
    navigate(currentPath);
  };

  const hasActiveBuffs = activeBufferBuffs.length > 0 && 
    activeBufferBuffs.some((b) => b.expiresAt > now);

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

    setRefreshKey((k) => k + 1);
    const currentPath = window.location.pathname;
    navigate(currentPath);
  };

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full text-white px-4 py-2"
      }
    >
      <div className={isL2 ? "w-full max-w-[420px] mx-auto space-y-3" : "w-full max-w-[360px] mx-auto space-y-3"}>
        {/* Картинка */}
        <div className="flex justify-center mb-2">
          <img src="/stats.jpg" alt="stats" className="h-auto w-[80%] max-h-32" />
        </div>
        
        {/* Заголовок */}
        <div className="text-center">
          <div
            className={
              isL2
                ? "text-lg font-semibold mb-1 text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
                : "text-lg font-semibold mb-1 text-green-500"
            }
          >
            Магическая статуя
          </div>
          <div className={isL2 ? "text-sm text-[#a89878]" : "text-sm text-gray-400"}>
            Бесплатные баффы на 1 час
          </div>
        </div>

        {/* Іконки бафів */}
        <div className="flex flex-wrap gap-2 justify-center">
          {BUFFER_BUFFS.map((buffDef) => {
            const activeBuff = activeBufferBuffs.find(
              (b) => b.stackType === buffDef.stackType
            );
            const isActive = !!activeBuff && activeBuff.expiresAt > now;

            return (
              <div
                key={buffDef.id}
                className="relative w-4 h-4 flex items-center justify-center"
                title={buffDef.name}
              >
                <img
                  src={buffDef.icon}
                  alt={buffDef.name}
                  className={`w-4 h-4 object-cover rounded ${
                    isActive ? "opacity-100" : "opacity-60"
                  }`}
                />
                {isActive && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Кнопка відновити HP/MP/CP безкоштовно */}
        <div className="text-center">
          <button
            onClick={restoreFullHpMpCp}
            className="text-[13px] text-green-400 hover:text-green-300 cursor-pointer"
          >
            Восстановить HP MP CP бесплатно до 100%
          </button>
        </div>

        {/* Кнопка отримати всі бафи */}
        <div className="text-center">
          <button
            onClick={applyAllBufferBuffs}
            disabled={hasActiveBuffs}
            className={`text-[13px] ${
              hasActiveBuffs
                ? "text-gray-500 cursor-not-allowed"
                : "text-green-500 hover:text-green-400 cursor-pointer"
            }`}
          >
            {hasActiveBuffs ? "Баффы активны" : "Получить баф"}
          </button>
        </div>

        {/* Кнопка удалить баф */}
        {hasActiveBuffs && (
          <div className="text-center">
            <button
              onClick={removeAllBufferBuffs}
              className="text-[13px] text-red-600 hover:text-red-500 cursor-pointer"
            >
              Удалить баф
            </button>
          </div>
        )}

        {/* Кнопка назад */}
        <div className="text-center">
          <button
            onClick={() => navigate("/city")}
            className={
              isL2
                ? "text-[13px] text-[#b85c4c] hover:text-[#d4786a] cursor-pointer"
                : "text-[13px] text-red-600 hover:text-red-500 cursor-pointer"
            }
          >
            В город
          </button>
        </div>
      </div>
    </div>
  );
}

