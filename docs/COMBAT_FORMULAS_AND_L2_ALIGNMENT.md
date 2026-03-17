# Порівняння формул бою з L2-логікою

Детальний розбір поточних формул та рекомендації для узгодження з Lineage 2 (L2DOP, L2J, калькулятори).

---

## 1. Фізичний урон (базова атака та скіли)

### L2-класика (усереднено)

```
Average Weapon Damage = P.Atk × 70 / P.Def
```

Для скілів:
```
damage = 70 × [pAtk + power_скіла] / (pDef + sDef) × інші_множники
```

Тобто захист враховується **лінійно**: більший pDef — менший урон.

### Ваша поточна формула

**Base Attack** (`baseAttack.ts`):

```ts
// Базовий урон: pAtk × variance (0.9–1.1)
baseDmg = pAtk × (1 - 0.1 + random×0.2)

// Захист моба (effectivePDef)
mobPDef = mobPDefRaw × MOB_DEFENSE_MULTIPLIER (1.8)

// Коефіцієнт урону
defenseReduction = pAtk / (pAtk + mobPDef × HERO_VS_MOB_DEFENSE_FACTOR (0.65))
finalMultiplier = clamp(defenseReduction, 0.3, 1.0)
damage = baseDmg × finalMultiplier
```

По суті у вас:
```
damage = pAtk × pAtk / (pAtk + 0.65 × pDef)
```
Це **не** L2-стиль і дає інший баланс.

**Скіли** (`calculatePhysicalDamage.ts`):

```ts
ratio = pAtk / pDef
heroBaseDamage = pAtk × SKILL_PHYSICAL_ATK_FACTOR (0.5) × (1 + ratio × 0.05)
base = skillPower + heroBaseDamage
raw = base × skillBonus × variance
// Захист не застосовується окремо — він частково в ratio
```

Тут pDef впливає через `ratio`, але формула відрізняється від L2.

### Як привести до L2

1. **Базова атака**

   Змінити на:
   ```
   baseDamage = 70 × pAtk / pDef
   ```
   або з variance:
   ```
   baseDamage = 70 × pAtk / pDef × (0.9 + random×0.2)
   ```

2. **Скіли**

   ```
   baseDamage = 70 × (pAtk + power_скіла) / pDef
   ```

3. **Підлаштування балансу**

   - У L2 коефіцієнт 70 для ranged, 77 для melee — можна змінити на 65–70 для вашого допа.
   - `MOB_DEFENSE_MULTIPLIER` і `HERO_VS_MOB_DEFENSE_FACTOR` можна прибрати або звести до 1.0, якщо використовувати чисту формулу `70×pAtk/pDef`.

**Файли для змін:**
- `src/state/battle/actions/useSkill/baseAttack.ts` (~рядки 156–164)
- `src/data/skills/calculate/calculatePhysicalDamage.ts`
- `src/data/balance.ts` — можливе додавання `PHYSICAL_DAMAGE_COEFFICIENT = 70`

---

## 2. Критичні удари

### L2DOP / L2-стиль

```
Base Damage = (P.Atk × 140 / P.Def) × Buffs
Critical Damage = Base Damage × 2 + Critical Damage Bonus (flat)
```

Тобто:
- крит ≈ **×2 base**
- додатково: **flat bonus** і **crit damage multiplier** (з скілів, кристалів тощо).

### Ваша поточна формула

**Base Attack** (`helpers.ts`, `getCritMultiplier`):

```ts
// Базовий крит: 1.5×
multiplier = 1.5 + critPower / 5000  // кап 2.0×
```

**Скіли** (`getSkillCritMultiplier`):

```ts
multiplier = 2.0 + critPower / 1500  // кап 3.0×
```

Тобто крит вже є множником базового урону, але:
- база 1.5× замість 2×;
- `critPower` впливає як додатковий множник, а не як flat bonus.

### Як узгодити з L2DOP

1. **Базовий крит: ×2**

   Замість 1.5× використовувати 2.0×:

   ```ts
   baseCritMult = 2.0
   ```

2. **Модель L2: base × 2 + critPower (flat)**

   ```
   critDamage = baseDamage × 2 + critPower
   ```

   Або через множник:
   ```
   critDamage = baseDamage × (2 + critPower / baseDamage)
   ```
   тобто `multiplier = 2 + (critPower / baseDamage)`.

3. **Гібрид (зручніше для балансу)**

   ```
   critDamage = baseDamage × (2.0 + critPower / 5000)
   ```
   З капом 2.5× або 3.0× — близько до L2, але простіше балансувати.

**Файли для змін:**
- `src/state/battle/actions/useSkill/helpers.ts` — `getCritMultiplier`, `getSkillCritMultiplier`
- Місця використання: `baseAttack.ts`, `attackSkill.ts` (крит для скілів)

---

## 3. Base HP / MP (з calc_stats.php)

### Що таке calc_stats.php

Це скрипт з L2-серверів (L2J, інші допи), який рахує базові HP/MP за **поліноміальними формулами** від рівня та статів (CON, MEN). Коефіцієнти різняться за хроніками та класами.

### Ваша поточна формула

**calcResources.ts**:

```ts
conBonus = 1 + (CON - 40) × 0.01
menBonus = 1 + (MEN - 25) × 0.01
baseHp = 200 + lvl × 56
baseMp = 100 + lvl × 8
maxHp = baseHp × conBonus
maxMp = baseMp × menBonus
```

Лінійна залежність від рівня + невеликий бонус від CON/MEN.

### L2-стиль (типові поліноми)

Приклад для Interlude-подібних серверів:

```
baseHp = baseHp_const + baseHp_lvl × lvl + baseHp_lvl2 × lvl² + …
baseMp = baseMp_const + baseMp_lvl × lvl + …
maxHp = baseHp × (1 + (CON - base_CON) × factor)
maxMp = baseMp × (1 + (MEN - base_MEN) × factor)
```

Коефіцієнти зазвичай беруть з `calc_stats.php` або з калькуляторів (L2calc, lineage2wiki тощо).

### Як наблизитися до L2

1. **Знайти коефіцієнти для вашої хроніки**

   - Подивитися в репо L2DOP / L2J на `calc_stats.php` або аналог.
   - Або взяти з публічних калькуляторів (Interlude, High Five тощо).

2. **Замінити лінійну формулу на поліном**

   Наприклад:

   ```ts
   // Приклад для Interlude (значення треба підтвердити)
   baseHp = 100 + lvl * 50 + lvl * lvl * 0.3
   baseMp = 50 + lvl * 6 + lvl * lvl * 0.05
   ```

3. **Уточнити CON/MEN**

   У L2 зазвичай:
   - CON: ~+1% HP за одиницю CON вище базового.
   - MEN: ~+1% MP за одиницю MEN вище базового.

**Файли для змін:**
- `src/utils/stats/calcResources.ts`

---

## 4. Захист від урону (mob → hero)

У L2 захист зазвичай:

```
mitigated = raw × 100 / (100 + defense)
```

У вас це вже є в `processMobAttack.ts`:

```ts
mitigated = raw × (100 / (100 + defense))
```

Тут ви вже близькі до L2.

---

## 5. Короткий чекліст змін для L2-відчуття

| Елемент        | Поточний стан                 | Рекомендація для L2         |
|----------------|-------------------------------|-----------------------------|
| Фіз. урон      | pAtk/(pAtk + k×pDef)         | `70 × pAtk / pDef`         |
| Крит (база)    | 1.5× → 2.0× кап              | 2× base + critPower flat   |
| Base HP/MP     | Лінійна від lvl               | Поліноми з calc_stats       |
| Захист (def)   | 100/(100+def)                 | Без змін                    |

---

## 6. Джерела для перевірки формул

- [DAMAGE FORMULAS — Lineage 2 Library](https://www.lineage2library.com/knowledge/damage-formulas-old-source)
- [Non-Skill Attacks](http://l2p.lacrafter.ru/nonskillattacks.html)
- L2J / L2DOP: `Formulas.java`, `calc_stats.php`
- [L2calc / lineage2wiki](https://lineage2wiki.org/interlude/calculator/) — для HP/MP поліномів

---

*Документ створено для порівняння з L2-логікою та планової адаптації формул.*
