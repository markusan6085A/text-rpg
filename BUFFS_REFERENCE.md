# Референс: бафи — чищення, збереження, завантаження, UI, джерело істини

Один файл з усіма фрагментами коду для дебагу бафів (expiresAt, cleanup, persist, MagicStatue, StatusBars, SummonStatus).

---

## 1) Де бафи чистяться

### src/state/battle/helpers.ts (реекспорт)

```ts
// Реекспорт для зворотної сумісності
export {
  cleanupBuffs,
  applyBuffsToStats,
  computeBuffedMaxResources,
  persistSnapshot,
  sanitizeLog,
  sanitizeLine,
} from "./helpers/index";
```

### src/state/battle/helpers/index.ts

```ts
export { cleanupBuffs, applyBuffsToStats } from "./buffs";
export { computeBuffedMaxResources } from "./resources";
export { persistSnapshot, sanitizeLog, sanitizeLine } from "./persist";
```

### src/state/battle/helpers/buffs.ts — cleanupBuffs (повністю) + логіка expiresAt

```ts
import type { BattleBuff } from "../types";

export const cleanupBuffs = (buffs: BattleBuff[], now: number) => {
  const seenStack = new Set<string>();
  const seenId = new Set<number>();
  const seenName = new Set<string>();

  return buffs
    .filter((b) => b.expiresAt > now)
    .filter((b) => {
      const isToggleBuff = b.expiresAt === Number.MAX_SAFE_INTEGER;
      if (!isToggleBuff) return true;

      const hasStack = b.stackType ? seenStack.has(b.stackType) : false;
      const hasId = typeof b.id === "number" ? seenId.has(b.id) : false;
      const hasName = b.name ? seenName.has(b.name) : false;

      if (hasStack || hasId || hasName) return false;

      if (b.stackType) seenStack.add(b.stackType);
      if (typeof b.id === "number") seenId.add(b.id);
      if (b.name) seenName.add(b.name);
      return true;
  });
};
```

**Важливо:** `b.expiresAt > now` — якщо `expiresAt` в секундах (а не мс), бафи будуть викидатися одразу або жити занадто довго. У проекті `expiresAt` має бути в **мілісекундах** (timestamp).

---

## 2) Де бафи зберігаються / вантажаться в battle

### src/state/battle/persist.ts

**Ключ localStorage:** `l2_battle_state_v7_${heroName}` (або fallback `l2_battle_state_v7`).

```ts
const getBattleKey = (heroName?: string | null): string => {
  if (heroName) return `l2_battle_state_v7_${heroName}`;
  return "l2_battle_state_v7";
};

export const persistBattle = (data: Partial<BattleState>, heroName?: string | null) => {
  const key = getBattleKey(heroName);
  const dataWithHeroName = {
    ...data,
    heroName: heroName || data.heroName,
    version: BATTLE_VERSION,
  };
  setJSON(key, dataWithHeroName);
};

export const loadBattle = (heroName?: string | null): PersistedBattleState | null => {
  let currentHeroName = heroName;
  if (!currentHeroName) {
    try {
      const hero = useHeroStore.getState().hero;
      currentHeroName = hero?.name;
    } catch (e) {}
  }
  const key = getBattleKey(currentHeroName);
  const parsed = getJSON<PersistedBattleState | null>(key, null);
  // ... міграції, перевірка heroName/version
  return parsed;
};
```

**Формат у localStorage:** об'єкт з полями `heroName`, `version`, `heroBuffs`, `cooldowns`, `summon`, `summonBuffs`, `loadoutSlots`, `log` тощо. `heroBuffs` — масив `BattleBuff[]`.

### src/state/battle/helpers/persist.ts — persistSnapshot (що пишеться)

```ts
persist({
  heroName,
  zoneId, mob, mobIndex, mobHP, mobNextAttackAt, status, log,
  cooldowns, loadoutSlots, lastReward,
  heroBuffs: merged.heroBuffs,
  summon, summonBuffs, baseSummonStats, summonLastAttackAt,
  resurrection,
}, heroName);
```

### src/state/battle/store.ts (zustand store)

**State:** `heroBuffs` з initialState + відновлення з `loadBattle(heroName)`.

```ts
const saved = loadBattle(heroName);
const restoredState = saved && belongsToCurrentHero && isVersionCompatible ? {
  heroName: saved.heroName,
  summon: restoredSummon,
  summonBuffs: saved.summonBuffs || [],
  heroBuffs: restoredSummon ? (saved.heroBuffs || []) : (saved.heroBuffs || []).filter((b: any) => b.id !== 1262 && b.id !== 1332),
  cooldowns: saved.cooldowns || {},
  loadoutSlots: saved.loadoutSlots || initialState.loadoutSlots,
  log: saved.log || [],
} : {};

export const useBattleStore = create<BattleState>((set, get, api) => ({
  ...initialState,
  ...restoredState,
  ...createBattleActions(set, get, api),
}));
```

**Actions:** `heroBuffs` оновлюються всередині actions (processMobAttack, useSkill, buffSkill, startBattle, reset, regenTick, resurrect, summons тощо) — окремого `addBuff`/`removeBuff`/`clearExpired` в actions.ts немає; логіка розкидана по useSkill, processMobAttack, startBattle, reset. **cleanupBuffs** викликається в: processMobAttack, useSkill.ts, startBattle, regenTick, resurrect, heroPersistence (409), heroLoadAPI, heroLoad, MagicStatue, StatusBars, Stats, CharacterBuffs.

---

## 3) Де баф додається (статуя / скіли)

### src/screens/MagicStatue.tsx — "Получить баф" / "Удалить баф"

**Кнопка "Получить баф":** `applyAllBufferBuffs()`.

- Читає `saved = loadBattle(hero.name)`, `currentBuffs = cleanupBuffs(saved?.heroBuffs || [], now)`.
- Фільрує старі бафи за `stackType` (BUFFER_BUFFS).
- Формує нові бафи:

```ts
const newBuffs: BattleBuff[] = BUFFER_BUFFS.map((buffDef) => ({
  id: buffDef.id,
  name: buffDef.name,
  icon: buffDef.icon,
  stackType: buffDef.stackType,
  effects: buffDef.effects,
  expiresAt: now + BUFFER_BUFF_DURATION_SEC * 1000,  // мс!
  startedAt: now,
  durationMs: BUFFER_BUFF_DURATION_SEC * 1000,
  source: "buffer",
}));
```

**Куди кладуться бафи:**

1. **persistBattle({ ...saved, heroBuffs: updatedBuffs, ... }, hero.name)** — battle state в localStorage.
2. **heroStore.updateHero({ ..., heroJson: { ...existingHeroJson, heroBuffs: updatedBuffs } })** — heroJson.heroBuffs для персистентності та синку з сервером.

**Дані з data/bufferBuffs.ts:** `BUFFER_BUFF_DURATION_SEC = 3600` (1 година). `expiresAt` у MagicStatue задається як `now + BUFFER_BUFF_DURATION_SEC * 1000` — тобто в **мілісекундах**, це коректно.

Бафи від скілів додаються в бойових actions (useSkill, buffSkill, healSkill, attackSkill, processMobAttack, specialSkills, summons) — там теж використовується `expiresAt` у мс (зазвичай `Date.now() + duration * 1000`).

---

## 4) Де UI читає бафи (джерело істини)

### src/components/StatusBars.tsx — блок loadBattle, cleanupBuffs, battleBuffs/savedBuffs

```ts
// Завантажуємо бафи з battle state (включаючи бафи статуї) навіть поза боєм
const now = Date.now();
const savedBattle = loadBattle(hero.name);
const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
const battleBuffs = inBattle ? (useBattleStore.getState().heroBuffs || []) : savedBuffs;

const { maxHp, maxMp, maxCp } = calculateMaxResourcesWithPassives(
  { ...hero, maxHp: baseMaxHp, maxMp: baseMaxMp, maxCp: baseMaxCp },
  battleBuffs
);
```

**Джерело істини:** поза боєм — `savedBuffs` (loadBattle → cleanupBuffs); у бою — `useBattleStore.getState().heroBuffs` після cleanupBuffs.

### src/components/SummonStatus.tsx — battle state (summon, summonBuffs)

Бафи гравця (heroBuffs) тут не читаються. Читаються тільки:

- `useBattleStore((s) => s.summon)`
- `useBattleStore((s) => s.summonBuffs || [])`

Для відображення іконок бафів сумону використовується `cleanupSummonBuffs(summonBuffs, now)` (з helpers/summonBuffs).

---

## 5) Тестовий артефакт (вставити JSON з консолі)

Коли баф **ще є** — встав сюди вивід з консолі:

```json
// hero.heroJson.heroBuffs[0] або весь масив (коли баф є):
```

Коли баф **вже пропав** — той самий об’єкт або масив після зникнення:

```json
// useBattleStore.getState().heroBuffs[0] або hero.heroJson.heroBuffs (коли вже пропав):
```

**Що перевірити:** чи `expiresAt` в **мілісекундах** (велике число, ~13 цифр), а не в секундах; чи немає опечаток у ключах; чи cleanup не викидає бафи без `expiresAt` (у cleanupBuffs умова `b.expiresAt > now` — якщо `expiresAt` undefined, буде NaN > now = false, баф викидається).

---

## Тип BattleBuff (src/state/battle/types.ts)

```ts
export type BattleBuff = {
  id?: number;
  name?: string;
  icon?: string;
  stackType?: string;
  buffGroup?: string;
  effects: any[];
  expiresAt: number;   // має бути в мілісекундах (timestamp)
  startedAt?: number;
  durationMs?: number;
  stacks?: number;
  source?: "buffer" | "skill" | "summon";
  hpPerTick?: number;
  mpPerTick?: number;
  tickInterval?: number;
  lastTickAt?: number;
};
```
