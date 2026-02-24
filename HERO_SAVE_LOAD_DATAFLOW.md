# Звіт: збереження/завантаження стану героя (hp/mp/cp, heroJson)

Посилання на файли та рядки — без змін у коді.

---

## 1. Джерела правди

- **hero.hp, hero.mp, hero.cp** — єдине джерело правди в рантаймі (frontend store). Читаються скрізь з `useHeroStore.getState().hero` або `hero` з пропсів.
- **hero.maxHp, hero.maxMp, hero.maxCp** — обчислюються в `recalculateAllStats` + `computeBuffedMaxResources`; при load — з результатів load-функцій.
- **heroJson** — об’єкт для серіалізації (localStorage і API). Поля `isDead`, `deadAt`, `hpPercent`, `hpFull`, `mpPercent`, `mpFull`, `cpPercent`, `cpFull`, `hp`, `mp`, `cp`, `maxHp`, `maxMp`, `maxCp`, `heroBuffs` тощо. На сервері зберігається в `Character.heroJson` (JSONB).

---

## 2. Читання hero.hp / hero.mp / hero.cp

| Файл | Рядки | Контекст |
|------|-------|----------|
| `src/state/heroStore/heroLoad.ts` | 94–96 | Якщо у fixedHero немає hp/mp/cp — підставляються з `heroJson.hp/mp/cp` |
| `src/state/heroStore/isHeroDead.ts` | 7 | `hero.hp > 0` → живий |
| `src/state/heroStore/heroPersistence.ts` | 309–311 | `hero.hp/mp/cp` для обчислення hpPercent і hpToSave/mpToSave/cpToSave |
| `src/state/heroStore/heroUpdate.ts` | 109–114, 58–64 | Відсотки з prev.hp/mp/cp; валідація partial.hp/mp/cp |
| `src/state/battle/actions/processMobAttack.ts` | 77–79 | curHeroHP/MP/CP з hero |
| `src/state/battle/actions/regenTick.ts` | (heroAfterTicks) | Читання curHP/MP/CP з hero |
| `src/state/battle/actions/useSkill.ts` | 212, 492 | Перевірка MP; heroMP |
| `src/state/battle/actions/useSkill/attackSkill.ts` | 121–123, 249 | Поточні HP/MP/CP |
| `src/state/battle/actions/useSkill/baseAttack.ts` | 36–38 | curHeroHP/MP/CP |
| `src/state/battle/actions/useSkill/buffSkill.ts` | 70–72, 198–200 | Поточні ресурси |
| `src/state/battle/actions/useSkill/healSkill.ts` | 27, 62–64 | currentHpCheck, currentHeroHP/MP/CP |
| `src/state/battle/actions/useSkill/toggleSkill.ts` | 45–47 | curHP/MP/CP |
| `src/state/battle/actions/useSkill/buffHelpers.ts` | 29–31 | hp/mp/cp з hero |
| `src/state/battle/actions/useSkill/toggleTicks.ts` | 24–25 | curHP/curMP |
| `src/state/battle/actions/useConsumable.ts` | 77, 126, 169 | currentHp/Mp/Cp |
| `src/state/battle/actions/startBattle.ts` | 120, 242 | Перевірка (hero.hp ?? 0) > 0; коментар про читання |
| `src/state/battle/actions/resurrect.ts` | 36 | hero.cp для nextCP |
| `src/components/StatusBars.tsx` | 293–295 | hp/mp/cp для відображення (hero.hp ?? maxHp тощо) |
| `src/screens/City.tsx` | 45–47 | hp/mp/cp для UI |
| `src/screens/character/modals/ConsumableItemModal.tsx` | 65–74 | currentHp/Mp/Cp, newHp/Mp/Cp |
| `src/utils/stats/recalculateAllStats.ts` | 181–194, 204, 257 | Визначення currentHp з hero.hp; не перезаписує hp/mp/cp |
| `src/data/skills/applySkillEffect.ts` | 40–49 | Читання/запис hero.hp, hero.mp, hero.cp (tick-ефекти) |
| `src/utils/calculateHeroStats.ts` | 74–76 | Fallback baseMax з hero.maxHp/hp тощо |

---

## 3. Запис hero.hp / hero.mp / hero.cp

Усі зміни йдуть через **heroStore.updateHero(partial)**. Хто викликає updateHero з hp/mp/cp:

| Файл | Рядки | Контекст |
|------|-------|----------|
| `src/state/heroStore/heroUpdate.ts` | 56–64, 112–116, 125–128 | partial.hp/mp/cp → updated; при needsRecalc — adjustedHp/Mp/Cp, safeHp/Mp/Cp |
| `src/state/battle/actions/processMobAttack.ts` | 450, 492–496, 532–534 | Після урону: updateHero({ hp: nextHeroHP }) або з battleStats; при смерті: hp: 0, mp: 0, cp: 0 |
| `src/state/battle/actions/regenTick.ts` | 102 | updateHero({ hp: nextHP, mp: nextMP, cp: nextCP }) |
| `src/components/StatusBars.tsx` | 233–235, 263, 278 | updates.hp/mp/cp → updateHero(pendingUpdates) |
| `src/state/battle/actions/resurrect.ts` | 49–56, 88–90 | updateHero({ hp, mp, cp, heroJson: { isDead: false, deadAt: 0 } }); після API — ще раз updateHero з hj.hp/mp/cp |
| `src/state/battle/actions/useSkill.ts` | (через під-модулі) | attackSkill, healSkill, buffSkill тощо викликають updateHero з новими hp/mp/cp |
| `src/screens/character/modals/ConsumableItemModal.tsx` | (виклик updateHero) | Новий hp/mp/cp після використання предмета |
| `src/state/battle/actions/useConsumable.ts` | (виклик updateHero) | Відновлення hp/mp/cp з консумаблів |

**heroStore.ts**: `updateHero` (300–367) викликає `updateHeroLogic(prev, partial)` (317), потім `set({ hero: updated })` (325), далі за умовами — `saveHeroToLocalStorageOnly(updated)` (331) і/або `immediateSave`/`debouncedSave`. При `resurrectInProgress` (329) persistence не викликається. При лише `hp/mp/cp` (onlyRegen) — тільки localStorage, без API (332).

---

## 4. Читання heroJson (isDead, deadAt, hpPercent, hpFull, mp/cp-аналоги)

| Файл | Рядки | Що читається |
|------|-------|---------------|
| `src/state/heroStore/heroLoad.ts` | 87, 218–222, 233–263, 270, 281–283 | heroJson; isDead, deadAt; loadedHp; restoreFromPercentOrFallback(percentRaw, fullFlag…); heroJson з isDead: false при живих |
| `src/state/heroStore/heroLoadAPI.ts` | 70, 136, 163–174, 207–208, 382–388, 414–445, 450–452, 514–519, 533–535, 548–557, 613–628, 633–644 | character.heroJson; isDead/deadAt/hpPercent/mpPercent/cpPercent; serverIsDead, preferLocalAlive; restoreFromPercentOrFallback; isAliveAfterLoad; heroJson при злитті та логах |
| `src/state/heroStore/heroPersistence.ts` | 61–86, 338–341 | currentJson (hero.heroJson); isDead, deadAt; при saveHeroOnce — currentHeroJson.isDead/deadAt; heroJsonToSave (hpPercent, hpFull тощо) |
| `src/state/heroStore/heroUpdate.ts` | 74–78, 144–152, 156–164 | heroJson.heroBuffs; при finalHp > 0 — heroJson isDead: false, deadAt: 0 |
| `src/state/heroStore/isHeroDead.ts` | 8–9 | heroJson.isDead, heroJson.deadAt |
| `src/components/StatusBars.tsx` | 90–92, 154, 173–175, 200–201, 207 | heroJson, heroBuffs; isDead, deadAt; hpFull, hpPercent; довжина heroBuffs |
| `src/state/battle/actions/processMobAttack.ts` | 491, 501 | existingJson = hero.heroJson; запис isDead: true, deadAt |

---

## 5. Запис heroJson (isDead, deadAt, hpPercent, hpFull, hp/mp/cp, maxHp тощо)

| Файл | Рядки | Що пишеться |
|------|-------|-------------|
| `src/state/heroStore/heroLoad.ts` | 289–293 | heroWithRecalculatedStats.heroJson = { …heroJsonAny, isDead: false, deadAt: 0 при живих/ isAliveAfterLoad, heroBuffs } |
| `src/state/heroStore/heroLoadAPI.ts` | 516–519, 533–535, 548–582 | heroWithRecalculatedStats.heroJson (isDead: false при preferLocalAlive/finalHp/isAliveAfterLoad); hydratedHero.heroJson (heroBuffs, premiumUntil тощо) |
| `src/state/heroStore/heroPersistence.ts` | 51–87 (saveHeroToLocalStorageOnly) | heroJson = { …currentJson, …buildBackupHeroJson, hp, mp, cp, maxHp, maxMp, maxCp, isDead, deadAt, heroBuffs, hpFull, mpFull, cpFull }; accounts[accIndex].hero = { …hydrated, heroJson } |
| `src/state/heroStore/heroPersistence.ts` | 298–386 (saveHeroOnce) | hpNow/mpNow/cpNow з hero; hpPercent/mpPercent/cpPercent; hpToSave/mpToSave/cpToSave (clamp до base max); heroJsonToSave: isDead, deadAt, hp, mp, cp, maxHp, maxMp, maxCp, hpFull, mpFull, cpFull, hpPercent, mpPercent, cpPercent, heroBuffs, inventory, equipment тощо |
| `src/state/heroStore/heroUpdate.ts` | 142–164 | При finalHp > 0: result.heroJson = { …hj, isDead: false, deadAt: 0, heroBuffs }; інакше — лише heroBuffs мердж |
| `src/state/heroStore/heroHydration.ts` | 55–71 | heroJson синхронізований з hero (name, race, klass, skills, mobsKilled, exp, level, dailyQuests); не пише hp/mp/cp/isDead/deadAt/hpPercent |
| `src/state/battle/actions/processMobAttack.ts` | 491–501 | updateHero(…, heroJson: { …existingJson, heroBuffs: [], isDead: true, deadAt }) |
| `src/state/battle/actions/resurrect.ts` | 53, 88–91 | updateHero(…, heroJson: { …existingJson, isDead: false, deadAt: 0, heroBuffs: [] }); після API — heroJson: { …heroJson, …hj, isDead: false, deadAt: 0 } |
| `src/components/StatusBars.tsx` | 154 | updateHero({ heroJson: { …heroJson, heroBuffs: cleaned } }) при очищенні прострочених бафів |

---

## 6. restoreFromPercentOrFallback

- **Файл**: `src/state/heroStore/restoreResourceFromPercent.ts`  
- **Сигнатура**: `restoreFromPercentOrFallback({ percentRaw, fullFlag, savedValueRaw, savedMaxRaw, finalMax, isDead })`.  
- **Поведінка**: якщо `isDead` — повертає 0; інакше з percent/fullFlag/savedValue обчислює значення в межах finalMax.  
- **Виклики**:
  - `heroLoad.ts` 233–255: finalHp, finalMp, finalCp при завантаженні з localStorage (з heroJsonAny.hpPercent, hpFull тощо).
  - `heroLoadAPI.ts` 415–443: finalHp, finalMp, finalCp при завантаженні з API (heroDataAny?.hpPercent, hpFull тощо).

---

## 7. Сервер: читання/запис heroJson та hp/mp/cp

| Файл | Рядки | Дія |
|------|-------|-----|
| `server/src/characters.ts` | 48, 57–66, 121–148, 206–236, 266–296, 323–356, 386–498, 539–572, 596–611, 678–1106, 1134–1196, 1238–1347 | GET: heroJson у select; міграція heroRevision; створення з heroJson: {}; PATCH nickColor/name — merge heroJson; resurrect endpoint: читання heroJson, запис isDead: false, deadAt: 0, hp/mp/cp = max, hpFull/mpFull/cpFull = true, hpPercent/mpPercent/cpPercent = 1; PUT: body.heroJson мердж з існуючим, валідація, optimistic locking по heroRevision |
| `server/src/characters.ts` | 340–356 | Endpoint «set hp»: читання heroJson.hp, maxHp; запис hp: newHp, heroRevision |
| `server/src/characters.ts` | 551–562 | Resurrect: heroJson isDead: false, deadAt: 0, hp/mp/cp = maxHp/Mp/Cp, hpFull/mpFull/cpFull: true, hpPercent/mpPercent/cpPercent: 1 |
| `server/src/routes/adminPlayers.ts` | 44–66, 83–109, 124–159 | Читання/запис heroJson (inventory, level/exp/hp/mp/cp тощо) |
| `server/src/routes/premium.ts` | 51–84 | Читання heroJson, оновлення premiumUntil у heroJson |

---

## 8. Порядок викликів

### 8.1 Старт додатку (важкі сторінки, авторизований користувач)

1. **App.tsx** 167–264: `getHeroFromLocalStorage()` (heroLoad без запису в store) → `hydrateHero(localHero)` → `setHero(heroToShow)`.
2. **heroStore.ts** 276–290: `setHero(h)` → `hydrateHero(h)` → `set({ hero: hydrated })`. У localStorage не пишемо (289).
3. Паралельно **loadHeroFromAPI()** (263–266): GET character → merge local + server у heroLoadAPI → повертає Hero → `setHero(loadedHero)`.
4. **heroLoadAPI.ts** 21–650: якщо є characterId — `loadHero()` (35) → hydrateHero → GET /characters/:id → merge heroData (character.heroJson) з local; обчислення isDead, preferLocalAlive, finalHp/finalMp/finalCp (в т.ч. 70% при isDead — isAliveAfterLoad); recalculateAllStats; heroWithRecalculatedStats.heroJson = { isDead: false при живих, heroBuffs }; hydrateHero → повертає героя.
5. Якщо при load був мертвий — у heroLoad/heroLoadAPI finalHp = 70% maxHp, isAliveAfterLoad = true, heroJson.isDead: false, deadAt: 0.

### 8.2 F5 (перезавантаження сторінки)

1. Той самий bootstrap: refresh token (App 179–186), initializeCharacter (189).
2. **getHeroFromLocalStorage()** = виклик **loadHero()** з heroStore/heroLoad (без setHero у циклі — виклик з App напряму з heroLoad).
3. **heroLoad.ts** 20–307: читання з `getJSON("l2_accounts_v2")` → fixHeroProfession → заповнення fixedHero з heroJson (88–96, hp/mp/cp якщо undefined); recalculateAllStats; isDead з heroJsonAny.isDead/deadAt; loadedHp > 0 → isDead = false; якщо isDead — finalHp/finalMp/finalCp = 70% max, isAliveAfterLoad = true; інакше restoreFromPercentOrFallback; heroWithRecalculatedStats.heroJson = { … isDead: false при loadedHp>0 або finalHp>0 або isAliveAfterLoad }; hydrateHero → return.
4. У App далі або **setHero(heroToShow)** з локального результату, або після **loadHeroFromAPI()** → **setHero(loadedHero)**. setHero не пише в localStorage.
5. Якщо потім викликається **updateHero** (наприклад реген) — **heroStore** 331: **saveHeroToLocalStorageOnly(updated)** → heroPersistence 51–88: build heroJson з currentJson (hero.heroJson), hp/mp/cp з hero, isDead/deadAt з currentJson, hpFull/mpFull/cpFull; запис у l2_accounts_v2.

### 8.3 Бій (урон і реген)

1. **processMobAttack** (виклик по таймеру/події): читання hero.hp/mp/cp (77–79) → обчислення nextHeroHP → якщо nextHeroHP <= 0 і немає salvation — гілка смерті: **updateHero**({ hp: 0, mp: 0, cp: 0, heroJson: { …existingJson, heroBuffs: [], isDead: true, deadAt } }, { persist: true }) (processMobAttack 492–501); persistBattle(status: "idle", heroBuffs: []).
2. **heroStore.updateHero**: updateHeroLogic → set({ hero }) → saveHeroToLocalStorageOnly(updated) → (якщо не onlyRegen) immediateSave або debouncedSave → saveHeroToLocalStorage → saveHeroOnce → heroPersistence пише в heroJson hp/mp/cp (clamp по percent), isDead, deadAt (338–341, 356–368).
3. **regenTick** (інтервал у Battle): getHeroRegenPerSecond → updateHero({ hp: nextHP, mp: nextMP, cp: nextCP }) (regenTick 102). heroStore: onlyRegen → тільки saveHeroToLocalStorageOnly, без API (332).

### 8.4 Resurrect (оживлення)

1. **resurrect.ts** (createResurrect): setResurrectInProgress(true) → обчислення nextHP/nextMP/nextCP (ratio з resurrection) → **updateHero**({ hp, mp, cp, battleStats, heroJson: { …existingJson, isDead: false, deadAt: 0, heroBuffs: [] } }, { persist: true }) (49–56).
2. **heroStore.updateHero**: через resurrectInProgress (329) — **не** викликаються saveHeroToLocalStorageOnly, immediateSave, debouncedSave.
3. resurrect.ts 59–61: **saveHeroToLocalStorageOnly(heroAfterUpdate)** вручну — щоб після F5 був живий стан.
4. resurrect.ts 76–99: **resurrectCharacter(characterId)** (API) → у відповіді character.heroJson → setResurrectInProgress(false) → **updateHero**({ hp, mp, cp з hj, heroJson: { …heroJson, …hj, isDead: false, deadAt: 0 } }, **{ persist: false }**) → **saveHeroToLocalStorage(heroAfterSync)** вручну (99).
5. Сервер **POST /characters/:id/resurrect** (characters.ts 539–572): оновлює heroJson isDead: false, deadAt: 0, hp/mp/cp = max, hpFull/mpFull/cpFull: true, hpPercent/mpPercent/cpPercent: 1.

---

## 9. Стисла схема data-flow

- **Читання стану**: localStorage (l2_accounts_v2) → heroLoad() → hero; API GET /characters/:id → character.heroJson → heroLoadAPI() merge → Hero. У рантаймі все читається з **hero** (store).
- **Запис у store**: лише через **setHero** (об’єкт повністю) або **updateHero** (partial). updateHero → updateHeroLogic → hydrateHero → set({ hero }).
- **Запис у localStorage**: тільки з **heroPersistence**: saveHeroToLocalStorageOnly (при updateHero/setHero після load не викликається для setHero; для updateHero — так, крім resurrectInProgress) і saveHeroOnce (локальний шлях при неавторизованому).
- **Запис на сервер**: saveHeroToLocalStorage → saveHeroOnce → PUT /characters/:id з body.heroJson (і expectedRevision). heroJson формується в heroPersistence (hp/mp/cp у відсотках і абсолютних, isDead, deadAt, hpFull, hpPercent тощо).
- **isHeroDead**: hero.hp > 0 → false; інакше heroJson.isDead || deadAt > 0 (isHeroDead.ts 6–9).

Усі посилання вище — файл + номери рядків у поточному стані репозиторію.
