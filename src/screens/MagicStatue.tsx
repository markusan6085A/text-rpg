import React from "react";
import { useHeroStore } from "../state/heroStore";
import { BUFFER_BUFFS, BUFFER_BUFF_DURATION_SEC } from "../data/bufferBuffs";
import { loadBattle, persistBattle } from "../state/battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../state/battle/helpers";
import { recalculateAllStats } from "../utils/stats/recalculateAllStats";
import type { BattleBuff } from "../state/battle/types";
import { useBattleStore } from "../state/battle/store";

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

  if (!hero) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400">
        Загрузка персонажа...
      </div>
    );
  }

  const saved = loadBattle(hero.name);
  const currentBuffs = cleanupBuffs(saved?.heroBuffs || [], now);

  // Отримуємо активні бафи статуї
  const activeBufferBuffs = currentBuffs.filter((b) => b.source === "buffer");

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

    // ❗ ВАЖЛИВО: Після застосування бафів статуї потрібно перерахувати стати
    // Але hero.maxHp має містити БАЗОВЕ значення БЕЗ бафів
    // Бафи застосовуються в computeBuffedMaxResources при використанні
    const heroStore = useHeroStore.getState();
    const currentHero = heroStore.hero;
    if (currentHero) {
      // Перераховуємо стати (бафи НЕ застосовуються до maxHp в recalculateAllStats)
      const recalculated = recalculateAllStats(currentHero, updatedBuffs);
      
      // ❗ recalculated.resources.maxHp містить базове значення БЕЗ бафів
      // Застосовуємо бафи вручну для обчислення нового maxHp з бафами
      const baseMax = {
        maxHp: recalculated.resources.maxHp,
        maxMp: recalculated.resources.maxMp,
        maxCp: recalculated.resources.maxCp,
      };
      const { maxHp: newMaxHp, maxMp: newMaxMp, maxCp: newMaxCp } = computeBuffedMaxResources(baseMax, updatedBuffs);
      
      // Якщо maxHp збільшився, але hp був фул - оновлюємо hp до нового maxHp
      const oldMaxHp = currentHero.maxHp ?? 1;
      // Обчислюємо старий maxHp з бафами для порівняння
      const oldBuffedMax = computeBuffedMaxResources(
        { maxHp: oldMaxHp, maxMp: currentHero.maxMp ?? 1, maxCp: currentHero.maxCp ?? 1 },
        cleanupBuffs(saved?.heroBuffs || [], Date.now())
      );
      const wasFullHp = (currentHero.hp ?? 0) >= oldBuffedMax.maxHp;
      
      const newHp = wasFullHp ? newMaxHp : Math.min(newMaxHp, currentHero.hp ?? newMaxHp);
      const newMp = Math.min(newMaxMp, currentHero.mp ?? newMaxMp);
      const newCp = Math.min(newMaxCp, currentHero.cp ?? newMaxCp);
      
      // ❗ Оновлюємо hero з БАЗОВИМИ ресурсами БЕЗ бафів (бафи застосовуються в computeBuffedMaxResources)
      heroStore.updateHero({
        maxHp: recalculated.resources.maxHp, // Базове значення БЕЗ бафів
        maxMp: recalculated.resources.maxMp,
        maxCp: recalculated.resources.maxCp,
        hp: newHp, // Але hp оновлюємо з урахуванням бафів
        mp: newMp,
        cp: newCp,
      });
    }

    // Оновлюємо компонент для відображення
    setRefreshKey((k) => k + 1);
  };

  const hasActiveBuffs = activeBufferBuffs.length > 0 && 
    activeBufferBuffs.some((b) => b.expiresAt > now);

  const removeAllBufferBuffs = () => {
    const now = Date.now();
    const saved = loadBattle(hero.name);
    const currentBuffs = cleanupBuffs(saved?.heroBuffs || [], now);
    
    // Отримуємо поточний стан бою, щоб зберегти summon та cooldowns
    const battleState = useBattleStore.getState();

    // Видаляємо всі бафи від статуї
    const filteredBuffs = currentBuffs.filter((b) => b.source !== "buffer");

    // Зберігаємо оновлені бафи, зберігаючи поточний стан (включаючи summon та cooldowns)
    // ❗ ВАЖЛИВО: Беремо cooldowns з saved (якщо є), бо battleState може мати порожні cooldowns поза боєм
    // Якщо battleState має актуальні cooldowns (не порожній об'єкт), використовуємо їх
    const currentCooldowns = battleState.cooldowns && Object.keys(battleState.cooldowns).length > 0
      ? battleState.cooldowns
      : (saved?.cooldowns || {});
    
    persistBattle({
      ...saved,
      heroBuffs: filteredBuffs,
      cooldowns: currentCooldowns, // Використовуємо актуальні cooldowns або збережені
      // Зберігаємо summon з поточного стану бою, якщо він є
      summon: battleState.summon || saved?.summon || undefined,
      summonLastAttackAt: battleState.summonLastAttackAt || saved?.summonLastAttackAt || undefined,
    }, hero.name);

    // Оновлюємо компонент для відображення
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="w-full text-white px-4 py-2">
      <div className="w-full max-w-[360px] mx-auto space-y-3">
        {/* Картинка */}
        <div className="flex justify-center mb-2">
          <img src="/stats.jpg" alt="stats" className="h-auto w-[80%] max-h-32" />
        </div>
        
        {/* Заголовок */}
        <div className="text-center">
          <div className="text-lg font-semibold mb-1 text-green-500">
            Магическая статуя
          </div>
          <div className="text-sm text-gray-400">
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
            className="text-[13px] text-red-600 hover:text-red-500 cursor-pointer"
          >
            В город
          </button>
        </div>
      </div>
    </div>
  );
}

