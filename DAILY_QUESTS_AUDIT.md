# Аудит щоденних завдань — список файлів + код

## 1) Екран «Ежедневные задания»

### src/screens/character/DailyQuests.tsx

```tsx
export default function DailyQuests({ navigate }: { navigate: Navigate }) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);

  // Скидаємо щоденні завдання по ігровому часу (Europe/Warsaw)
  useEffect(() => {
    if (!hero) return;
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", ... });
    const today = formatter.format(new Date());
    if (resetDate < today) {
      updateHero({ dailyQuestsProgress: {}, dailyQuestsCompleted: [], dailyQuestsResetDate: today });
    }
  }, [hero, updateHero]);

  const progress = hero.dailyQuestsProgress || {};
  const completed = hero.dailyQuestsCompleted || [];

  const getQuestProgress = (quest: DailyQuest): number => {
    const currentProgress = progress[quest.id] || 0;
    return Math.min(currentProgress, quest.target);
  };

  const completeQuest = (quest: DailyQuest) => {
    const currentProgress = currentHero.dailyQuestsProgress?.[quest.id] ?? 0;
    // ...
    updateHero({ adena: newAdena, ..., dailyQuestsCompleted: [...currentCompleted, quest.id] });
  };
```

- **src/screens/Quests.tsx** — екран квестів
- **src/screens/character/CharacterQuests.tsx** — вкладка квестів
- **src/screens/QuestShop.tsx** — квест-шоп

---

## 2) Quest store / конфіг / логіка

### src/data/dailyQuests.ts

```ts
export const DAILY_QUESTS: DailyQuest[] = [
  {
    id: "daily_adena_farm",
    name: "Фарм адени",
    type: "adena",
    target: 100000,
    rewards: { sp: 50000 },
  },
  {
    id: "daily_kills",
    name: "Винищення мобів",
    type: "kills",
    target: 1000,
    rewards: { coinOfLuck: 1, adena: 15000 },
  },
  {
    id: "daily_damage",
    name: "Воїн",
    type: "damage",
    target: 500000,
  },
  { id: "daily_chat", name: "Болтун", type: "chat", target: 10 },
  { id: "daily_exchange", name: "Торговець", type: "exchange", target: 20 },
];
```

### src/utils/dailyQuests/updateDailyQuestProgress.ts

```ts
export function updateDailyQuestProgress(
  hero: Hero,
  questId: string,
  amount: number
): Record<string, number> {
  const currentProgress = hero.dailyQuestsProgress || {};
  const currentValue = currentProgress[questId] || 0;
  const completed = hero.dailyQuestsCompleted || [];

  if (completed.includes(questId)) return currentProgress;
  if (amount === 0) return currentProgress;

  return {
    ...currentProgress,
    [questId]: currentValue + amount,
  };
}
```

---

## 3) Де змінюється адена і daily_adena_farm

### baseAttack.ts / attackSkill.ts / summons.ts — victory-блок

```ts
const finalAdenaGain = Math.round(adenaGain * XP_RATE * premiumMultiplier);

// Щоденні завдання — в один updateHero разом з victoryUpdates
const curHeroForDaily = useHeroStore.getState().hero;
if (curHeroForDaily) {
  const p1 = updateDailyQuestProgress(curHeroForDaily, "daily_kills", 1);
  const p2 = updateDailyQuestProgress(
    { ...curHeroForDaily, dailyQuestsProgress: p1 },
    "daily_adena_farm",
    finalAdenaGain
  );
  (victoryUpdates as any).dailyQuestsProgress = p2;
}

Object.assign(victoryUpdates, {
  level, exp,
  sp: (curHero.sp ?? 0) + finalSpGain,
  adena: (curHero.adena ?? 0) + finalAdenaGain,
  mobsKilled: newMobsKilled,
  hp, mp, cp,
});

useHeroStore.getState().updateHero(victoryUpdates);
```

---

## 4) Де рахуються кілли (daily_kills)

Ті самі victory-блоки — `updateDailyQuestProgress(curHeroForDaily, "daily_kills", 1)`.

### daily_damage — baseAttack.ts, attackSkill.ts

```ts
if (curHero && damage > 0) {
  const updatedProgress = updateDailyQuestProgress(curHero, "daily_damage", damage);
  if (updatedProgress !== curHero.dailyQuestsProgress) {
    useHeroStore.getState().updateHero({ dailyQuestsProgress: updatedProgress });
  }
}
```

### daily_chat — Chat.tsx

```ts
if (curHero) {
  const updatedProgress = updateDailyQuestProgress(curHero, "daily_chat", 1);
  if (updatedProgress !== curHero.dailyQuestsProgress) {
    useHeroStore.getState().updateHero({ dailyQuestsProgress: updatedProgress });
  }
}
```

### daily_exchange — QuestShop.tsx

```ts
const updatedProgress = updateDailyQuestProgress(hero, "daily_exchange", 1);
if (updatedProgress !== hero.dailyQuestsProgress) {
  updates.dailyQuestsProgress = updatedProgress;
}
```

---

## 5) Hydration / save / load

### src/state/heroStore/heroHydration.ts

```ts
const dailyQuestsProgress = (hero as any).dailyQuestsProgress !== undefined && typeof (hero as any).dailyQuestsProgress === "object"
  ? (hero as any).dailyQuestsProgress
  : (hj.dailyQuestsProgress && typeof hj.dailyQuestsProgress === "object" ? hj.dailyQuestsProgress : {});

const hydratedHero: Hero = {
  ...hero,
  dailyQuestsProgress: dailyQuestsProgress as any,
  heroJson: {
    ...hj,
    dailyQuestsProgress,
    dailyQuestsCompleted,
    dailyQuestsResetDate,
  },
};
```

### src/state/heroStore/heroPersistence.ts

```ts
// При збереженні
dailyQuestsProgress: (hydrated as any).dailyQuestsProgress && typeof (hydrated as any).dailyQuestsProgress === "object"
  ? (hydrated as any).dailyQuestsProgress
  : (currentJson.dailyQuestsProgress ?? {}),
```

### src/state/heroStore/heroLoadAPI.ts

```ts
// Merge локального і серверного прогресу
const serverProgress = (fixedHero as any).dailyQuestsProgress ?? {};
const localProgress = (hydratedLocalHero as any)?.dailyQuestsProgress ?? {};
const mergedProgress: Record<string, number> = {};
allKeys.forEach((id) => {
  mergedProgress[id] = Math.max(Number(serverProgress[id]) || 0, Number(localProgress[id]) || 0);
});
```

---

## 6) API / сервер

- **server/src/characters.ts** — GET/PATCH персонажа, heroJson зберігається в БД
- Окремих роутів `/quests` немає — прогрес всередині `heroJson`

---

## 7) Типи Hero

### src/types/Hero.ts

```ts
// Валюта
adena: number;
coinOfLuck?: number;

// Щоденні завдання
dailyQuestsProgress?: Record<string, number>;  // questId -> progress
dailyQuestsCompleted?: string[];
dailyQuestsResetDate?: string;                 // YYYY-MM-DD

// Статистика
mobsKilled?: number;

heroJson?: any;  // dailyQuests* також синхронізуються в heroJson
```
