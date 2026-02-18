# HP — все в одному файлі (що і до чого)

Один файл з повним описом: де береться HP, хто його читає, хто пише, як це пов’язано. **Код не змінюється** — тільки опис.

---

## 1. Джерела maxHp

- **Базовий max (без бафів):** `recalculateAllStats(hero, [])` → `resources.maxHp` (з екіпу, скілів, статів). Зберігається в `hero.baseMaxHp` / `heroJson.maxHp`.
- **Базовий max з hero:** `getMaxResources(hero)` → читає `hero.baseMaxHp ?? heroJson.maxHp ?? hero.maxHp` → повертає `{ maxHp, maxMp, maxCp }`. Файл: `src/state/battle/helpers/getMaxResources.ts`.
- **Buffed max:** `computeBuffedMaxResources(baseMax, buffs)` → застосовує бафи до base, повертає `{ maxHp, maxMp, maxCp }`. Файл: `src/state/battle/helpers/resources.ts`.

---

## 2. Джерело поточного hp

- Єдине джерело в клієнті: **`hero.hp`**. У бою і в місті читаємо саме його; max для відображення і clamp — з getMaxResources + computeBuffedMaxResources.

---

## 3. Завантаження (хто ставить hp при F5 / load)

- **heroLoad.ts** (local): з heroJson рахує baseMax (recalculated.resources), buffedMax (computeBuffedMaxResources), потім `restoreFromPercentOrFallback` (hpPercent, hpFull, hp, maxHp, finalMax=buffedMax.maxHp, isDead). Результат → `hero.hp`, `hero.maxHp` = buffedMax.
- **heroLoadAPI.ts** (з API): те саме + логіка preferLocalAlive (коли сервер ще isDead, а локально вже живий — не перезаписувати hp на 0). finalHp/finalMp/finalCp через restoreFromPercentOrFallback або з локального героя.

---

## 4. Збереження (хто пише hp у heroJson / на сервер)

- **heroPersistence.ts:** при кожному save рахує baseMax (з hero), buffedMax (з merged buffs), hpPercent = hero.hp / buffedMax.maxHp, потім `hpToSave = clamp(percent * baseMax.maxHp)`, у heroJson пишуться `hp`, `maxHp`, `hpFull`, `hpPercent`, `isDead`, `deadAt`. Викликається з heroStore (setHero, loadHero, updateHero).

---

## 5. Оновлення героя (level up, recalc)

- **heroUpdate.ts:** при partial (наприклад після recalc) бере `prevMaxHp`, `hpPercent = prev.hp / prevMaxHp`, потім adjustedHp і safeHp (clamp до buffedMax.maxHp), записує `hero.hp`, `hero.maxHp`, `baseMaxHp`.

---

## 6. Бойові тіки і атаки

- **regenTick.ts:** якщо герой не мертвий — baseMax = getMaxResources(hero), buffedMax = computeBuffedMaxResources(baseMax, mergedHeroBuffs), curHP = min(maxHp, hero.hp), nextHP = min(maxHp, curHP + hpRegen), updateHero({ hp: nextHP, ... }).
- **processMobAttack.ts:** baseMax, buffedMax, curHeroHP = min(maxHp, hero.hp), nextHeroHP = curHeroHP - heroDamage. Якщо nextHeroHP <= 0 — смерть: updateHero(hp:0, mp:0, cp:0, heroJson: { heroBuffs:[], isDead:true, deadAt }), persist battle. Інакше updateHero({ hp: nextHeroHP, ... }).
- **startBattle.ts:** перевірка (hero.hp ?? 0) > 0 перед стартом бою.

---

## 7. Скіли (атака, хіл, бафи, тощо)

- **baseAttack.ts, attackSkill.ts:** curHeroHP = min(maxHp, hero.hp), після вампір/хіл nextHeroHP, updateHero({ hp: ... }).
- **buffSkill.ts, healSkill.ts:** аналогічно — clamp по maxHp, updateHero({ hp: newHeroHP, ... }).
- **toggleSkill.ts, toggleTicks.ts:** curHP = min(maxHp, hero.hp), newHP змінюється від ефектів, updateHero({ hp: newHP, ... }).
- **specialSkills.ts:** curHeroHP, nextHeroHP, updateHero.
- **useConsumable.ts:** currentHp = min(maxHp, hero.hp), newHp після зілля, updateHero({ hp: newHp, ... }).

---

## 8. Resurrect (оживлення)

- **resurrect.ts:** ratio з resurrection, nextHP = max(1, round(maxHp * ratio)), updateHero({ hp: nextHP, mp: nextMP, cp: nextCP, heroJson: { isDead: false, deadAt: 0, heroBuffs: [] } }), потім виклик API resurrectCharacter.

---

## 9. Смерть (критерій і наслідки)

- Мертвий тільки з **heroJson:** `isDead === true` або `deadAt > 0`. Файл: `src/state/heroStore/isHeroDead.ts`. Не використовувати hp <= 0 як критерій смерті (щоб не закріплювати нуль під час апдейтів).
- При смерті: heroJson.heroBuffs = [], isDead = true, deadAt = now, hp/mp/cp = 0; в тіках (idle regen, regenTick, processMobAttack) якщо isHeroDead(hero) — не оновлювати hp/mp/cp.

---

## 10. Idle regen (StatusBars)

- **StatusBars.tsx:** buffedMaxHp = computeBuffedMaxResources(baseMax, battleBuffs). Idle regen: nextHp = min(buffedMaxHp, (hero.hp ?? buffedMaxHp) + hpRegen). Стоп регену коли hp >= buffedMaxHp. Запис через updateHero.

---

## 11. Відновлення з percent при load

- **restoreResourceFromPercent.ts:** restoreFromPercentOrFallback(percentRaw, fullFlag, savedValueRaw, savedMaxRaw, finalMax, isDead). Якщо isDead → 0; інакше percent/full/saved value, clamp до finalMax. Використовується в heroLoad і heroLoadAPI для finalHp/finalMp/finalCp.

---

## 12. UI

- **StatusBars.tsx:** value = hero.hp ?? maxHp, max = maxHp (відображення).
- **City.tsx:** baseMax, buffed max, hp = hero.hp ?? maxHp.
- **MagicStatue.tsx:** heroUpdate з hp/maxHp (або 0 при респавні).
- **ConsumableItemModal.tsx:** baseMax, buffedMax, updateHero({ hp: newHp }).
- **TargetCard.tsx:** моб — maxHP = mob.hp (це max HP моба).
- **SummonStatus.tsx:** summon.hp, summon.maxHp.

---

## 13. Типи і фабрика

- **Hero / HeroJson:** hp, maxHp.
- **heroFactory.ts:** початковий maxHp з формули, hp = maxHp.
- **battle types:** Summon hp/maxHp.

---

## 14. Сервер

- **server/src/characters.ts:** читання heroJson.maxHp, heroJson.hp; запис hp/maxHp у heroJson; resurrect — isDead=false, deadAt=0, hp/mp/cp=max.

---

## 15. Решта (статисти, пасивки, дані)

- **recalculateAllStats.ts:** повертає resources.maxHp (без поточного hp).
- **calcResources.ts:** формула maxHp (base + екіп, сети, тату).
- **applyPassiveSkills.ts, applySkillPassives.ts:** maxHp у статах, hpThreshold для умов.
- **Предмети/сети:** stats.maxHp, maxHpPercent у itemsDB, armorSets, questShop.
- **Моби:** поле hp у даних — це max HP моба.

---

## Ланцюжок (стисло)

1. **Max:** recalculateAllStats → base; getMaxResources(hero) → base з hero; computeBuffedMaxResources(base, buffs) → buffed max.
2. **Поточний hp:** завжди hero.hp.
3. **Пишуть hp:** heroLoad, heroLoadAPI, heroUpdate, heroPersistence (у heroJson), regenTick, processMobAttack, скіли (baseAttack, attackSkill, buffSkill, healSkill, toggleSkill, specialSkills), resurrect, useConsumable, toggleTicks, StatusBars (idle regen).
4. **Мертвий:** тільки heroJson.isDead / heroJson.deadAt (isHeroDead). При смерті — hp=0, heroBuffs=[], isDead=true, deadAt.

Якщо щось не так з HP — дивись цей файл і відповідний пункт вище; потім відкривай указаний файл у коді.
