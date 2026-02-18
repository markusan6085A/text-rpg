# Карта використання HP у проєкті

**Єдине джерело правди для HP/MP/CP:** `src/state/heroStore/heroResources.ts`  
Там зібрано: `getMaxResources`, `isHeroDead`, `restoreFromPercentOrFallback`, `buildResourceFieldsForSave`, `getFinalResourcesOnLoad`, `getDeathHeroJsonPatch`, `getResurrectHeroJsonPatch`. Load/save/death/resurrect беруть дані звідти.

---

Усі місця, де використовується `hp`, `maxHp`, `baseMaxHp` або пов’язані значення. По кілька рядків коду на файл.

---

## 1. Завантаження / збереження героя

### src/state/heroStore/heroLoad.ts
- Читання з heroJson: `fixedHero.hp = Number(heroJson.hp ?? 0)`
- Базовий max з recalc: `baseMax = { maxHp: recalculated.resources.maxHp, ... }`
- Фінальний max з бафами: `finalMaxHp = buffedMax.maxHp`
- Фінальний hp (clamp по buffed): `finalHp = hpFull ? finalMaxHp : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0))`
- Запис у героя: `maxHp: finalMaxHp`, `hp: finalHp`, `(heroWithRecalculatedStats as any).baseMaxHp = recalculated.resources.maxHp`

### src/state/heroStore/heroLoadAPI.ts
- Базовий max для merge: `baseMax = { maxHp: recalculated.resources.maxHp, ... }`
- Merge local: `hp: Math.min(hydratedLocalHero.hp ?? buffedMax.maxHp, buffedMax.maxHp)`
- Фінальний max: `finalMaxHp = buffedMax.maxHp`
- Фінальний hp: `finalHp = hpFull ? finalMaxHp : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0))`
- Запис: `maxHp: finalMaxHp`, `hp: finalHp`, `baseMaxHp = recalculated.resources.maxHp`

### src/state/heroStore/heroPersistence.ts
- Чи повний пул: `wasFullHp = Number(hero.hp ?? 0) >= Number(hero.maxHp ?? 1)`
- Базовий max для save: `baseMaxHp = (hero as any).baseMaxHp ?? existingHeroJson.maxHp ?? hero.maxHp ?? 1`
- Clamp перед записом: `hpToSave = Math.min(Math.max(0, Number(hero.hp ?? 0)), baseMaxHp)`
- У heroJson: `hp: hpToSave`, `maxHp: baseMaxHp`

### src/state/heroStore/heroUpdate.ts
- Явний partial: `updated.hp = Math.max(0, partial.hp)` (не clamp до hero.maxHp)
- Після recalc: `prevMaxHp = prev.maxHp ?? buffedMax.maxHp`, `hpPercent = (prev.hp ?? 0) / prevMaxHp`
- adjusted: `adjustedHp = partial.hp !== undefined ? partial.hp : Math.round(hpPercent * buffedMax.maxHp)`
- safeHp: `safeHp = ... Math.min(buffedMax.maxHp, Math.max(0, adjustedHp))`
- Запис: `maxHp: buffedMax.maxHp`, `hp: isLevelUp ? buffedMax.maxHp : safeHp`, `baseMaxHp = recalculated.resources.maxHp`

---

## 2. Battle: max ресурси та тіки

### src/state/battle/helpers/getMaxResources.ts
- Кандидати для base: `[heroAny.baseMaxHp, hero.maxHp, heroAny.heroJson?.maxHp, hero.hp]`
- Результат: `baseMaxHp = Math.max(...candidatesHp)`, `return { maxHp: Math.max(1, baseMaxHp), ... }`

### src/state/battle/helpers/resources.ts (computeBuffedMaxResources)
- Вхід: `base: { maxHp, maxMp, maxCp }`, застосування бафів, повертає `{ maxHp, maxMp, maxCp }` (buffed).

### src/state/battle/actions/regenTick.ts
- Перевірка: `if ((hero.hp ?? 0) <= 0) return`
- baseMax: `getMaxResources(heroAfterTicks)`, `{ maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, mergedHeroBuffs)`
- Поточний/наступний: `curHP = Math.min(maxHp, heroAfterTicks.hp ?? maxHp)`, `nextHP = Math.min(maxHp, curHP + hpRegen)`
- Запис: `updateHero({ hp: nextHP, mp: nextMP, cp: nextCP })`

### src/state/battle/actions/processMobAttack.ts
- baseMax: `getMaxResources(hero)`, `{ maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, nextBuffs)`
- Поточний/урон: `curHeroHP = Math.min(maxHp, hero.hp ?? maxHp)`, `nextHeroHP = Math.max(0, curHeroHP - heroDamage)`
- Запис: `updateHero({ hp: nextHeroHP })` або з battleStats; Salvation: `hp: savedHP`; смерть: `hp: 0`, `heroJson: { heroBuffs: [] }`

### src/state/battle/actions/startBattle.ts
- Умова старту: `(hero.hp ?? 0) > 0`
- Коментар: у бою читаємо `hero.maxHp`, `hero.hp`

---

## 3. Battle: скіли (атака, хіл, бафи, тощо)

### src/state/battle/actions/useSkill/baseAttack.ts
- `const { maxHp, ... } = computeMaxNow(activeBuffs)`
- `curHeroHP = Math.min(maxHp, hero.hp ?? maxHp)`
- `nextHeroHP = Math.min(maxHp, curHeroHP + healFromVamp)`
- `updateHero({ hp: nextHeroHP })` / при левелапі `updateHero({ hp: heroHpAfter, ... })`

### src/state/battle/actions/useSkill/attackSkill.ts
- `currentHeroHP = Math.min(maxHp, hero.hp ?? maxHp)`
- `healedHeroHP = Math.min(maxHp, currentHeroHP + healFromVamp)`
- `updateHero({ hp: heroHpAfter, ... })`

### src/state/battle/actions/useSkill/buffSkill.ts
- `curHeroHP = Math.min(maxHp, hero.hp ?? maxHp)` / `Math.min(curMaxHp, hero.hp ?? curMaxHp)`
- `newHeroHP = clamp(curHeroHP + healedFromMax + ..., maxHp)`
- `heroWithNewHp = { ...hero, hp: newHeroHP, maxHp: maxHp }`, далі `updateHero({ hp: newHeroHP, ... })`

### src/state/battle/actions/useSkill/healSkill.ts
- `currentHeroHP = Math.min(maxHp, hero.hp ?? maxHp)`
- `heroWithHealedHp = { ...hero, hp: nextHeroHP, maxHp: maxHp }`, `updateHero({ hp: nextHeroHP, ... })`

### src/state/battle/actions/useSkill/toggleSkill.ts
- `curHP = Math.min(maxHp, hero.hp ?? maxHp)`
- `updateHero({ hp: curHP, mp: curMP, cp: curCP })`

### src/state/battle/actions/useSkill/buffHelpers.ts
- Для контексту: `maxHp: hero.maxHp ?? 1`, `hp: hero.hp ?? 0`
- Моб: `maxHp: state.mob.hp`, `hp: state.mobHP`

### src/state/battle/actions/useSkill/specialSkillHandlers.ts
- Параметр `curHeroHP`, перевірка: `if (curHeroHP <= hpConsume)`

### src/state/battle/actions/specialSkills.ts
- `curHeroHP = Math.min(maxHp, hero?.hp ?? maxHp)`
- `heroWithNewHp = { ...hero, hp: nextHeroHP, maxHp: maxHp }`, `updateHero({ hp: nextHeroHP, ... })`

### src/state/battle/actions/toggleTicks.ts
- `curHP = Math.min(maxHp, hero.hp ?? maxHp)`
- `newHP = Math.max(0, Math.min(maxHp, curHP + hpChange))`
- `updateHero({ hp: newHP, mp: newMP })`

### src/state/battle/actions/resurrect.ts
- `nextHP = Math.max(1, Math.round(maxHp * ratio))`
- `heroWithResurrectedHp = { ...hero, hp: nextHP, maxHp: maxHp }`, `updateHero({ hp: nextHP, ... })`

### src/state/battle/actions/useConsumable.ts
- `currentHp = Math.min(maxHp, hero.hp ?? maxHp)`
- `updateHero({ hp: newHp, inventory: ... })`

---

## 4. Summons (summon.hp / summon.maxHp)

### src/state/battle/actions/summons.ts
- `summonMaxHp = Math.max(1, Math.round(maxHp * config.hpMultiplier))`
- Створення: `hp: summonMaxHp`, `maxHp: summonMaxHp`
- Хіл: `healedSummonHp = Math.min(state.summon.maxHp, state.summon.hp + healAmount)`
- При левелапі героя: `hp: leveled ? maxHp : Math.min(maxHp, curHero.hp ?? maxHp)`

### src/state/battle/hydrateFromStorage.ts
- `saved.summon && saved.summon.hp > 0 ? saved.summon : null`

---

## 5. Перерахунок статів / пасивки

### src/utils/stats/recalculateAllStats.ts
- Для пасивок (hpThreshold): `currentMaxHp = buffedMax.maxHp`, `currentHp` з `hero.hp` / `resources.maxHp`
- Повертає тільки max: `resources: { ...finalResources }` (без hp/mp/cp = maxHp/maxMp/maxCp)

### src/utils/stats/calcResources.ts
- Формула max: `maxHp = Math.round(baseHp * conBonus)` + екіп, сети, тату; `return { hp: 0, maxHp, ... }`

### src/utils/stats/applyPassiveSkills.ts
- applyPassiveSkillsToResources: початковий `stats = { maxHp: resources.maxHp, maxMp, maxCp }`
- Після пасивок: `finalMaxHp = Math.max(1, Math.round(Number(stats.maxHp) || resources.maxHp || 1))`
- applyPassiveSkillsToCombat: перевірка hpThreshold з `maxHp`, `currentHp` для умов скілів

### src/data/skills/effects/applySkillPassives.ts
- Тип: `maxHp?: number` у BattleStats
- SAFE_BASE_RESOURCES: `maxHp: 1`
- isResourceStat: `targetStat === "maxHp"`; для percent/multiplier clamp maxHp >= 1

---

## 6. UI / екрани

### src/components/StatusBars.tsx
- `const { maxHp: buffedMaxHp, ... } = computeBuffedMaxResources(baseMax, battleBuffs)`
- `nextHp = Math.min(buffedMaxHp, (currentHero.hp ?? buffedMaxHp) + hpRegen)`
- Відображення: `hp = hero.hp ?? maxHp`, `<Bar label="HP" value={hp} max={maxHp} ... />`

### src/screens/City.tsx
- `maxHp: hero.maxHp || 1` у baseMax, потім `maxHp = buffed.maxHp`, `hp = hero.hp ?? maxHp`

### src/screens/MagicStatue.tsx
- heroUpdate з `maxHp: currentHero.maxHp ?? 1`, `hp: Math.min(currentHero.hp ?? baseMax.maxHp, baseMax.maxHp)` (або hp=0 для респа)

### src/screens/character/modals/ConsumableItemModal.tsx
- `maxHp: hero.maxHp || 1000` у baseMax, `maxHp = buffedMaxHp`, `updateHero({ hp: newHp, ... })`

### src/screens/Shop.tsx, QuestShop.tsx, Location.tsx
- Відображення бонусів: `bonuses.maxHp`, `bonuses.maxHpPercent`, `itemDef.stats.maxHp`

### src/screens/battle/TargetCard.tsx
- Моб: `maxHP = typeof mob.hp === "number" ? mob.hp : 0`

### src/components/SummonStatus.tsx
- Сумон: `hp = summon.hp ?? 0`, `maxHp = summon.maxHp ?? 1`

---

## 7. Типи та фабрика

### src/types/Hero.ts
- `hp: number`, `maxHp: number` у Hero та HeroJson

### src/state/heroFactory.ts
- `maxHp = Math.round(baseHp * conBonus)`, початковий герой: `hp: maxHp`, `maxHp`

### src/state/battle/types.ts
- Summon: `hp`, `maxHp`; контекст скілів тощо

### src/state.ts (legacy?)
- `p.hp = Math.min(p.hp ?? mh, mh)`, `p.hp = clamp(..., 0, mh)`, `p.hp = maxHP(p.level)`

---

## 8. App / адмін

### src/App.tsx
- Коментар: loadHeroFromAPI рахує maxHp по екіпу/скілах — беремо його, щоб HP не падали після F5

### src/screens/PlayerProfile.tsx, PlayerAdminActions.tsx
- Відображення/редагування: `heroJson.hp`, `heroJson.maxHp` (fallback для профілю/адмінки)

---

## 9. Сервер

### server/src/characters.ts
- Читання: `rawMaxHp = heroJson.maxHp ?? ...`, `maxHp = rawMaxHp > 100 ? rawMaxHp : Math.max(100, 150 + level * 12)`
- `currentHp = rawHp > 0 ? Math.min(rawHp, maxHp) : maxHp`, `newHp = Math.min(maxHp, currentHp + body.power)`
- Запис у heroJson: `hp: newHp`, `maxHp: maxHp`

### server/src/routes/adminPlayers.ts
- Обчислення для адміна: `maxHp = Math.max(1, Math.round(baseHp * conBonus))`, початковий герой `hp: maxHp`, `maxHp`

---

## 10. Дані (предмети, сети, зони, моби)

- **Предмети/бонуси:** `stats.maxHp`, `stats.maxHpPercent` у itemsDB_*.ts, questShop.ts, armorSets.ts
- **Моби/зони:** поле `hp` у об’єктах мобів (data/zones/*.ts, data/bosses, world.ts) — це max HP моба
- **calcMobStats:** `calcMobStats(level, hp, name)` — hp моба для формул статів

---

## Ланцюжок для HP героя (стисло)

1. **Джерело max:** recalculateAllStats → resources.maxHp (base); computeBuffedMaxResources(base, buffs) → buffed maxHp.
2. **Джерело поточного hp:** hero.hp (єдине джерело правди в клієнті).
3. **Хто пише hero.hp:** heroLoad/heroLoadAPI (при F5), heroUpdate (при recalc/level), heroPersistence (при save), regenTick, processMobAttack, baseAttack, attackSkill, buffSkill, healSkill, toggleSkill, specialSkills, resurrect, useConsumable, toggleTicks.
4. **Хто читає max для clamp:** getMaxResources(hero) → baseMax; computeBuffedMaxResources(baseMax, buffs) → maxHp. У тіках/скілах: `curHP = Math.min(maxHp, hero.hp ?? maxHp)`.

Якщо після F5 HP падає — перевірити: чи getMaxResources повертає достатньо великий maxHp; чи десь не перезаписується hero.hp меншим значенням або не clamp’иться до меншого max.
