# План розбиття великих файлів

## 1. `src/state/battle/actions/useSkill.ts` (881 рядок)

### Розбити на:

#### `useSkill.ts` (головний файл, ~100 рядків)
- Експортує `createUseSkill`
- Імпортує та використовує хелпери
- Основний роутинг (base attack, heal, buff, attack)

#### `useBaseAttack.ts` (~200 рядків)
- Логіка базової атаки
- Обробка вампіризму
- Обробка перемоги після базової атаки

#### `useHealSkill.ts` (~150 рядків)
- Логіка хіл скілів
- Обчислення healAmount
- Оновлення HP/MP/CP

#### `useBuffSkill.ts` (~200 рядків)
- Логіка баф/дебаф скілів
- Обробка toggle скілів
- Обробка special ефектів

#### `useAttackSkill.ts` (~200 рядків)
- Логіка атакуючих скілів (magic/physical)
- Обчислення урону
- Обробка вампіризму
- Обробка перемоги

#### `useSkillHelpers.ts` (~100 рядків)
- `setAndPersist`
- `cooldownMs`
- Константи (SUMMON_SKILLS, SONIC_FOCUS_ID, тощо)
- Допоміжні функції

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 2. `src/state/heroStore.ts` (425 рядків)

### Розбити на:

#### `heroStore.ts` (головний файл, ~100 рядків)
- Експортує `useHeroStore`
- Інтерфейс `HeroState`
- Імпортує та використовує хелпери

#### `heroLoad.ts` (~150 рядків)
- `loadHero()` функція
- Логіка завантаження з localStorage
- Виправлення професій
- Відновлення ресурсів

#### `heroUpdate.ts` (~150 рядків)
- `updateHero()` функція
- Логіка `needsRecalc`
- Обробка `recalculateAllStats`
- Валідація HP/MP/CP

#### `heroInventory.ts` (~50 рядків)
- `equipItem()` функція
- `unequipItem()` функція

#### `heroSkills.ts` (~50 рядків)
- `learnSkill()` функція

#### `heroPersistence.ts` (~50 рядків)
- Збереження в localStorage
- Синхронізація статів

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 3. `src/state/battle/helpers.ts` (~157 рядків)

### Розбити на:

#### `helpers.ts` (головний файл, ~50 рядків)
- Експортує всі хелпери
- Реекспортує з підмодулів

#### `buffs.ts` (~50 рядків)
- `cleanupBuffs()`
- `applyBuffsToStats()`

#### `resources.ts` (~50 рядків)
- `computeBuffedMaxResources()`

#### `persist.ts` (~50 рядків)
- `persistSnapshot()`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Порядок рефакторингу:

1. **Спочатку `helpers.ts`** (найпростіший)
   - Створити підмодулі
   - Перемістити функції
   - Оновити імпорти

2. **Потім `heroStore.ts`**
   - Створити підмодулі
   - Перемістити функції
   - Оновити імпорти
   - Протестувати завантаження/оновлення героя

3. **Нарешті `useSkill.ts`** (найскладніший)
   - Створити підмодулі
   - Перемістити логіку
   - Оновити імпорти
   - Протестувати всі типи скілів

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Переваги:

✅ Менші файли легше читати
✅ Легше знаходити баги
✅ Легше тестувати окремі частини
✅ Менше конфліктів при merge
✅ Краща організація коду

