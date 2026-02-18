# Аудит щоденних завдань — список файлів

## 1) Екран «Ежедневные задания»

- **src/screens/character/DailyQuests.tsx** — основний екран зі списком щоденних (рендер прогрес, кнопка «забрати нагороду»)
- **src/screens/Quests.tsx** — екран квестів (може містити щоденні)
- **src/screens/character/CharacterQuests.tsx** — вкладка квестів у Character (може роутити до DailyQuests)
- **src/screens/character/modals/QuestItemModal.tsx** — модалка квест-ітему
- **src/screens/QuestShop.tsx** — квест-шоп (обмін Quest Items)

## 2) Quest store / логіка щоденних

- **src/data/dailyQuests.ts** — конфіг щоденних: id, target, type («kill 1000», «collect 100000»)
- **src/utils/dailyQuests/updateDailyQuestProgress.ts** — оновлення прогресу
- **src/data/quests.ts** — звичайні квести (не щоденні)
- Нема окремого `questStore` / `dailyQuestStore` — прогрес зберігається в `hero.dailyQuestsProgress` через `useHeroStore`

## 3) Де змінюється адена (для «Фарм адени / зібрати 100 000»)

- **src/state/battle/actions/useSkill/baseAttack.ts** — victory-блок: `finalAdenaGain`, `victoryUpdates.adena`, `dailyQuestsProgress`
- **src/state/battle/actions/useSkill/attackSkill.ts** — те саме
- **src/state/battle/actions/summons.ts** — те саме
- **src/state/heroStore.ts** — `updateAdena`, `updateHero`
- **src/state/heroStore/heroPersistence.ts** — save/load (може перезаписувати при persist)
- **src/state/heroStore/heroLoadAPI.ts** — merge `dailyQuestsProgress` з сервера та локально
- **src/state/battle/helpers/processDrops.ts** — обробка дропу (адена з мобів)
- **src/screens/QuestShop.tsx** — обмін за адену / витрати адени

## 4) Де рахуються кілли мобів («Вбити 1000 мобів»)

- **src/state/battle/actions/useSkill/baseAttack.ts** — victory: `mobsKilled`, `daily_kills` у `updateDailyQuestProgress`
- **src/state/battle/actions/useSkill/attackSkill.ts** — victory: `daily_kills`
- **src/state/battle/actions/summons.ts** — victory: `daily_kills`
- **src/state/battle/actions/processMobAttack.ts** — смерть моба від reflect, але без exp/adena/mobsKilled (тільки `status: "victory"`)
- **src/state/battle/actions/startBattle.ts** — ініціалізація бою
- **src/types/Hero.ts** — `mobsKilled?: number`

## 5) API (прогрес на сервері / синхронізація)

- **Клієнт:**  
  - `src/utils/api.ts` — HTTP-клієнт (нема окремого `/quests`)
  - прогрес йде разом з героєм (PUT/PATCH персонажа)
- **Сервер:**  
  - **server/src/characters.ts** — маршрути `/characters`, GET/PATCH; heroJson (включно з dailyQuestsProgress) зберігається в БД
  - нема окремих `routes/daily*.ts`, `controllers/quests*`, `services/quests*`
  - запис прогресу: `character.heroJson` → Prisma `Character.heroJson`

## 6) Типи / моделі

- **src/types/Hero.ts**:
  - `adena: number`
  - `mobsKilled?: number`
  - `dailyQuestsProgress?: Record<string, number>` — questId → progress
  - `dailyQuestsCompleted?: string[]`
  - `dailyQuestsResetDate?: string` — YYYY-MM-DD
  - `heroJson?: any` — додаткові дані (включно з dailyQuests* для збереження)
