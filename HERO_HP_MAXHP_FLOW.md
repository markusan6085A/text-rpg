# Hero HP / maxHp / Resources — Повний потік даних

## 1. heroUpdate.ts — Підозрюваний №1

### Де рахується safeHp
**Рядки 106–110:**
```ts
const hpToUse = partial.hp !== undefined ? partial.hp : prev.hp;
const safeHp =
  hpToUse === undefined || hpToUse <= 0
    ? buffedMax.maxHp
    : Math.min(buffedMax.maxHp, Math.max(0, hpToUse));
```

### Clamp hp
- **Якщо НЕ needsRecalc** (рядки 53–64): `updated.hp = Math.max(0, partial.hp)` — тільки перевірка на ≥0, без clamp до maxHp.
- **Якщо needsRecalc** (рядки 106–134): `safeHp = Math.min(buffedMax.maxHp, Math.max(0, hpToUse))`, потім `hp: isLevelUp ? buffedMax.maxHp : safeHp`.

### Де викликається recalculateAllStats
**Рядок 88:**
```ts
const recalculated = recalculateAllStats(updated, savedBuffs);
```

### Важливий момент
- `baseMax` — з `recalculated.resources` (БЕЗ бафів).
- `buffedMax = computeBuffedMaxResources(baseMax, savedBuffs)` — maxHp/maxMp/maxCp З бафами.
- У hero записується `maxHp: buffedMax.maxHp` (buffed).
- Також `baseMaxHp = recalculated.resources.maxHp` (base) — окремо в `(updated as any).baseMaxHp`.

---

## 2. recalculateAllStats.ts — `src/utils/stats/recalculateAllStats.ts`

### calcResources / computeBuffedMaxResources
- **calcResources** (рядок 133): `resources = calcResources(grownBaseStats, level, hero.equipment, hero.activeDyes)` — base maxHp/maxMp/maxCp БЕЗ бафів.
- **computeBuffedMaxResources** (рядки 174–176): використовується для `currentMaxHp` у пасивних скілах (hpThreshold); ресурси з бафами тут НЕ перезаписуються.

### Clamp ресурсів
**Рядки 255–260:**
```ts
const clampedResources = {
  ...finalResources,
  hp: finalResources.maxHp,
  mp: finalResources.maxMp,
  cp: finalResources.maxCp,
};
```
Тобто `resources.hp/mp/cp` просто дорівнюють max — це не clamp поточного hp героя, а лише структура для повернення.

### Що повертається
```ts
return {
  baseStats: grownBaseStats,
  originalBaseStats: originalBaseStats,
  resources: clampedResources,  // maxHp/maxMp/maxCp БЕЗ бафів
  finalStats: finalStatsWithPercent,
  baseFinalStats: baseStatsWithPercent,
};
```

**Важливо:** `resources.maxHp` — це БАЗОВЕ значення БЕЗ бафів. Бафи застосовуються в heroUpdate/heroLoad через `computeBuffedMaxResources`.

### computeBuffedMaxResources (`src/state/battle/helpers/resources.ts`)
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

---

## 3. heroLoad.ts — merge local+server, hp/maxHp, бафи

### Джерело даних (рядки 84–93)
```ts
if (fixedHero.hp === undefined || fixedHero.hp === null) fixedHero.hp = Number(heroJson.hp ?? 0);
if (fixedHero.mp === undefined || fixedHero.mp === null) fixedHero.mp = Number(heroJson.mp ?? 0);
if (fixedHero.cp === undefined || fixedHero.cp === null) fixedHero.cp = Number(heroJson.cp ?? 0);
```

### computeBuffedMaxResources (рядки 208–218)
```ts
const baseMax = {
  maxHp: recalculated.resources.maxHp,
  maxMp: recalculated.resources.maxMp,
  maxCp: recalculated.resources.maxCp,
};
const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);
const finalMaxHp = buffedMax.maxHp;
const finalMaxMp = buffedMax.maxMp;
const finalMaxCp = buffedMax.maxCp;
```

### Фінальний hp (рядки 225–244)
```ts
// HP ніколи не зменшується при reload
const finalHp =
  fixedHero.hp === undefined || fixedHero.hp <= 0 || fixedHero.hp >= finalMaxHp
    ? finalMaxHp
    : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0));
```

### Що пишеться в hero (рядки 255–269)
```ts
maxHp: finalMaxHp,  // buffed!
maxMp: finalMaxMp,
maxCp: finalMaxCp,
hp: finalHp,
mp: finalMp,
cp: finalCp,
...
(heroWithRecalculatedStats as any).baseMaxHp = recalculated.resources.maxHp;  // base без бафів
```

---

## 4. heroLoadAPI.ts — merge local+server, hp/maxHp

### Local preferred (рядки 143–148)
```ts
hp: serverHp !== undefined ? Math.min(serverHp, buffedMax.maxHp) : Math.min(hydratedLocalHero.hp ?? buffedMax.maxHp, buffedMax.maxHp),
mp: serverMp !== undefined ? Math.min(serverMp, buffedMax.maxMp) : Math.min(hydratedLocalHero.mp ?? buffedMax.maxMp, buffedMax.maxMp),
cp: serverCp !== undefined ? Math.min(serverCp, buffedMax.maxCp) : Math.min(hydratedLocalHero.cp ?? buffedMax.maxCp, buffedMax.maxCp),
```

### Server preferred (рядки 345–357)
```ts
const finalHp =
  fillHp || fixedHero.hp === undefined || fixedHero.hp <= 0 || fixedHero.hp >= finalMaxHp
    ? finalMaxHp
    : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0));
```
`fillHp = newMaxIncreasedHp || oldMaxHp <= 0` — якщо max виріс (рівень/екіп), hp заповнюється до нового max.

---

## 5. heroPersistence.ts — heroJsonToSave, hp/maxHp

### Base max (БЕЗ бафів) — рядки 274–277
```ts
const baseMaxHp = Number((hero as any).baseMaxHp ?? existingHeroJson.maxHp ?? hero.maxHp ?? 1);
const baseMaxMp = Number((hero as any).baseMaxMp ?? existingHeroJson.maxMp ?? hero.maxMp ?? 1);
const baseMaxCp = Number((hero as any).baseMaxCp ?? existingHeroJson.maxCp ?? hero.maxCp ?? Math.max(1, Math.round(baseMaxHp * 0.6)));
```

### Clamp hp до base max — рядки 279–281
```ts
const hpToSave = Math.min(Math.max(0, Number(hero.hp ?? existingHeroJson.hp ?? 0)), baseMaxHp);
const mpToSave = Math.min(Math.max(0, Number(hero.mp ?? existingHeroJson.mp ?? 0)), baseMaxMp);
const cpToSave = Math.min(Math.max(0, Number(hero.cp ?? existingHeroJson.cp ?? 0)), baseMaxCp);
```

### heroJsonToSave — рядки 285–325
```ts
hp: hpToSave,       // clamp до baseMaxHp
mp: mpToSave,
cp: cpToSave,
maxHp: baseMaxHp,   // base БЕЗ бафів!
maxMp: baseMaxMp,
maxCp: baseMaxCp,
```

**Важливо:** У `heroJsonToSave` зберігаються `baseMaxHp/maxMp/maxCp` (БЕЗ бафів), а не buffed. `hp/mp/cp` обрізаються до base max — щоб сервер не різав їх через свій `Math.min(rawHp, maxHp)` і щоб F5 не відкочував.

---

## Підсумок схеми

| Місце | maxHp | hp | baseMaxHp |
|-------|-------|-----|-----------|
| **hero (in-memory)** | buffed (з бафами) | clamp до buffedMax | окремо в hero.baseMaxHp |
| **heroPersistence (save)** | baseMaxHp (БЕЗ бафів) | clamp до baseMaxHp | baseMaxHp |
| **recalculateAllStats** | resources.maxHp = base | N/A | originalBaseStats |
| **heroLoad** | finalMaxHp = buffedMax.maxHp | finalHp clamp до finalMaxHp | baseMaxHp в (hero as any) |
| **heroLoadAPI** | buffedMax.maxHp | finalHp clamp до finalMaxHp | baseMaxHp в (hero as any) |

**Правило:** У hero в пам'яті `maxHp` = buffed; при збереженні в heroJson — `maxHp` = base. Це уникнення перетирання buffed max як "постійного" і відкочування після F5.
