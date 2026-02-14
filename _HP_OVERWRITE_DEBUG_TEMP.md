# Відлагодження HP після F5 — збірка всіх релевантних місць

> Титовий файл. Вкажи конкретний рядок/місце, яке дає падіння HP.

---

## 1) Завантаження героя (локал + API)

### src/state/heroStore/heroLoad.ts

```typescript
// Рядки 190-258 — формування finalHp і heroWithRecalculatedStats
    const savedBuffs = cleanupBuffs(Array.from(bestByKey.values()), now);
    const recalculated = recalculateAllStats(fixedHero, []);
    
    const baseMax = {
      maxHp: recalculated.resources.maxHp,
      maxMp: recalculated.resources.maxMp,
      maxCp: recalculated.resources.maxCp,
    };
    const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);
    
    const finalMaxHp = buffedMax.maxHp;
    const finalMaxMp = buffedMax.maxMp;
    const finalMaxCp = buffedMax.maxCp;
    
    const finalHp =
      fixedHero.hp === undefined ||
      fixedHero.hp <= 0 ||
      fixedHero.hp >= finalMaxHp
        ? finalMaxHp
        : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0));
    
    const heroWithRecalculatedStats: Hero = {
      ...fixedHero,
      maxHp: recalculated.resources.maxHp,  // Базове БЕЗ бафів
      maxMp: recalculated.resources.maxMp,
      maxCp: recalculated.resources.maxCp,
      hp: finalHp,   // <-- тут встановлюється HP
      mp: finalMp,
      cp: finalCp,
    };
```

---

### src/state/heroStore/heroLoadAPI.ts

**Гілка "local preferred" (рядки 112-159):**
```typescript
        const recalculated = recalculateAllStats(hydratedLocalHero, []);
        const baseMax = { maxHp: recalculated.resources.maxHp, maxMp: recalculated.resources.maxMp, maxCp: recalculated.resources.maxCp };
        const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);
        // ...
        hp: serverHp !== undefined ? Math.min(serverHp, buffedMax.maxHp) : Math.min(hydratedLocalHero.hp ?? buffedMax.maxHp, buffedMax.maxHp),
```

**Гілка "server" (рядки 365-358):**
```typescript
    const finalHp =
      fillHp ||
      fixedHero.hp === undefined ||
      fixedHero.hp <= 0 ||
      fixedHero.hp >= finalMaxHp
        ? finalMaxHp
        : Math.min(finalMaxHp, Math.max(fixedHero.hp, 0));
    
    const heroWithRecalculatedStats: Hero = {
      ...fixedHero,
      maxHp: recalculated.resources.maxHp,
      hp: finalHp,   // <-- тут встановлюється HP
      mp: finalMp,
      cp: finalCp,
      // ...
    };
```

`fillHp`:
```typescript
    const oldMaxHp = fixedHero.maxHp ?? 0;
    const newMaxIncreasedHp = recalculated.resources.maxHp > oldMaxHp * 1.05;
    const fillHp = newMaxIncreasedHp || oldMaxHp <= 0;
```

---

### src/state/heroStore/heroPersistence.ts

**buildBackupHeroJson (рядки 32-45):**
```typescript
function buildBackupHeroJson(hero: Hero): Record<string, unknown> {
  return {
    exp: hero.exp ?? 0,
    level: hero.level ?? 1,
    sp: hero.sp ?? 0,
    adena: hero.adena ?? (hero as any).heroJson?.adena ?? 0,
    coinOfLuck: hero.coinOfLuck ?? 0,
    skills: Array.isArray(hero.skills) ? hero.skills : [],
    mobsKilled,
    equipment: hero.equipment && typeof hero.equipment === 'object' ? hero.equipment : {},
    activeDyes: Array.isArray(hero.activeDyes) ? hero.activeDyes : [],
  };
  // NOTE: hp, maxHp НЕ в buildBackupHeroJson
}
```

**heroJsonToSave (рядки 265-304):**
```typescript
    const heroJsonToSave = {
      ...existingHeroJson,
      hp: Number(hero.hp ?? existingHeroJson.hp ?? 0),
      mp: Number(hero.mp ?? existingHeroJson.mp ?? 0),
      cp: Number(hero.cp ?? existingHeroJson.cp ?? 0),
      maxHp: Number(hero.maxHp ?? existingHeroJson.maxHp ?? 0),
      maxMp: Number(hero.maxMp ?? existingHeroJson.maxMp ?? 0),
      maxCp: Number(hero.maxCp ?? existingHeroJson.maxCp ?? 0),
      // ...
    };
```

**saveHeroToLocalStorageOnly (рядки 46-71):**
```typescript
  accounts[accIndex].hero = { ...hydrated, heroJson };
  setJSON("l2_accounts_v2", accounts);
```

---

## 2) Розрахунки статів/ресурсів

### src/state/heroFactory.ts — calcDerivedFromBase

```typescript
export function calcDerivedFromBase(base: HeroBaseStats, level: number) {
  const lvl = Math.max(1, level);
  const conBonus = 1 + (base.CON - 10) * 0.03;
  const menBonus = 1 + (base.MEN - 10) * 0.03;
  const baseHp = 120 + lvl * 34;
  const baseMp = 120 + lvl * 16;
  const maxHp = Math.round(baseHp * conBonus);
  const maxMp = Math.round(baseMp * menBonus);
  const maxCp = Math.round(maxHp * 0.6);
  return { hp: maxHp, maxHp, mp: maxMp, maxMp, cp: maxCp, maxCp };
}
```

---

### src/utils/stats/calcResources.ts

```typescript
export function calcResources(baseStats, level, equipment?, activeDyes?) {
  const conBonus = 1 + (baseStats.CON - 40) * 0.01;
  const menBonus = 1 + (baseStats.MEN - 25) * 0.01;
  const baseHp = 200 + lvl * 56;
  const baseMp = 100 + lvl * 8;
  let maxHp = Math.round(baseHp * conBonus);
  let maxMp = Math.round(baseMp * menBonus);
  let maxCp = Math.round(maxHp * 0.6);
  // Equipment: flat maxHp, maxHpPercent
  // Set bonuses
  // activeDyes (CON/MEN)
  return { hp: maxHp, maxHp, mp: maxMp, maxMp, cp: maxCp, maxCp };
}
```

---

### src/utils/stats/recalculateAllStats.ts

```typescript
  // 2. resources = calcResources(grownBaseStats, level, hero.equipment, hero.activeDyes);
  const resources = calcResources(grownBaseStats, level, hero.equipment, hero.activeDyes);
  // ...
  // 4. applyPassiveSkillsToResources
  const finalResources = applyPassiveSkillsToResources(resources, learnedSkills, [], hero.equipment);
  // ...
  const clampedResources = {
    ...finalResources,
    hp: Math.min(finalResources.hp, finalResources.maxHp),
    mp: Math.min(finalResources.mp, finalResources.maxMp),
    cp: Math.min(finalResources.cp, finalResources.maxCp),
  };
  return { resources: clampedResources, ... };
```

---

## 3) Battle / бафи / відновлення HP

### src/state/battle/persist.ts — loadBattle

```typescript
export const loadBattle = (heroName?: string | null): PersistedBattleState | null => {
  const key = getBattleKey(currentHeroName);  // l2_battle_state_v7_${heroName}
  const parsed = getJSON<PersistedBattleState | null>(key, null);
  return parsed;  // Повертає heroBuffs, cooldowns, summon тощо
};
```

---

### src/state/battle/helpers/buffs.ts

- `cleanupBuffs(buffs, now)` — фільтрує прострочені
- `applyBuffsToStats(stats, buffs)` — застосовує flat/percent/multiplier до maxHp, maxMp, maxCp

---

### src/state/battle/helpers/resources.ts — computeBuffedMaxResources

```typescript
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

## 4) Store / порядок викликів

### src/state/heroStore.ts

```typescript
  loadHero: () => {
    const h = getHeroFromLocalStorage();  // heroLoad.loadHero()
    const hydrated = hydrateHero(h) ?? h;
    if (hydrated) set({ hero: hydrated });
  },
```

- `setHero(h)` — set({ hero: hydrateHero(h) })
- `updateHero(partial)` — викликає saveHeroToLocalStorageOnly + debouncedSave

---

### src/App.tsx — ініціалізація

```typescript
  React.useEffect(() => {
    // 1) Одразу показуємо локального героя
    const localHero = getHeroFromLocalStorage();  // heroLoad
    const heroToShow = hydrateHero(localHero) ?? localHero;
    if (heroToShow && alive) setHero(heroToShow);
    else if (alive) loadHero();

    // 2) Показуємо UI
    if (alive) setIsLoading(false);

    // 3) API в фоні — коли прийде відповідь, оновимо store
    if (authStore.isAuthenticated && characterStore.characterId) {
      loadHeroFromAPI().then((loadedHero) => {
        if (loadedHero) setHero(loadedHero);  // <-- тут може перезаписати HP серверним героєм
      });
    }
  }, [/* ... */]);
```

---

## Швидкий чекліст "де може падати HP"

| # | Файл | Рядок (прибл.) | Що робить |
|---|------|----------------|-----------|
| 1 | heroLoad.ts | 226-229 | `finalHp = fixedHero.hp >= finalMaxHp ? finalMaxHp : Math.min(finalMaxHp, fixedHero.hp)` |
| 2 | heroLoad.ts | 252-254 | `hp: finalHp` в heroWithRecalculatedStats |
| 3 | heroLoadAPI.ts | 147-151 | Local preferred: hp з serverHp або hydratedLocalHero.hp |
| 4 | heroLoadAPI.ts | 334-339 | Server: fillHp / finalHp / heroWithRecalculatedStats.hp |
| 5 | heroLoadAPI.ts | 356-363 | `fillHp = newMaxIncreasedHp \|\| oldMaxHp <= 0` — якщо recalculated.maxHp < oldMaxHp, fillHp=false, тоді hp = Math.min(finalMaxHp, fixedHero.hp) |
| 6 | heroLoadAPI.ts | 256-265 | setHero(mergedHero) / setHero(hydratedHero) — фінальний запис у store |
| 7 | App.tsx | 247-261 | setHero(heroToShow) локальним героєм, потім setHero(loadedHero) з API |
| 8 | heroLoadAPI.ts | 324 | `fixedHero = fixHeroProfession({ ...heroData })` — heroData з сервера, hp може бути старим |

---

## Ключові змінні

- `fixedHero.hp` — HP з heroJson/сервера
- `recalculated.resources.maxHp` — базовий max без бафів (екіп + скіли + dyes)
- `buffedMax.maxHp` — max з бафами
- `finalMaxHp` = buffedMax.maxHp
- `fillHp` = true, якщо recalculated.maxHp > oldMaxHp*1.05 або oldMaxHp<=0
- `finalHp` = fillHp ? finalMaxHp : Math.min(finalMaxHp, fixedHero.hp)

**Якщо `recalculated.resources.maxHp` менший за очікуваний (наприклад, втрачається екіп/скіли/бафи), то finalMaxHp менший, і HP обрізається до finalMaxHp.**
