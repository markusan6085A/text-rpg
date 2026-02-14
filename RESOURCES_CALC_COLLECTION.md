# Збірка: calcResources, finalResources, clampedResources, hp: Math.min(...)

Усі фрагменти коду, пов’язані з обчисленням ресурсів (HP/MP/CP), clamp’ом по max та формулами.

---

## 1. `calcResources` — базова формула ресурсів

**Файл:** `src/utils/stats/calcResources.ts`

```ts
export interface Resources {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  cp: number;
  maxCp: number;
}

export function calcResources(
  baseStats: HeroBaseStats,
  level: number,
  equipment?: Record<string, string | null>,
  activeDyes?: Array<{ ... }>
): Resources {
  // Level scaling: CON/MEN бонуси
  const conBonus = 1 + (baseStats.CON - 40) * 0.01;
  const menBonus = 1 + (baseStats.MEN - 25) * 0.01;
  const baseHp = 200 + lvl * 56;
  const baseMp = 100 + lvl * 8;

  let maxHp = Math.round(baseHp * conBonus);
  let maxMp = Math.round(baseMp * menBonus);
  let maxCp = Math.round(maxHp * 0.6);

  // Equipment flat/percent, set bonuses, dyes...
  maxHp = Math.max(1, maxHp);
  // ...

  // ❗ calcResources = формула MAX, не поточний стан. HP/MP/CP — runtime state.
  return {
    hp: 0,
    maxHp,
    mp: 0,
    maxMp,
    cp: 0,
    maxCp,
  };
}
```

- Повертає **базові** max (без бафів). `hp/mp/cp` в return = 0 (calcResources не задає поточний стан; L2: newHP = min(oldHP, newMaxHP) в recalculateAllStats).

---

## 2. `finalResources` і `clampedResources` — recalculateAllStats

**Файл:** `src/utils/stats/recalculateAllStats.ts`

```ts
import { calcResources } from "./calcResources";
import { applyPassiveSkillsToResources } from "./applyPassiveSkills";

// 2. resources з calcResources (база + екіп + сет + dyes)
const resources = calcResources(grownBaseStats, level, hero.equipment, hero.activeDyes);

// 4. Пасивні скіли до ресурсів (БЕЗ бафів)
const finalResources = applyPassiveSkillsToResources(
  resources,
  learnedSkills,
  [], // бафи не передаємо
  hero.equipment
);

// 7. Clamp поточних ресурсів до нових max (L2 правило)
const clampedResources = {
  ...finalResources,
  hp: Math.min(finalResources.hp, finalResources.maxHp),
  mp: Math.min(finalResources.mp, finalResources.maxMp),
  cp: Math.min(finalResources.cp, finalResources.maxCp),
};

return {
  // ...
  resources: clampedResources,
};
```

- **finalResources** — ресурси після пасивок (все ще без бафів).
- **clampedResources** — беремо поточний hero.hp/mp/cp, clamp до new max (L2: newHP = min(oldHP, newMaxHP); HP не ресет при F5).

---

## 3. `applyPassiveSkillsToResources` — пасивки на maxHp/maxMp/maxCp

**Файл:** `src/utils/stats/applyPassiveSkills.ts`

```ts
import type { Resources } from "./calcResources";

export function applyPassiveSkillsToResources(
  resources: Resources,
  learnedSkills: any[],
  buffs: BattleBuff[] = [],
  equipment?: Record<string, string | null>
): Resources {
  let stats: any = {
    maxHp: resources.maxHp,
    maxMp: resources.maxMp,
    maxCp: resources.maxCp,
  };
  // ... applySinglePassive для кожного пасивного скіла ...

  return {
    ...resources,
    maxHp: Math.max(1, Math.round(stats.maxHp ?? resources.maxHp)),
    maxMp: Math.max(1, Math.round(stats.maxMp ?? resources.maxMp)),
    maxCp: Math.max(1, Math.round(stats.maxCp ?? resources.maxCp)),
  };
}
```

- Бафи **не** застосовуються тут — тільки в `computeBuffedMaxResources`.

---

## 4. `computeBuffedMaxResources` — max з бафами

**Файл:** `src/state/battle/helpers/resources.ts`

```ts
export const computeBuffedMaxResources = (
  base: { maxHp: number; maxMp: number; maxCp: number },
  buffs: BattleBuff[]
) => {
  const applied = applyBuffsToStats(base, buffs);
  const maxHp = Math.max(1, Math.round((applied as any).maxHp ?? base.maxHp));
  const maxMp = Math.max(1, Math.round((applied as any).maxMp ?? base.maxMp));
  const maxCp = Math.max(1, Math.round((applied as any).maxCp ?? base.maxCp));
  return { maxHp, maxMp, maxCp };
};
```

- **base** — зазвичай `recalculated.resources` (maxHp/maxMp/maxCp без бафів).
- Результат — max **з** бафами; по ньому clamp’ять поточні hp/mp/cp в runtime.

---

## 5. `getMaxResources` — взяття base max з героя

**Файл:** `src/state/battle/helpers/getMaxResources.ts`

```ts
export function getMaxResources(hero: HeroResourcesSource | null): { maxHp; maxMp; maxCp } {
  if (!hero) return { maxHp: 1, maxMp: 1, maxCp: 1 };
  const maxHp = hero.maxHp ?? hero.hp ?? 1;
  const maxMp = hero.maxMp ?? hero.mp ?? 1;
  const maxCp = hero.maxCp ?? Math.max(1, Math.round(maxHp * 0.6));
  return { maxHp: Math.max(1, maxHp), maxMp: Math.max(1, maxMp), maxCp };
}
```

- Використовується в `recalculateAllStats` для отримання base max при перевірці HP (наприклад для hpThreshold скілів).

---

## 6. heroUpdate — clamp по buffed max

**Файл:** `src/state/heroStore/heroUpdate.ts`

```ts
// recalculated.resources — базові max без бафів
const baseMax = {
  maxHp: recalculated.resources.maxHp,
  maxMp: recalculated.resources.maxMp,
  maxCp: recalculated.resources.maxCp,
};
const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);

// Клампимо по buffed max
const hpToUse = partial.hp !== undefined ? partial.hp : prev.hp;
const safeHp =
  hpToUse === undefined || hpToUse <= 0
    ? buffedMax.maxHp
    : Math.min(buffedMax.maxHp, Math.max(0, hpToUse));
// ... safeMp, safeCp аналогічно

updated = {
  ...updated,
  maxHp: buffedMax.maxHp,  // buffed — узгоджено з hp
  hp: isLevelUp ? buffedMax.maxHp : safeHp,
  // ...
};
(updated as any).baseMaxHp = recalculated.resources.maxHp;
```

- В runtime у героя зберігаються **buffed** max і hp/mp/cp, clamp по **buffedMax**.
- Для persistence зберігається **base** max: `baseMaxHp` = `recalculated.resources.maxHp`.

---

## 7. heroLoad (localStorage) — finalHp по finalMaxHp

**Файл:** `src/state/heroStore/heroLoad.ts`

```ts
const recalculated = recalculateAllStats(fixedHero, []);
const baseMax = {
  maxHp: recalculated.resources.maxHp,
  maxMp: recalculated.resources.maxMp,
  maxCp: recalculated.resources.maxCp,
};
const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);
const finalMaxHp = buffedMax.maxHp;

const finalHp =
  fixedHero.hp === undefined || fixedHero.hp <= 0 || fixedHero.hp >= finalMaxHp
    ? finalMaxHp
    : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0));

const heroWithRecalculatedStats = {
  ...fixedHero,
  maxHp: finalMaxHp,
  hp: finalHp,
  // ...
};
(heroWithRecalculatedStats as any).baseMaxHp = recalculated.resources.maxHp;
```

- **hp** і **maxHp** в одному просторі (обидва з бафами), щоб подальший clamp ніде не обрізав hp.

---

## 8. heroLoadAPI — local preferred і server branch

**Файл:** `src/state/heroStore/heroLoadAPI.ts`

### 8.1 Local preferred (мердж з локальним героєм)

```ts
const recalculated = recalculateAllStats(hydratedLocalHero, []);
const baseMax = { maxHp: recalculated.resources.maxHp, maxMp: ..., maxCp: ... };
const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);

const mergedHero = {
  ...hydratedLocalHero,
  maxHp: buffedMax.maxHp,
  hp: serverHp !== undefined
    ? Math.min(serverHp, buffedMax.maxHp)
    : Math.min(hydratedLocalHero.hp ?? buffedMax.maxHp, buffedMax.maxHp),
  // mp, cp аналогічно
};
(mergedHero as any).baseMaxHp = recalculated.resources.maxHp;
```

### 8.2 Server branch — finalHp з fill при збільшенні max

```ts
const recalculated = recalculateAllStats(heroForRecalc, []);
const baseMax = { maxHp: recalculated.resources.maxHp, ... };
const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);
const finalMaxHp = buffedMax.maxHp;

const newMaxIncreasedHp = recalculated.resources.maxHp > oldMaxHp * 1.05;
const fillHp = newMaxIncreasedHp || oldMaxHp <= 0;

const finalHp =
  fillHp || fixedHero.hp === undefined || fixedHero.hp <= 0 || fixedHero.hp >= finalMaxHp
    ? finalMaxHp
    : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0));

const heroWithRecalculatedStats = {
  ...fixedHero,
  maxHp: finalMaxHp,
  hp: finalHp,
  // ...
};
(heroWithRecalculatedStats as any).baseMaxHp = recalculated.resources.maxHp;
```

---

## 9. MagicStatue — після бафів статуї

**Файл:** `src/screens/MagicStatue.tsx`

### 9.1 Після застосування бафів статуї (newHp)

```ts
const recalculated = recalculateAllStats(currentHero, updatedBuffs);
const baseMax = {
  maxHp: recalculated.resources.maxHp,
  maxMp: recalculated.resources.maxMp,
  maxCp: recalculated.resources.maxCp,
};
const { maxHp: newMaxHp, maxMp: newMaxMp, maxCp: newMaxCp } = computeBuffedMaxResources(baseMax, updatedBuffs);

const wasFullHp = (currentHero.hp ?? 0) >= oldBuffedMax.maxHp;
const newHp = wasFullHp ? newMaxHp : Math.min(newMaxHp, currentHero.hp ?? newMaxHp);
```

### 9.2 Після зняття всіх бафів — clamp до базового max

```ts
const baseMax = {
  maxHp: currentHero.maxHp,
  maxMp: currentHero.maxMp,
  maxCp: currentHero.maxCp,
};
heroStore.updateHero({
  hp: Math.min(currentHero.hp, baseMax.maxHp),
  mp: Math.min(currentHero.mp, baseMax.maxMp),
  cp: Math.min(currentHero.cp, baseMax.maxCp),
  // ...
});
```

---

## 10. heroPersistence — збереження base max

**Файл:** `src/state/heroStore/heroPersistence.ts`

```ts
// maxHp/maxMp/maxCp — зберігаємо BASE (без бафів); hero.maxHp може бути buffed
maxHp: Number((hero as any).baseMaxHp ?? hero.maxHp ?? existingHeroJson.maxHp ?? 0),
maxMp: Number((hero as any).baseMaxMp ?? hero.maxMp ?? existingHeroJson.maxMp ?? 0),
maxCp: Number((hero as any).baseMaxCp ?? hero.maxCp ?? existingHeroJson.maxCp ?? 0),
```

---

## 11. Server — formula з calcResources (fallback maxHp)

**Файл:** `server/src/characters.ts`

```ts
// Якщо maxHp не збережено — обчислюємо з рівня (formula з calcResources)
const maxHp = rawMaxHp > 100 ? rawMaxHp : Math.max(100, 150 + level * 12);
const currentHp = rawHp > 0 ? Math.min(rawHp, maxHp) : maxHp;
```

---

## 12. Інші місця з hp: Math.min(...)

- **buffSkill.ts**: `curHeroHP = Math.min(maxHp, hero.hp ?? maxHp)`, `newHeroHP = Math.max(0, Math.min(maxHp, ...))`.
- **processMobAttack.ts**: `curHeroHP = Math.min(maxHp, hero.hp ?? maxHp)`.
- **StatusBars.tsx**: `nextHp = Math.min(buffedMaxHp, (currentHero.hp ?? buffedMaxHp) + hpRegen)`.
- **ConsumableItemModal.tsx**: `currentHp = Math.min(maxHp, hero.hp ?? maxHp)`.
- **TargetCard.tsx** (моб): `clampedHP = Math.max(0, Math.min(maxHP, hpValue))`.

---

## Схема потоків

1. **База:** `calcResources(...)` → base max (без бафів, без пасивок у самій формулі; пасивки окремо).
2. **Пасивки:** `applyPassiveSkillsToResources(resources, ...)` → **finalResources** (base max з пасивок).
3. **Clamp у перерахунку:** `clampedResources = { ...finalResources, hp: Math.min(finalResources.hp, finalResources.maxHp), ... }` → повертається як `recalculated.resources`.
4. **Бафи:** `computeBuffedMaxResources(recalculated.resources, buffs)` → **buffedMax**.
5. **Runtime hero:** `hero.maxHp` = buffedMax.maxHp, `hero.hp` clamp’иться по buffedMax; для збереження використовується `baseMaxHp` = recalculated.resources.maxHp.
