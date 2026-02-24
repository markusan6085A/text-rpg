# Інтеграція: universal heal, resourceHeal, статуя refill full

## A) Місце застосування скіла (для universal heal / resourceHeal)

### 1 файл / 1 функція: `src/state/battle/actions/useSkill.ts`

**Схема викликів:**
```
createUseSkill(skillId)
  → getSkillDefForBattle(...) / getSkillDef(skillId)  // читає скіл з DB
  → def.category === "heal"  → handleHealSkill(...)
  → def.category === "buff"  → handleBuffSkill(...)
  → def.category === "physical_attack" | "magic_attack" → handleAttackSkill(...)
  → BASE_ATTACK → handleBaseAttack(...)
  → Consumable → handleConsumable(...)
```

**Фрагмент — отримання skillId і def:**
```ts
// рядки 129-134
const learned = (hero.skills || []).find((s: any) => s.id === skillId);
if (!learned) return;

const def = getSkillDefForBattle(hero.profession, hero.klass, hero.race, skillId) ?? getSkillDef(skillId);
if (!def) return;
```

**Фрагмент — роутинг heal / buff / attack:**
```ts
// рядки 294-295, 439-456
const isHeal = def.category === "heal";
// ...
if (isHeal) {
  const handled = handleHealSkill(skillId, def, levelDef, state, hero, heroStats, mpCost, now, activeBuffs, computeMaxNow, cooldownMs, updateHero, setAndPersist, get);
  if (handled) return;
}
```

### Файл `src/state/battle/actions/useSkill/healSkill.ts`

**Орієнтир для universal heal / resourceHeal:**
- `def.id` — id скіла
- `levelDef.power` — сила (flat або %)
- `def.powerType` — `"flat"` | `"percent"` | `"damage"`
- `computeMaxNow(activeBuffs)` — maxHp, maxMp, maxCp з бафами
- `updateHero({ hp, mp, cp, ... })` — оновлення героя

**Фрагмент розрахунку хіла:**
```ts
// рядки 36-46
const basePower = typeof levelDef.power === "number" ? levelDef.power : 0;
const healBonus = heroStats?.healPower ?? 0;
const healAmountRaw =
  def.powerType === "percent" ? Math.round(maxHp * (basePower / 100)) : basePower;
let healAmount = Math.round(healAmountRaw * (1 + Math.max(0, healBonus) / 100));
```

**Фрагмент updateHero:**
```ts
// рядки 118-130
updateHero({ 
  hp: nextHeroHP, 
  mp: nextHeroMP, 
  cp: currentHeroCP,
  battleStats: recalculated.baseFinalStats  // якщо змінились від hpThreshold
});
```

**Місце для universal heal:**
- або новий `powerType === "resourceHeal"` / `resourceHeal: { hp?: number, mp?: number, cp?: number }`
- або окремий handler перед/після `handleHealSkill`, де по `def` визначається, що це universal heal і викликається `updateHero` з потрібними hp/mp/cp.

---

## B) Формат skillsDB / структура скілів

### Файл: `src/data/skills/index.ts`
```ts
export const skillsDB: Record<number, SkillDefinition> = addAdditionalSkillsToCanonical(baseSkillsDB, AdditionalSkills);
```

### Типи: `src/data/skills/types.ts`
```ts
export type SkillLevelDefinition = {
  level: number;
  requiredLevel: number;
  spCost: number;
  mpCost: number;
  power: number;
  hpCost?: number;
};

export type SkillDefinition = {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  type?: "active" | "passive";
  category?: "physical_attack" | "magic_attack" | "heal" | "buff" | "passive" | "toggle" | "debuff" | "special" | "none";
  powerType?: "damage" | "percent" | "flat" | "multiplier" | "none";
  element?: "fire" | "water" | "wind" | "earth" | "holy" | "dark";
  castTime?: number;
  cooldown?: number;
  duration?: number;
  target?: SkillTarget;
  scope?: SkillScope;
  stackType?: string;
  stackOrder?: number;
  buffGroup?: string;
  toggle?: boolean;
  mpPerTick?: number;
  hpPerTick?: number;
  cpPerTick?: number;
  tickInterval?: number;
  chance?: number;
  effects?: SkillEffectModifier[];
  triggers?: SkillTrigger[];
  hpThreshold?: number;
  hpCost?: number;
  requiresArmor?: "light" | "heavy" | "robe";
  requiresWeapon?: "sword" | "bow" | "staff" | ...;
  levels: SkillLevelDefinition[];
};
```

### Приклад heal-скіла: `src/data/skills/classes/HumanFighter/HumanKnight/skill_0045.ts`
```ts
export const skill_0045: SkillDefinition = {
  id: 45,
  code: "HK_0045",
  name: "Divine Heal",
  description: "Recover HP...",
  category: "heal",
  powerType: "damage",   // power = flat heal amount
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  icon: "/skills/skill0045.gif",
  levels: [
    { level: 1, requiredLevel: 28, spCost: 4000, mpCost: 75, power: 143 },
    { level: 2, requiredLevel: 28, spCost: 4000, mpCost: 79, power: 150 },
    // ...
  ],
};
```

### Приклад percent heal: `src/data/skills/classes/HumanMystic/Bishop/skill_1271.ts`
```ts
category: "heal",
powerType: "percent",  // power = % від maxHp
target: "party",
scope: "party",
cooldown: 3600,
levels: [{ level: 1, requiredLevel: 66, ... power: 50 }],
```

### Приклад buff з effects: `src/data/skills/classes/OrcMystic/Dominator/skill_1367.ts`
```ts
effects: [
  { stat: "healPower", mode: "multiplier", multiplier: 0.5 },
],
```

### SkillEffectModifier: `src/data/skills/types/modifiers.ts`
```ts
export type SkillEffectModifier = {
  stat: SkillStat;
  mode: "percent" | "flat" | "multiplier";
  value?: number;
  multiplier?: number;
  duration?: number;
  stackType?: string;
  stackOrder?: number;
  chance?: number;
  resistStat?: SkillStat;
};
```

**Як додати resourceHeal:**
- Додати в `SkillDefinition`: `resourceHeal?: { hp?: number; mp?: number; cp?: number }` (або `powerType: "resourceHeal"` + `resourceHeal`)
- В `handleHealSkill` (або новому handler) читати `def.resourceHeal` і викликати `updateHero` з відповідними hp/mp/cp.

---

## C) Статуя — бафи + updateHero

### Файл: `src/screens/MagicStatue.tsx`

**Handler `applyAllBufferBuffs` (рядки 40–149):**

1. Читає battle state: `loadBattle(hero.name)`, `currentBuffs`
2. Видаляє старі бафи з тим же `stackType`: `filteredBuffs`
3. Додає бафи статуї: `newBuffs` з `BUFFER_BUFFS`, `source: "buffer"`
4. Зберігає в battle: `persistBattle({ heroBuffs: updatedBuffs, ... }, hero.name)`
5. Синхронізує store: `useBattleStore.setState({ heroBuffs: updatedBuffs })`
6. Перераховує стати: `recalculateAllStats(currentHero, updatedBuffs)`
7. Обчислює buffed max: `computeBuffedMaxResources(baseMax, updatedBuffs)`
8. Визначає `wasFullHp` і `newHp`:
   ```ts
   const wasFullHp = (currentHero.hp ?? 0) >= oldBuffedMax.maxHp;
   const newHp = wasFullHp ? newMaxHp : Math.min(newMaxHp, currentHero.hp ?? newMaxHp);
   ```
9. Викликає `updateHero`:
   ```ts
   heroStore.updateHero({
     maxHp: recalculated.resources.maxHp,  // base
     maxMp: recalculated.resources.maxMp,
     maxCp: recalculated.resources.maxCp,
     hp: newHp,
     mp: newMp,
     cp: newCp,
     heroJson: { ...existingHeroJson, heroBuffs: updatedBuffs },
   });
   ```

**Для refill = full:**
- Замість логіки `wasFullHp` завжди ставити `hp: newMaxHp`, `mp: newMaxMp`, `cp: newMaxCp` після отримання бафів від статуї.

**Бафи статуї:** `src/data/bufferBuffs.ts`
```ts
export const BUFFER_BUFFS: BufferBuffDefinition[] = [
  { id: 10001, name: "Might", effects: [{ stat: "pAtk", mode: "percent", value: 20 }], ... },
  { id: 10003, name: "Bless the Body", effects: [{ stat: "maxHp", mode: "percent", value: 35 }], ... },
  { id: 10004, name: "Bless the Soul", effects: [{ stat: "maxMp", mode: "percent", value: 30 }], ... },
  // ...
];
```
