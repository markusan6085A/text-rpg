# Карта завантаження героя та battle state (HP/MP/CP, бафи, F5)

Довідник файлів і місць, де підтягується battle state, merge local vs server, hydrate/recalc, clamp ресурсів та бафи. Для відтворення "старі hp після F5" та діагностики.

---

## 0) Найважливіше (обов'язково)

| Файл | Що там |
|------|--------|
| **src/state/heroStore/heroLoad.ts** | Єдине читання героя з localStorage (`l2_accounts_v2`). Підтягує battle state через `loadBattle(hero.name)`, merge бафів з `savedBattle?.heroBuffs`, `cleanupBuffs`, `computeBuffedMaxResources`, recalc статів. В кінці **не** пишемо hero назад у localStorage. |
| **src/state/heroStore/heroLoadAPI.ts** | Merge local vs server: `hydrateHero(localHero)`, `loadBattle(hydratedLocalHero.name)`, логіка hp/mp/cp (hpFull/mpFull/cpFull), clamp/fill через `recalculateAllStats` + `computeBuffedMaxResources`, вибір "найкращого" набору бафів, конфлікти sync (409). Тут формується фінальний hero після API. |
| **src/state/battle/persist.ts** | `loadBattle(heroName)`, `persistBattle(data, heroName)` — звідси можуть прийти "старі hp" (якщо зберігався battle state з іншими ресурсами). Ключ localStorage: `l2_battle_state_v7` або `l2_battle_state_v7_${heroName}`. |
| **src/state/heroStore.ts** | `setHero`, `loadHero`, `applyServerSync`, `updateHero`. Хто перетирає hero після F5: `setHero` викликається з App (localHero → потім loadHeroFromAPI → setHero(loadedHero)); **не** пишемо в localStorage з setHero/loadHero. |
| **src/state/heroStore/heroPersistence.ts** | Збереження героя (PUT на сервер, localStorage). Використовує `loadBattle(hero.name)`, `hydrateHero(hero)`, merge бафів з battle state при сейві; може впливати на наступний load (що потрапляє в heroJson/saved battle). |

---

## 1) Перерахунок статів/ресурсів (clamp, maxHp/maxMp/maxCp)

| Файл | Що там |
|------|--------|
| **src/utils/stats/recalculateAllStats.ts** | Перерахунок базових і фінальних статів по екіпу/скілах; повертає `resources: { maxHp, maxMp, maxCp }` та `baseFinalStats`. Імпортується в heroLoad.ts, heroLoadAPI.ts, baseAttack, attackSkill, heroUpdate. |
| **src/state/battle/helpers/resources.ts** | `computeBuffedMaxResources(base, buffs)` — приймає base `{ maxHp, maxMp, maxCp }` і масив бафів, повертає buffed max (з урахуванням applyBuffsToStats). Імпортується в heroLoad, heroLoadAPI, useSkill, summons, heroUpdate, StatusBars, City, ConsumableItemModal, startBattle, resurrect, regenTick. |
| **src/state/battle/helpers/getMaxResources.ts** | Єдине джерело для "base" max ресурсів з hero: читає `hero.baseMaxHp ?? heroJson?.maxHp ?? hero.maxHp` тощо. Використовується в useSkill, summons для отримання base перед `computeBuffedMaxResources(baseMax, activeBuffs)`. |

Інших окремих файлів типу `computeBuffedMaxResources.ts` в корені проєкту немає — він живе в **src/state/battle/helpers/resources.ts** і реекспортується через **src/state/battle/helpers/index.ts**.

---

## 2) Бафи і merge/cleanup (вплив на maxHp → clamp)

| Файл | Що там |
|------|--------|
| **src/state/battle/persist.ts** | Зберігання/завантаження battle state; у збереженому стані є `heroBuffs`. Окремого `loadBattle.ts` немає — все в persist.ts. |
| **src/state/battle/helpers/buffs.ts** | `cleanupBuffs(buffs, now)` — фільтр по `expiresAt > now`, дедуп toggle-бафів по stackType/id/name. `applyBuffsToStats(stats, buffs)` — застосування ефектів бафів до статів (в т.ч. maxHp/maxMp/maxCp). |
| **src/state/battle/actions/useSkill/buffHelpers.ts** | `createIsSameBuff(def)`, `processStackingBuffs(...)` — логіка "той самий баф", стеки (Sonic Focus, Focused Force), WC-ліміти; вибір/оновлення `expiresAt`. Використовується в buffSkill.ts, toggleSkill.ts, summonBuffs. |
| **src/state/battle/store.ts** | Створення battle store (initialState + createBattleActions). Не зберігає HP/MP/CP — тільки heroBuffs, status, heroNextAttackAt, cooldowns, summon тощо. |
| **src/state/battle/types.ts** | Опис BattleState: `status`, `heroNextAttackAt`, `heroBuffs`, `mobBuffs`, `summon`, timestamps. Ресурси героя тільки в heroStore.hero. |

---

## 3) Точка старту (порядок викликів після F5)

| Файл | Фрагмент / логіка |
|------|-------------------|
| **src/App.tsx** | Bootstrap (useEffect): 1) `fetch(/auth/refresh)` → setAccessToken; 2) `initializeCharacter()`; 3) для "важких" сторінок: одразу `getHeroFromLocalStorage()` → `hydrateHero(localHero) ?? localHero` → `setHero(heroToShow)` або `loadHero()`; потім `setIsLoading(false)`; потім у фоні `loadHeroFromAPI().then(loadedHero => setHero(loadedHero))`. Легкі сторінки (mail/about/forum) — UI одразу, hero у фоні через setTimeout. |
| **src/utils/api.ts** | Після F5 запити йдуть через apiRequest (Bearer + refresh retry). Якщо є characterId, loadHeroFromAPI тягне GET /characters/:id і далі merge — результат перетирає hero через setHero(loadedHero) в App. |

Орієнтовні рядки App: bootstrap ~169–287 (refresh → initializeCharacter → local hero → setHero → loadHeroFromAPI в фоні).

---

## 4) Дуже бажано (відтворення тиків після F5)

| Файл | Що там |
|------|--------|
| **src/screens/Battle.tsx** | Підписка на `useBattleStore()`: `processMobAttack`, `regenTick`, `status`, `heroBuffs` тощо. Тік/regen/processMobAttack викликаються зі стора і можуть писати hp/mp/cp у hero через `updateHero` всередині actions (regenTick, processMobAttack, baseAttack, attackSkill, summons). Якщо відкрити Battle одразу після F5, тики можуть перезаписати щойно відновлені ресурси. |

Тики та урон: **src/state/battle/actions/regenTick.ts**, **src/state/battle/actions/processMobAttack.ts**, **src/state/battle/actions/useSkill/baseAttack.ts**, **src/state/battle/actions/useSkill/attackSkill.ts**, **src/state/battle/actions/summons.ts** — там виклики `updateHero({ hp, mp, cp, ... })`.

---

## Швидкий посилання на імпорти

- **heroLoad.ts** і **heroLoadAPI.ts** імпортують: `recalculateAllStats` (utils/stats), `loadBattle` (battle/persist), `cleanupBuffs`, `computeBuffedMaxResources` (battle/helpers), `hydrateHero` (heroHydration).
- **computeBuffedMaxResources** і **getMaxResources**:  
  - `src/state/battle/helpers/resources.ts` — computeBuffedMaxResources  
  - `src/state/battle/helpers/getMaxResources.ts` — getMaxResources(hero)
- **cleanupBuffs / createIsSameBuff / processStackingBuffs**:  
  - cleanupBuffs: `src/state/battle/helpers/buffs.ts`  
  - createIsSameBuff, processStackingBuffs: `src/state/battle/actions/useSkill/buffHelpers.ts`
