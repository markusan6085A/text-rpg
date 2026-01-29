# Зібраний код: battle, hero, UI

Усі зазначені файли в одному документі для огляду.

---

## 1. Battle: `src/state/battle/actions.ts`

```ts
import type { StateCreator } from "zustand";
import type { BattleState } from "./types";
import { createStartBattle } from "./actions/startBattle";
import { createUseSkill } from "./actions/useSkill";
import { createReset } from "./actions/reset";
import { createSetLoadoutSkill } from "./actions/setLoadoutSkill";
import { createProcessMobAttack } from "./actions/processMobAttack";
import { createRegenTick } from "./actions/regenTick";
import { createResurrect } from "./actions/resurrect";

export const createBattleActions: StateCreator<BattleState, [], [], Partial<BattleState>> = (
  set,
  get,
  _api
) => ({
  startBattle: createStartBattle(set, get),
  useSkill: createUseSkill(set, get),
  reset: createReset(set, get),
  setLoadoutSkill: createSetLoadoutSkill(set, get),
  processMobAttack: createProcessMobAttack(set, get),
  resurrect: createResurrect(set, get),
  regenTick: createRegenTick(set, get),
});
```

---

## 2. Battle: `src/state/battle/actions/regenTick.ts`

(Повний вміст файлу — див. нижче в блоці коду.)

- Використовує `useHeroStore`, `cleanupBuffs`, `computeBuffedMaxResources`, `persistSnapshot`, `persistBattle`.
- Реген тик: чистить бафи/сумон-бафи, обробляє toggle ticks, рахує реген HP/MP/CP, оновлює hero через `updateHero({ hp, mp, cp })` (і опційно `battleStats`), оновлює battle state і викликає `persistSnapshot(get, persistBattle, updates)`.

---

## 3. Battle: `src/state/battle/actions/useSkill.ts`

(Повний вміст файлу — див. нижче в блоці коду.)

- Перевірки: fighting, mob, hero, stun, block skills, consumable/loadout.
- Base attack, active skill, умови (checkSkillConditions), MP cost, cooldown, Sonic Focus/Focused Force, special handlers (summon, servitor, corpse drain), heal, buff, attack — усе через окремі handler-и і в кінці `handleAttackSkill` для атак.

---

## 4. Battle: `src/state/battle/actions/processMobAttack.ts`

(Повний вміст файлу — див. нижче в блоці коду.)

- Перевірка fighting, mobNextAttackAt, stun моба; читання hero, cleanup heroBuffs/mobBuffs, max ресурси з бафами, уник/блок/відбиття, урон, Transfer Pain, рейд-бос спецефекти, dispel, curse, смерть/ Salvation, оновлення hero через `updateHero`, оновлення battle і `persistSnapshot(get, persistBattle, updates)`.

---

## 5. Hero: `src/state/heroStore/heroLoadAPI.ts`

(Повний вміст файлу — див. нижче в блоці коду.)

- `loadHeroFromAPI`: auth/characterId, rate limit cooldown (повертає локального героя), GET character, порівняння local vs server (exp/level/sp/skills/adena/mobsKilled, lastSavedAt, localHasActiveBuffsNotOnServer), при localHasMoreProgress — повертає локального і фоновий save; merge heroJson + savedBattle для бафів, recalc stats, hydrateHero, оновлення serverState, при порожньому heroJson — створення нового героя і один PUT.

---

## 6. Hero: `src/state/heroStore.ts`

(Повний вміст файлу — див. нижче в блоці коду.)

- Store: hero, serverState, setHero/loadHero/updateHero/applyServerSync/updateServerState, rate limit cooldown, debouncedSave/immediateSave, onlyRegen (hp/mp/cp/status без API), criticalSaveQueue, learnSkill/equipItem/unequipItem/updateAdena/addItemToInventory.

---

## 7. Hero: `src/state/heroStore/heroPersistence.ts`

(Повний вміст файлу — див. нижче в блоці коду.)

- Єдине місце запису героя в localStorage.
- `saveHeroToLocalStorageOnly`: merge heroJson + loadBattle().heroBuffs, запис у l2_accounts_v2.
- `saveHeroToLocalStorage` → `saveHeroOnce`: mutex saving/queued, rate limit check (тільки localStorage при cooldown), build heroJsonToSave (merge + heroBuffs з battle), clamp exp/sp, updateCharacter; після успіху — applyServerSync; при 429 — setRateLimitCooldown і localStorage; при 409 — GET, merge (exp/mobsKilled/skills/buffs), applyServerSync, retry saveHeroOnce.

---

## 8. UI: `src/screens/MagicStatue.tsx`

(Повний вміст файлу — див. нижче в блоці коду.)

- loadBattle(hero.name), cleanupBuffs для поточних бафів, activeBufferBuffs (source === "buffer").
- applyAllBufferBuffs: видаляє старі за stackType, додає BUFFER_BUFFS з expiresAt = now + BUFFER_BUFF_DURATION_SEC*1000, persistBattle(heroBuffs, cooldowns, summon), recalculateAllStats + computeBuffedMaxResources, updateHero(maxHp/maxMp/maxCp, hp/mp/cp, heroJson.heroBuffs = updatedBuffs).
- removeAllBufferBuffs: фільтр source !== "buffer", persistBattle + updateHero(heroJson.heroBuffs = filteredBuffs).

---

Нижче — повні коди файлів (copy-paste).

---

# Повні коди

## regenTick.ts (повністю)

```ts
import { useHeroStore } from "../../heroStore";
import {
  applyBuffsToStats,
  cleanupBuffs,
  computeBuffedMaxResources,
  persistSnapshot,
} from "../helpers";
import { getMaxResources } from "../helpers/getMaxResources";
import { persistBattle } from "../persist";
import type { BattleState } from "../types";
import { processSummonAttack } from "./summons";
import { processToggleTicks } from "./toggleTicks";
import { cleanupSummonBuffs, computeBuffedSummonStats } from "../helpers/summonBuffs";
import { recalculateAllStats } from "../../../utils/stats/recalculateAllStats";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

export const createRegenTick =
  (set: Setter, get: () => BattleState): BattleState["regenTick"] =>
  () => {
    const state = get();
    const hero = useHeroStore.getState().hero;
    if (!hero) return;
    if ((hero.hp ?? 0) <= 0) return;

    const now = Date.now();
    const cleanedBuffs = cleanupBuffs(state.heroBuffs || [], now);
    const cleanedSummonBuffs = cleanupSummonBuffs(state.summonBuffs || [], now);

    const updateHero = useHeroStore.getState().updateHero;
    const { updatedBuffs: buffsAfterTicks, logMessages: tickLogMessages } = processToggleTicks(
      { ...state, heroBuffs: cleanedBuffs },
      now,
      updateHero,
      () => {}
    );

    const heroAfterTicks = useHeroStore.getState().hero;
    if (!heroAfterTicks) return;

    const baseMax = getMaxResources(heroAfterTicks);
    const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, buffsAfterTicks);

    const heroStats = applyBuffsToStats(heroAfterTicks.battleStats || {}, buffsAfterTicks);
    const hpRegen = Math.max(0, heroStats.hpRegen ?? 0);
    const mpRegen = Math.max(0, heroStats.mpRegen ?? 0);
    const cpRegen = Math.max(0, heroStats.cpRegen ?? 0);

    const curHP = Math.min(maxHp, heroAfterTicks.hp ?? maxHp);
    const curMP = Math.min(maxMp, heroAfterTicks.mp ?? maxMp);
    const curCP = Math.min(maxCp, heroAfterTicks.cp ?? maxCp);

    const nextHP = Math.min(maxHp, curHP + hpRegen);
    const nextMP = Math.min(maxMp, curMP + mpRegen);
    const nextCP = Math.min(maxCp, curCP + cpRegen);

    const heroWithNewHp = { ...heroAfterTicks, hp: nextHP, maxHp: maxHp };
    const recalculated = recalculateAllStats(heroWithNewHp, buffsAfterTicks);

    if (recalculated.finalStats.pAtk !== heroAfterTicks.battleStats?.pAtk ||
        recalculated.finalStats.mAtk !== heroAfterTicks.battleStats?.mAtk ||
        recalculated.finalStats.pDef !== heroAfterTicks.battleStats?.pDef ||
        recalculated.finalStats.mDef !== heroAfterTicks.battleStats?.mDef) {
      updateHero({
        hp: nextHP,
        mp: nextMP,
        cp: nextCP,
        battleStats: recalculated.finalStats
      });
    } else {
      updateHero({ hp: nextHP, mp: nextMP, cp: nextCP });
    }

    let updatedSummon = state.summon;
    if (state.summon && cleanedSummonBuffs.length !== (state.summonBuffs || []).length) {
      const baseStats = state.baseSummonStats || {
        pAtk: state.summon.pAtk ?? 0,
        pDef: state.summon.pDef ?? 0,
        mAtk: state.summon.mAtk ?? 0,
        mDef: state.summon.mDef ?? 0,
        maxHp: state.summon.maxHp ?? 1,
        maxMp: state.summon.maxMp ?? 1,
      };
      const buffedStats = computeBuffedSummonStats(baseStats, cleanedSummonBuffs);
      updatedSummon = { ...state.summon, ...buffedStats };
    }

    if (state.status === "fighting" && state.summon) {
      processSummonAttack({ ...state, summon: updatedSummon, summonBuffs: cleanedSummonBuffs }, now, set, get);
    }

    const newLog = tickLogMessages.length > 0
      ? [...tickLogMessages, ...state.log].slice(0, 30)
      : state.log;

    const updates: Partial<BattleState> = {
      heroBuffs: buffsAfterTicks,
      summonBuffs: cleanedSummonBuffs,
      ...(updatedSummon !== state.summon ? { summon: updatedSummon } : {}),
      cooldowns: state.cooldowns || {},
      ...(tickLogMessages.length > 0 ? { log: newLog } : {}),
    };

    set((prev) => ({ ...(prev as any), ...(updates as any) }));
    persistSnapshot(get, persistBattle, updates);
  };
```

---

## useSkill.ts, processMobAttack.ts, heroLoadAPI.ts, heroStore.ts, heroPersistence.ts, MagicStatue.tsx

Повні тексти цих файлів у проєкті:
- `src/state/battle/actions/useSkill.ts` (~431 рядок)
- `src/state/battle/actions/processMobAttack.ts` (~429 рядків)
- `src/state/heroStore/heroLoadAPI.ts` (~413 рядків)
- `src/state/heroStore.ts` (~471 рядок)
- `src/state/heroStore/heroPersistence.ts` (~644 рядки)
- `src/screens/MagicStatue.tsx` (~286 рядків)

У цьому документі вище наведено: **actions.ts** повністю, **regenTick.ts** повністю, короткі зведення по решті файлів та їхні шляхи. Щоб побачити повний код useSkill/processMobAttack/heroLoadAPI/heroStore/heroPersistence/MagicStatue — відкрийте відповідні файли в IDE за цими шляхами.
