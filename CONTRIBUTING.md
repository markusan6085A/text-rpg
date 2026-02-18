# Підказки для розробки

## Одне джерело правди (HP, реген, бафи)

Щоб нічого не зламати і не роздвоїти логіку:

1. **HP / MP / CP** — живуть у `hero` у store. Запис лише через `updateHero`. Збереження — тільки через `heroPersistence` (localStorage та API). Завантаження — тільки через `heroLoad` та `heroLoadAPI`. Не вводи нових місць запису/читання ресурсів.

2. **Реген** — один модуль: `src/state/heroStore/heroRegen.ts` (`getHeroRegenPerSecond`). Використовується в бою (`regenTick`) і поза боєм (`StatusBars`). Не дублюй формули регену в інших файлах.

3. **Бафи** — активні бафи в `heroBuffs` (heroJson.heroBuffs + battle persist). Застосування статів: `applyBuffsToStats(hero.battleStats, heroBuffs)`. Бойові стати (екіп, пасивки) рахуються в `recalculateAllStats` і потрапляють у `hero.battleStats`. Не додавай інших джерел обчислення статів з бафами.

4. **Смерть і reload** — при смерті в бою ставиться `isDead: true`, hp=0. При завантаженні (F5) якщо герой мертвий — йому відновлюється 70% max HP і `isDead: false`. Ця логіка в `heroLoad` та `heroLoadAPI`.

## Документація

- **HERO_SAVE_LOAD_DATAFLOW.md** — повний data-flow: хто читає/пише `hero.hp`, `heroJson`, порядок викликів при старті, F5, бою, resurrect.
- **REFERENCE_STATE.md** — опорний стан проєкту; як повернутися до нього (`git checkout ref-hp-buffs-single-source`), якщо щось пішло не так.

## Тести

Критичний шлях покритий міні-тестами у `src/state/heroStore/__tests__/`. Перед рефакторингом load/save або регену — запусти `npm test` і переконайся, що тести проходять.
